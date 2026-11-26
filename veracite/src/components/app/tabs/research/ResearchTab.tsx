"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCopy, FlaskConical, RotateCcw, Search } from "lucide-react";
import AppShell, { autonomyStore } from "@/components/app/AppShell";
import { Card, Sample, TrustLabel } from "@/components/app/ui";
import { ReferenceList } from "@/components/app/tabs/xray/ReferenceList";
import { useRefList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import { useStore } from "@/components/lab/store";
import { STEPS, stepState } from "@/lib/session/machine";
import { useResearch } from "@/lib/session/useResearch";
import type { Autonomy } from "@/lib/types";
import { ClaimLegend, ClaimsCard, PlanCard, SourcesCard } from "./parts";
import { SAMPLE_SESSION } from "./sampleSession";
import "./research.css";

const EXAMPLE = "Does generative AI help or hurt student learning?";
const AUTONOMY: [Autonomy, string, string][] = [
  ["off", "Off", "No AI: you search, check and approve; nothing is drafted."],
  ["assist", "Assist", "AI plans, reads and challenges. You write."],
  ["copilot", "Co-pilot", "AI also drafts a labelled brief from your approved sources."],
];

export function ResearchTab() {
  const autonomy = useStore(autonomyStore);
  const { s, ask, approvePlan, decide, continueWithSources, decideClaim, finishClaims, restart, backToPlan, retry, loadSample, debateClaim } = useResearch(autonomy);
  const [q, setQ] = useState("");
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState("");
  const { receipts } = useRefList();
  const busy = !!s.busy;
  const started = s.phase !== "ask";
  const approved = s.candidates.filter((c) => s.decisions[c.id] === "accepted");
  const mine = s.sample ? s.sample.receipts : receipts.filter((r) => r.sessionId === s.sessionId);
  const mode = s.sample?.autonomy ?? autonomy;
  // ?record=1 shows a button that copies a finished LIVE session, to be pasted into sampleSession.ts (K32).
  useEffect(() => setRecording(new URLSearchParams(window.location.search).get("record") === "1"), []);
  const record = async () => {
    const { busy: _b, error: _e, failed: _f, sample: _s, ...state } = s;
    const rec = { ...state, recordedAt: new Date().toISOString(), autonomy, receipts: mine };
    try {
      await navigator.clipboard.writeText(JSON.stringify(rec));
      setCopied("Copied. Paste it into tabs/research/sampleSession.ts.");
    } catch {
      setCopied("Could not copy. Allow clipboard access and try again.");
    }
  };

  return (
    <AppShell title="Research" subtitle="Ask a question. The AI plans, reads and challenges; only public registries supply sources; you approve three times.">
      <div className="xrx rs">
        <Card title={<>Your question</>}>
          <form
            className="rs-ask"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim().length >= 5 && !busy) void ask(q.trim());
            }}
          >
            <input className="rs-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={EXAMPLE} aria-label="Research question" disabled={started && busy} />
            <button className="btn primary" type="submit" disabled={busy || q.trim().length < 5}><Search size={15} /> {started ? "Ask again" : "Start"}</button>
          </form>
          {!started && (
            <div className="xrx-row">
              <button className="btn small" onClick={() => setQ(EXAMPLE)}>Use the example question</button>
              {SAMPLE_SESSION && <button className="btn small" onClick={() => loadSample(SAMPLE_SESSION!)}><FlaskConical size={13} /> No Wi-Fi or AI? Show the SAMPLE session</button>}
            </div>
          )}
          <div className="rs-autonomy">
            <span className="vx-eyebrow" style={{ margin: 0 }}>AI autonomy</span>
            <div className="vx-seg" role="radiogroup" aria-label="AI autonomy">
              {AUTONOMY.map(([a, label]) => (
                <button key={a} role="radio" aria-checked={autonomy === a} onClick={() => autonomyStore.set(a)} disabled={started}>{label}</button>
              ))}
            </div>
            <span className="vx-tiny" style={{ margin: 0 }}>{AUTONOMY.find(([a]) => a === autonomy)?.[2]}{started ? " Locked for this session." : ""}</span>
          </div>
          {started && (
            <div className="stepper" aria-label="Progress">
              {STEPS.map((st) => {
                const state = stepState(st.phase, s.phase, mode);
                return state === "skip" ? null : (
                  <span key={st.phase} className={`step ${state} ${st.gate ? "gate" : ""}`}><i />{st.label}</span>
                );
              })}
            </div>
          )}
        </Card>

        {s.sample && (
          <div className="banner rs-sample" role="status">
            <FlaskConical size={16} />
            <span>
              <Sample>SAMPLE</Sample> A real session on this question, recorded on {new Date(s.sample.recordedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" })} (Dubai) with autonomy {s.sample.autonomy}. Nothing on this page is running now, and your list is not changed.
            </span>
            <button className="btn small" onClick={restart}><RotateCcw size={13} /> Leave the SAMPLE</button>
          </div>
        )}

        <div aria-live="polite">
          {s.busy && <p className="rs-busy">{s.busy}</p>}
          {s.error && (
            <div className="banner" role="alert">
              <AlertTriangle size={16} color="var(--alert)" />
              <span>{s.error}</span>
              {s.failed && <button className="btn small" onClick={retry}><RotateCcw size={13} /> Try again</button>}
              {SAMPLE_SESSION && <button className="btn small" onClick={() => loadSample(SAMPLE_SESSION!)}><FlaskConical size={13} /> Show the SAMPLE session</button>}
            </div>
          )}
          {s.notes.length > 0 && (
            <ul className="rs-notes" aria-label="What happened">
              {s.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>

        {s.phase === "cp1_plan" && s.plan && <PlanCard key={s.sessionId} plan={s.plan} by={s.planBy} onApprove={(p) => void approvePlan(p)} onRestart={restart} busy={busy} />}

        {s.assistant && (
          <div className={`banner ${s.assistant.tone === "warn" ? "rs-notfound" : ""}`} role="status">
            {s.assistant.tone === "warn" ? <AlertTriangle size={16} color="var(--alert)" /> : <FlaskConical size={16} />}
            <span>
              <b>{s.assistant.title}.</b>{" "}
              {s.assistant.lines.map((l, i) => <span key={i} style={{ display: "block", marginTop: i ? 4 : 0 }}>{l}</span>)}
              <span style={{ display: "block", marginTop: 4 }}><b>Handled by:</b> {s.assistant.handledBy ?? "code, with no AI call (the quote check and the prompt-injection shield from our guardrails). The Planner was not called, because this is not a research question."}</span>
            </span>
          </div>
        )}

        {s.notFound && s.phase !== "ask" && s.phase !== "cp1_plan" && (
          <div className="banner rs-notfound" role="alert">
            <AlertTriangle size={16} color="var(--alert)" />
            <span>
              <b>Not found.</b> Veracite searched Crossref, OpenAlex and arXiv, and no source mentions {s.notFound.map((p) => `“${p}”`).join(" or ")}. No study answering this question exists there, so none was invented.
              {s.candidates.length > 0 && " The sources below are related real papers, each checked and labelled. They do not answer your question; you decide whether any is useful."}
              <span style={{ display: "block", marginTop: 4 }}><b>Handled by:</b> Planner ({s.planBy === "ai" ? "AI: proposed the search terms you approved" : "Rules mode: your question as typed"}) → Scout (code: searched the registries) → Verifier (code: checked every result). Only a registry record can become a source, so there is nothing to invent with.</span>
            </span>
          </div>
        )}

        {(s.phase === "cp2_sources" || (s.phase === "searching" && s.candidates.length > 0)) && (
          <SourcesCard candidates={s.candidates} decisions={s.decisions} onDecide={decide} onContinue={() => void continueWithSources()} onBack={backToPlan} busy={busy} aiOff={autonomy === "off"} />
        )}

        {(s.phase === "cp3_claims" || s.phase === "export") && s.claims.length > 0 && (
          <>
            {s.phase === "cp3_claims" ? (
              <ClaimsCard claims={s.claims} sources={approved} blocked={s.blocked.length} onDecide={decideClaim} onFinish={finishClaims} busy={busy} debates={s.debates} onDebate={s.sample || mode === "off" ? undefined : (id) => void debateClaim(id)} />
            ) : (
              <Card title={<>Your evidence notes · {s.claims.filter((c) => c.decision !== "dropped").length} kept</>}>
                <div className="claims">
                  {s.claims.filter((c) => c.decision !== "dropped").map((c) => (
                    <div key={c.id} className={`claim ${c.label}`}>
                      <p>{c.editedText ?? c.text}</p>
                      <div className="meta"><TrustLabel kind={c.label} />{c.decision === "edited" && <span className="vx-tiny" style={{ margin: 0 }}>edited by you</span>}</div>
                    </div>
                  ))}
                </div>
                <p className="vx-tiny">Notes for you to write from, not text to submit. Cite the sources, not this page.</p>
              </Card>
            )}
            <ClaimLegend />
          </>
        )}

        {recording && !s.sample && (s.phase === "cp3_claims" || s.phase === "export") && (
          <div className="xrx-row">
            <button className="btn small" onClick={() => void record()}><ClipboardCopy size={13} /> Copy this session for the SAMPLE fallback</button>
            {copied && <span className="vx-tiny" role="status">{copied}</span>}
          </div>
        )}

        {s.phase === "export" && (
          <>
            {s.sample ? (
              <Card title="Your reference list">
                <p className="xr-note">In a live session, the sources you approved and your AI-use statement appear here. This SAMPLE does not touch your list.</p>
              </Card>
            ) : (
              <ReferenceList autonomy={autonomy} claims={s.claims} />
            )}
            <Card title={<>Receipts · every step of this session</>} aside={<button className="btn small" onClick={restart}><RotateCcw size={13} /> New question</button>}>
              <div className="receipts">
                {mine.map((r) => (
                  <div key={r.id}>
                    <time>{new Date(r.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
                    <b>{r.actor}</b>
                    <span>{r.action.replace(/_/g, " ")}{r.model ? ` · ${r.model}` : ""}{r.detail ? ` · ${r.detail}` : ""}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
