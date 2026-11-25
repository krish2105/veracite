"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, Search } from "lucide-react";
import AppShell, { autonomyStore } from "@/components/app/AppShell";
import { Card, TrustLabel } from "@/components/app/ui";
import { ReferenceList } from "@/components/app/tabs/xray/ReferenceList";
import { useRefList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import { useStore } from "@/components/lab/store";
import { STEPS, stepState } from "@/lib/session/machine";
import { useResearch } from "@/lib/session/useResearch";
import type { Autonomy } from "@/lib/types";
import { ClaimLegend, ClaimsCard, PlanCard, SourcesCard } from "./parts";
import "./research.css";

const EXAMPLE = "Does generative AI help or hurt student learning?";
const AUTONOMY: [Autonomy, string, string][] = [
  ["off", "Off", "No AI: you search, check and approve; nothing is drafted."],
  ["assist", "Assist", "AI plans, reads and challenges. You write."],
  ["copilot", "Co-pilot", "AI also drafts a labelled brief from your approved sources."],
];

export function ResearchTab() {
  const autonomy = useStore(autonomyStore);
  const { s, ask, approvePlan, decide, continueWithSources, decideClaim, finishClaims, restart, backToPlan } = useResearch(autonomy);
  const [q, setQ] = useState("");
  const { receipts } = useRefList();
  const busy = !!s.busy;
  const started = s.phase !== "ask";
  const approved = s.candidates.filter((c) => s.decisions[c.id] === "accepted");
  const mine = receipts.filter((r) => r.sessionId === s.sessionId);

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
          {!started && <button className="btn small" style={{ marginTop: 8 }} onClick={() => setQ(EXAMPLE)}>Use the example question</button>}
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
                const state = stepState(st.phase, s.phase, autonomy);
                return state === "skip" ? null : (
                  <span key={st.phase} className={`step ${state} ${st.gate ? "gate" : ""}`}><i />{st.label}</span>
                );
              })}
            </div>
          )}
        </Card>

        <div aria-live="polite">
          {s.busy && <p className="rs-busy">{s.busy}</p>}
          {s.error && (
            <div className="banner" role="alert">
              <AlertTriangle size={16} color="var(--alert)" />
              <span>{s.error}</span>
            </div>
          )}
          {s.notes.length > 0 && (
            <ul className="rs-notes" aria-label="What happened">
              {s.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>

        {s.phase === "cp1_plan" && s.plan && <PlanCard key={s.sessionId} plan={s.plan} by={s.planBy} onApprove={(p) => void approvePlan(p)} onRestart={restart} busy={busy} />}

        {(s.phase === "cp2_sources" || (s.phase === "searching" && s.candidates.length > 0)) && (
          <SourcesCard candidates={s.candidates} decisions={s.decisions} onDecide={decide} onContinue={() => void continueWithSources()} onBack={backToPlan} busy={busy} aiOff={autonomy === "off"} />
        )}

        {(s.phase === "cp3_claims" || s.phase === "export") && s.claims.length > 0 && (
          <>
            {s.phase === "cp3_claims" ? (
              <ClaimsCard claims={s.claims} sources={approved} blocked={s.blocked.length} onDecide={decideClaim} onFinish={finishClaims} busy={busy} />
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

        {s.phase === "export" && (
          <>
            <ReferenceList autonomy={autonomy} claims={s.claims} />
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
