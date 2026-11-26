"use client";

/**
 * Research session orchestrator (K09). Runs in the browser so the three checkpoints can wait for the student as
 * long as they like; every server call is short and stateless. Every step is logged (Receipts + Prompt Ledger).
 */
import { useCallback, useRef, useState } from "react";
import { refList, toSource } from "@/components/app/tabs/xray/refList";
import type { AgentRun, ScribeResult } from "@/lib/agents/agents";
import type { DebateResult, DebateTurn } from "@/lib/agents/debate";
import type { Candidate } from "@/lib/agents/scout";
import { ACTIONS } from "@/lib/integrity/receipts";
import type { Autonomy, BlockedFabrication, Challenge, Claim, EvidenceCard, Phase, Plan, Receipt, SourceRecord } from "@/lib/types";
import { explainError, HttpError, type SessionStep } from "./errors";
import { canExport, claimsFromEvidence } from "./machine";

export interface ResearchState {
  sessionId: string;
  phase: Phase;
  question: string;
  plan?: Plan;
  /** Whether the plan came from the AI or from Rules mode (the question as typed). */
  planBy?: "ai" | "rules";
  candidates: SourceRecord[];
  decisions: Record<string, "accepted" | "rejected">;
  evidence: EvidenceCard[];
  claims: Claim[];
  blocked: BlockedFabrication[];
  /** Debate mode (K14): Advocate vs Skeptic turns per claim id, at most two rounds. */
  debates?: Record<string, DebateTurn[]>;
  /** Plain-English notes: Rules mode, what code removed, registry problems. */
  notes: string[];
  busy?: string;
  error?: string;
  /** Which step failed, so the banner can offer Try again. */
  failed?: SessionStep;
  /** Set when a recorded session is shown instead of a live one (K32). Nothing in it runs or is saved. */
  sample?: { recordedAt: string; autonomy: Autonomy; receipts: Receipt[] };
}

/** A finished live session, copied with ?record=1, replayed read-only as the SAMPLE fallback. */
export type RecordedSession = Omit<ResearchState, "busy" | "error" | "failed" | "sample"> & { recordedAt: string; autonomy: Autonomy; receipts?: Receipt[] };

/** Before the first question there is no session yet; the id is made when the student presses Start (never during prerender). */
const INITIAL: ResearchState = { sessionId: "", phase: "ask", question: "", candidates: [], decisions: {}, evidence: [], claims: [], blocked: [], notes: [] };
const fresh = (): ResearchState => ({ sessionId: `rs-${Date.now().toString(36)}`, phase: "ask", question: "", candidates: [], decisions: {}, evidence: [], claims: [], blocked: [], notes: [] });

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (!res.ok || json.ok === false) throw new HttpError(res.status, json.error ?? `Request failed (HTTP ${res.status}).`);
  return json;
}

/** Log an agent run: an AI call with its scrubbed prompt, or a Rules-mode fallback. */
function logRun(sessionId: string, actor: Receipt["actor"], action: string, run: AgentRun<unknown>) {
  if (run.mode === "ai") {
    refList.log({ sessionId, actor, action, aiUsed: true, model: run.model, prompt: run.prompt, tokens: run.tokens, ms: run.ms, ok: true, detail: run.fallbackUsed ? "fallback model answered" : undefined });
  } else {
    refList.log({ sessionId, actor: "system", action: ACTIONS.fallbackRules, aiUsed: false, ms: run.ms, ok: true, detail: `${actor}: ${run.reason ?? "Rules mode"}` });
  }
  for (const f of run.injectionFlags ?? []) refList.log({ sessionId, actor: "system", action: ACTIONS.injectionFlagged, aiUsed: false, ms: 0, ok: true, detail: `${f.sourceId}: ${f.matches.join("; ")}` });
}

function notesFrom(run: AgentRun<unknown>, who: string): string[] {
  const n = run.mode === "rules" && run.reason ? [`${who}: ${run.reason}`] : [];
  if (run.sameFamilyAsScribe) n.push("The Skeptic ran on the same model family as the Scribe today (its own model was busy), so its challenge is less independent.");
  return [...n, ...run.dropped];
}

export function useResearch(autonomy: Autonomy) {
  const [s, setS] = useState<ResearchState>(INITIAL);
  // The ref always holds the latest state, updated together with it, so async steps never read stale state.
  const ref = useRef(s);
  const aiOff = autonomy === "off";
  const replace = useCallback((next: ResearchState) => {
    ref.current = next;
    setS(next);
  }, []);
  const patch = useCallback(
    (p: Partial<ResearchState> | ((x: ResearchState) => Partial<ResearchState>)) => replace({ ...ref.current, ...(typeof p === "function" ? p(ref.current) : p) }),
    [replace],
  );
  const retryRef = useRef<(() => void) | undefined>(undefined);
  const fail = useCallback((step: SessionStep, e: unknown, retry: () => void) => {
    retryRef.current = retry;
    patch({ busy: undefined, error: explainError(step, e), failed: step });
  }, [patch]);

  /** Step 1: ask. The Planner proposes; nothing is searched yet. */
  const ask = useCallback(
    async (question: string) => {
      const base = { ...fresh(), question };
      replace({ ...base, phase: "planning", busy: aiOff ? "Preparing the search…" : "The Planner is proposing a search plan…" });
      refList.log({ sessionId: base.sessionId, actor: "student", action: "asked_question", aiUsed: false, ms: 0, ok: true, detail: `${question} · autonomy ${autonomy}` });
      try {
        const run = await post<AgentRun<Plan>>("/api/agents/planner", { sessionId: base.sessionId, aiOff, question });
        logRun(base.sessionId, "planner", "proposed_plan", run);
        if (run.data.unclear) {
          // Nothing to search (K54): back to the question, with the reason. No plan, no sources, no claims.
          patch({ phase: "ask", busy: undefined, error: `Veracite could not turn this into a search, so nothing was searched. ${run.data.rationale} Try a full question, for example: “Does generative AI help or hurt student learning?”` });
          return;
        }
        patch((x) => ({ plan: run.data, planBy: run.mode, phase: "cp1_plan", busy: undefined, notes: [...x.notes, ...notesFrom(run, "Planner")] }));
      } catch (e) {
        fail("plan", e, () => void ask(question));
      }
    },
    [aiOff, autonomy, replace, patch, fail],
  );

  /** Checkpoint 1 → Scout + Verifier. */
  const approvePlan = useCallback(async (plan: Plan) => {
    const { sessionId, sample } = ref.current;
    if (sample) return patch((x) => ({ notes: [...x.notes, "This is a SAMPLE session: nothing is searched. Ask a question to run a live one."] }));
    patch({ plan, phase: "searching", busy: "Searching Crossref and OpenAlex, then verifying every result…", error: undefined, failed: undefined });
    refList.log({ sessionId, actor: "student", action: ACTIONS.approvePlan, aiUsed: false, ms: 0, ok: true, detail: plan.queries.join(" | ") });
    try {
      const t0 = Date.now();
      const r = await post<{ candidates: Candidate[]; problems: string[] }>("/api/sources/search", { queries: plan.queries, yearFrom: plan.filters.yearFrom });
      const candidates = r.candidates.map((c) => toSource(c.verification.matched ? c.verification : { ...c.verification, matched: c.record }));
      const counts = candidates.reduce<Record<string, number>>((m, c) => ((m[c.verification.status] = (m[c.verification.status] ?? 0) + 1), m), {});
      refList.log({ sessionId, actor: "verifier", action: "checked_references", aiUsed: false, ms: Date.now() - t0, ok: true, detail: `${candidates.length} found: ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(", ")}` });
      patch((x) => ({ candidates, phase: "cp2_sources", busy: undefined, notes: [...x.notes, ...r.problems, ...(candidates.length ? [] : ["No sources found. Edit the search terms and try again."])] }));
    } catch (e) {
      fail("search", e, () => void approvePlan(plan));
    }
  }, [patch, fail]);

  /** Checkpoint 2, one click per source: accepting adds it to the reference list right away. */
  const decide = useCallback((src: SourceRecord, decision: "accepted" | "rejected") => {
    const { sessionId, sample } = ref.current;
    if (sample) return patch((x) => ({ decisions: { ...x.decisions, [src.id]: decision } })); // SAMPLE: nothing is saved
    if (decision === "accepted") refList.approveSource(src);
    else {
      refList.remove(src.id);
      refList.log({ sessionId, actor: "student", action: ACTIONS.rejectSource, aiUsed: false, ms: 0, ok: true, detail: src.id });
    }
    patch((x) => ({ decisions: { ...x.decisions, [src.id]: decision } }));
  }, [patch]);

  /** Checkpoint 2 done → Reader → (Co-pilot) Scribe → Skeptic → checkpoint 3. Off: straight to export. */
  const continueWithSources = useCallback(async () => {
    const x = ref.current;
    const approved = x.candidates.filter((c) => x.decisions[c.id] === "accepted");
    if (x.sample) return patch((y) => ({ notes: [...y.notes, "This is a SAMPLE session: the agents do not run. Ask a question to run a live one."] }));
    if (aiOff) return patch({ phase: "export" });
    try {
      patch({ phase: "reading", busy: "The Reader is pulling exact quotes from your approved sources…", error: undefined, failed: undefined });
      const read = await post<AgentRun<EvidenceCard[]>>("/api/agents/reader", { sessionId: x.sessionId, question: x.question, sources: approved });
      logRun(x.sessionId, "reader", "extracted_evidence", read);
      let claims: Claim[];
      let blocked: BlockedFabrication[] = [];
      const notes = notesFrom(read, "Reader");
      if (autonomy === "copilot") {
        patch({ evidence: read.data, phase: "drafting", busy: "The Scribe is drafting a labelled brief from your approved evidence only…" });
        const draft = await post<AgentRun<ScribeResult>>("/api/agents/scribe", { sessionId: x.sessionId, question: x.question, sources: approved, evidence: read.data });
        logRun(x.sessionId, "scribe", "drafted_brief", draft);
        for (const b of draft.data.blocked) refList.log({ sessionId: x.sessionId, actor: "scribe", action: ACTIONS.blockedCitation, aiUsed: false, ms: 0, ok: true, detail: `${b.citedId}: ${b.claimText.slice(0, 80)}` });
        claims = draft.data.claims;
        blocked = draft.data.blocked;
        notes.push(...notesFrom(draft, "Scribe"));
      } else {
        claims = claimsFromEvidence(read.data, approved);
      }
      if (claims.length) {
        patch({ evidence: read.data, claims, blocked, phase: "challenging", busy: "The Skeptic is challenging every claim…" });
        const sk = await post<AgentRun<Challenge[]> & { claims: Claim[] }>("/api/agents/skeptic", { sessionId: x.sessionId, sources: approved, claims, round: 1 });
        logRun(x.sessionId, "skeptic", "challenged_claims", sk);
        claims = sk.claims;
        notes.push(...notesFrom(sk, "Skeptic"));
      }
      patch((y) => ({ evidence: read.data, claims, blocked, phase: claims.length ? "cp3_claims" : "export", busy: undefined, notes: [...y.notes, ...notes, ...(claims.length ? [] : ["No claims could be drawn from the approved sources' text. None of their abstracts has a sentence that answers your question, so Veracite wrote nothing instead of guessing. Try a more specific question, or approve different sources."])] }));
    } catch (e) {
      // Back to checkpoint 2, so Try again re-runs the agents on the same approved sources.
      patch({ phase: "cp2_sources" });
      fail("agents", e, () => void continueWithSources());
    }
  }, [aiOff, autonomy, patch, fail]);

  /** Checkpoint 3, per claim. */
  const decideClaim = useCallback((id: string, decision: "kept" | "dropped" | "edited", editedText?: string) => {
    const { sessionId, sample } = ref.current;
    if (!sample) refList.log({ sessionId, actor: "student", action: decision === "kept" ? ACTIONS.keepClaim : decision === "dropped" ? ACTIONS.dropClaim : ACTIONS.editClaim, aiUsed: false, ms: 0, ok: true, detail: id });
    patch((x) => ({ claims: x.claims.map((c) => (c.id === id ? { ...c, decision, editedText: decision === "edited" ? editedText : c.editedText } : c)) }));
  }, [patch]);

  const finishClaims = useCallback(() => {
    const x = ref.current;
    if (!canExport(x.claims)) return;
    if (!x.sample) refList.log({ sessionId: x.sessionId, actor: "student", action: ACTIONS.approveClaims, aiUsed: false, ms: 0, ok: true, detail: `${x.claims.filter((c) => c.decision !== "dropped").length} kept` });
    patch({ phase: "export" });
  }, [patch]);

  /** Debate mode (K14): one more round (at most two) on one claim; the student still decides. */
  const debateClaim = useCallback(async (claimId: string) => {
    const x = ref.current;
    if (x.sample) return patch((y) => ({ notes: [...y.notes, "This is a SAMPLE session: the debate does not run. Ask a question to run a live one."] }));
    const claim = x.claims.find((c) => c.id === claimId);
    const so = x.debates?.[claimId] ?? [];
    if (!claim || so.length >= 4) return;
    const round = (so.length ? 2 : 1) as 1 | 2;
    const approved = x.candidates.filter((c) => x.decisions[c.id] === "accepted");
    patch({ busy: `Round ${round}: the Advocate and the Skeptic are debating this claim…`, error: undefined, failed: undefined });
    try {
      const run = await post<AgentRun<DebateResult>>("/api/agents/debate", { sessionId: x.sessionId, sources: approved, claims: [claim], round, transcript: so });
      logRun(x.sessionId, "scribe", "debated_claim", run);
      for (const b of run.data.blocked) refList.log({ sessionId: x.sessionId, actor: b.agent, action: ACTIONS.blockedCitation, aiUsed: false, ms: 0, ok: true, detail: `${b.citedId}: ${b.claimText.slice(0, 80)}` });
      patch((y) => ({
        busy: undefined,
        debates: { ...y.debates, [claimId]: [...so, ...run.data.turns] },
        blocked: [...y.blocked, ...run.data.blocked],
        notes: [...y.notes, ...notesFrom(run, "Debate")],
      }));
    } catch (e) {
      fail("agents", e, () => void debateClaim(claimId));
    }
  }, [patch, fail]);

  const restart = useCallback(() => replace(fresh()), [replace]);
  const retry = useCallback(() => {
    const r = retryRef.current;
    retryRef.current = undefined;
    patch({ error: undefined, failed: undefined });
    r?.();
  }, [patch]);
  /** Show a recorded session read-only (K32). No server call, no receipt, nothing added to the list. */
  const loadSample = useCallback((rec: RecordedSession) => {
    const { recordedAt, autonomy: recordedWith, receipts = [], ...state } = rec;
    replace({ ...state, sessionId: `sample-${recordedAt}`, busy: undefined, error: undefined, failed: undefined, sample: { recordedAt, autonomy: recordedWith, receipts } });
  }, [replace]);
  const backToPlan = useCallback(() => patch({ phase: "cp1_plan", candidates: [], decisions: {}, error: undefined }), [patch]);

  return { s, ask, approvePlan, decide, continueWithSources, decideClaim, finishClaims, restart, backToPlan, retry, loadSample, debateClaim };
}
