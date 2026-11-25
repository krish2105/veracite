/**
 * Debate mode (K14): for one claim at checkpoint 3, the Advocate argues it is supported and the Skeptic argues
 * it may not be, for up to two rounds; then the STUDENT judges (keep, edit or drop).
 *   Advocate  runs on the Scribe's model chain      Skeptic  runs on its own model family, with no shared memory:
 *             it sees only the claim, the sources and the debate so far (never the Advocate's instructions).
 * Code decides what survives each turn: a source id that was never approved is blocked and logged, a quote must
 * be in that source's abstract, and the label is set by code (Verified only for a real quote from a verified source).
 */
import { gateway as defaultGateway, type AgentResult } from "../llm";
import type { BlockedFabrication, Claim, Label, SourceRecord } from "../types";
import type { AgentRun, Ctx } from "./agents";
import { quoteInText } from "./checks";
import { DebateTurnOut } from "./schemas";

export interface DebateTurn {
  side: "advocate" | "skeptic";
  round: 1 | 2;
  text: string;
  sourceId?: string;
  quote?: string;
  label: Label;
  model?: string;
}

export interface DebateResult {
  turns: DebateTurn[];
  blocked: BlockedFabrication[];
}

const RULES = `Use at most one exact quote, copied word for word from ONE source's text (at least 6 words), with that source's id; or null for both if no source text helps.
Do not invent facts, numbers, sources, authors or DOIs. Never write a reference. 2-3 sentences. Refer to sources only by their id.`;
const ADVOCATE = `You are the Advocate in a Veracite debate. Argue that the claim IS supported by the sources given. If the sources do not really support it, say so honestly.\n${RULES}`;
const SKEPTIC = `You are the Skeptic in a Veracite debate. You did not write the claim. Argue why it may NOT be supported: the source does not say it, it overgeneralises, it is correlation not causation, a single study, missing context, a retraction or a preprint.\n${RULES}`;

const sourcesFor = (list: SourceRecord[]) => list.map((s) => ({ id: s.id, text: `${s.title} (${s.year ?? "n.d."})\n${s.abstract ?? "[no abstract available]"}` }));
const transcriptText = (turns: DebateTurn[]) => turns.map((t) => `Round ${t.round} · ${t.side === "advocate" ? "Advocate" : "Skeptic"}: ${t.text}${t.quote ? ` [quote from ${t.sourceId}: "${t.quote}"]` : ""}`).join("\n");

export async function runDebateRound(claim: Claim, approved: SourceRecord[], transcript: DebateTurn[], round: 1 | 2, ctx: Ctx): Promise<AgentRun<DebateResult>> {
  const gw = ctx.gateway ?? defaultGateway;
  const allowed = new Map(approved.map((s) => [s.id, s]));
  const cited = claim.sourceIds.map((id) => allowed.get(id)).filter((s): s is SourceRecord => !!s);
  const pool = cited.length ? cited : approved.slice(0, 4);
  const turns: DebateTurn[] = [];
  const blocked: BlockedFabrication[] = [];
  const dropped: string[] = [];
  const prompts: string[] = [];
  const tokens = { input: 0, output: 0 };
  const t0 = Date.now();

  const check = (side: DebateTurn["side"], r: Extract<AgentResult<{ argument: string; sourceId: string | null; quote: string | null }>, { ok: true }>): DebateTurn => {
    const { argument, sourceId, quote } = r.data;
    const turn: DebateTurn = { side, round, text: argument, label: "ai", model: r.model };
    if (sourceId && !allowed.has(sourceId)) {
      blocked.push({ at: new Date().toISOString(), agent: side === "advocate" ? "scribe" : "skeptic", citedId: sourceId, claimText: argument });
      dropped.push(`The ${side === "advocate" ? "Advocate" : "Skeptic"} cited a source you never approved, so code removed it.`);
      return turn;
    }
    const src = sourceId ? allowed.get(sourceId) : undefined;
    if (src && quote) {
      if (quoteInText(quote, src.abstract)) return { ...turn, sourceId: src.id, quote, label: src.verification.status === "verified" ? "verified" : "reported" };
      dropped.push(`A quote from the ${side === "advocate" ? "Advocate" : "Skeptic"} is not in the source's text, so it was removed.`);
    }
    return src ? { ...turn, sourceId: src.id } : turn;
  };

  const ask = async (side: DebateTurn["side"]) => {
    const task = `Claim: "${claim.editedText ?? claim.text}"\nRound ${round} of 2.${turns.length || transcript.length ? `\nDebate so far:\n${transcriptText([...transcript, ...turns])}` : ""}\n${side === "advocate" ? (round === 1 ? "Open the debate." : "Answer the Skeptic's last point.") : "Answer the Advocate's last point."}`;
    const r = await gw.run(
      { agent: side === "advocate" ? "scribe" : "skeptic", sessionId: ctx.sessionId, system: side === "advocate" ? ADVOCATE : SKEPTIC, task, sources: sourcesFor(pool), schema: DebateTurnOut, maxOutputTokens: 500 },
      { aiOff: ctx.aiOff },
    );
    if (r.prompt) prompts.push(r.prompt);
    if (r.ok && r.tokens) { tokens.input += r.tokens.input; tokens.output += r.tokens.output; }
    return r;
  };

  const adv = await ask("advocate");
  if (!adv.ok) return { data: { turns: [], blocked: [] }, mode: "rules", reason: `Debate needs the AI. ${adv.reason}`, ms: Date.now() - t0, prompt: prompts.join("\n---\n") || undefined, dropped: [] };
  turns.push(check("advocate", adv));
  const sk = await ask("skeptic");
  if (sk.ok) turns.push(check("skeptic", sk));
  else dropped.push(`The Skeptic could not answer this round: ${sk.reason}`);

  return {
    data: { turns, blocked },
    mode: "ai",
    model: [adv.model, sk.ok ? sk.model : undefined].filter(Boolean).join(" + "),
    tokens,
    prompt: prompts.join("\n---\n"),
    ms: Date.now() - t0,
    injectionFlags: [...(adv.injectionFlags ?? []), ...(sk.ok ? sk.injectionFlags ?? [] : [])],
    dropped,
  };
}
