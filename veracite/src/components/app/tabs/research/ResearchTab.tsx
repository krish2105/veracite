"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Check, X, Eye, EyeOff, Swords, Download } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, Sample, StatusBadge, TrustLabel } from "@/components/app/ui";
import { BRIEF, QUESTION, RECEIPTS, SOURCES } from "@/components/app/data";

const MiniMission = dynamic(() => import("@/components/app/three/MiniMission"), { ssr: false });

const STEPS: [string, "done" | "active" | "todo", boolean?][] = [
  ["You asked", "done"], ["Planner", "done"], ["✋ Approve plan", "done", true], ["Scout", "done"], ["Verifier", "done"],
  ["✋ Approve sources", "done", true], ["Reader", "done"], ["Skeptic", "done"], ["Scribe", "done"], ["✋ Approve claims", "active", true], ["Integrity Clerk", "todo"],
];

export function ResearchTab() {
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected" | undefined>>(Object.fromEntries(SOURCES.map((s) => [s.id, s.decision])));
  const [kept, setKept] = useState<Record<string, "kept" | "dropped" | undefined>>({});
  return (
    <AppShell title="Research" subtitle="Five agents do the legwork. You approve three times." actions={<Sample>SAMPLE SESSION</Sample>}>
      <Card title={<>Mission control <Sample /></>} aside={<span className="lbl lbl-reported">Waiting for you · approve claims</span>}>
        <div className="qbox"><span className="mono muted">Q</span><b>{QUESTION}</b><span className="chips"><span>2015–2026</span><span>peer-reviewed first</span><span>any language</span></span></div>
        <div className="stepper">
          {STEPS.map(([t, st, gate], i) => (
            <span key={t} style={{ display: "contents" }}>
              <span className={`step ${st} ${gate ? "gate" : ""}`}><i />{t}</span>
              {i < STEPS.length - 1 && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="mini3d"><MiniMission /><span className="mini3d-cap">3D · signals queue at the gate until you approve</span></div>
      </Card>

      <div className="g2">
        <Card title={<>Checkpoint 2 · sources <Sample /></>} aside={<span className="muted mono" style={{ fontSize: 11 }}>62 found · 48 verified · showing 6</span>}>
          <table className="vx-table">
            <thead><tr><th>Status</th><th>Source</th><th>Quality facts</th><th>Read</th><th>Decision</th></tr></thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.id} className={decisions[s.id] === "rejected" ? "rejected" : ""}>
                  <td><StatusBadge status={s.status} /></td>
                  <td><div className="t">{s.title}</div><div className="s">{s.authors} ({s.year}) · {s.venue} · <span className="mono">{s.doi}</span></div></td>
                  <td><div className="chips">
                    <span className={s.peer ? "on" : "warn"}>{s.peer ? "peer-reviewed" : "preprint"}</span>
                    {s.doaj && <span className="on">DOAJ</span>}{s.oa && <span>open access</span>}<span>cited {s.cited}</span><span>{s.country}</span>
                  </div></td>
                  <td title={s.opened ? "You opened this source" : "Not opened yet"}>{s.opened ? <Eye size={16} /> : <EyeOff size={16} className="muted" />}</td>
                  <td>
                    {s.status === "retracted" ? <span className="lbl lbl-notfound">Blocked</span> : (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button className={`btn small ${decisions[s.id] === "accepted" ? "ok" : ""}`} onClick={() => setDecisions((d) => ({ ...d, [s.id]: "accepted" }))} aria-label="Accept"><Check size={14} /></button>
                        <button className={`btn small ${decisions[s.id] === "rejected" ? "no" : ""}`} onClick={() => setDecisions((d) => ({ ...d, [s.id]: "rejected" }))} aria-label="Reject"><X size={14} /></button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={<>Checkpoint 3 · evidence brief <Sample /></>} aside={<button className="btn small"><Swords size={14} /> Debate a claim</button>}>
          <div className="claims">
            {BRIEF.map((c) => (
              <div key={c.id} className={`claim ${c.label}`} style={{ opacity: kept[c.id] === "dropped" ? 0.45 : 1 }}>
                <p>{c.text}</p>
                <div className="meta">
                  <TrustLabel kind={c.label} />
                  {c.sources.map((s) => <span key={s} className="srcchip">{s}</span>)}
                  <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
                    <button className={`btn small ${kept[c.id] === "kept" ? "ok" : ""}`} onClick={() => setKept((k) => ({ ...k, [c.id]: "kept" }))}>Keep</button>
                    <button className="btn small">Edit</button>
                    <button className={`btn small ${kept[c.id] === "dropped" ? "no" : ""}`} onClick={() => setKept((k) => ({ ...k, [c.id]: "dropped" }))}>Drop</button>
                  </span>
                </div>
                {c.quote && <p className="quote">“{c.quote}” · matched in source text</p>}
                {c.skeptic && <p className="sk"><Swords size={14} /> Skeptic: {c.skeptic}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="g2">
        <Card title="Receipts · audit trail" aside={<button className="btn small"><Download size={14} /> JSON</button>}>
          <div className="receipts">{RECEIPTS.map((r) => <div key={r.t}><time>{r.t}</time><b>{r.who}</b><span>{r.what}</span></div>)}</div>
        </Card>
        <Card title="Coach · explain it back" aside={<span className="muted mono" style={{ fontSize: 11 }}>required before export</span>}>
          <p className="read" style={{ marginTop: 0, fontSize: 15 }}>In one line, in your own words: what did Rahman &amp; Okafor (2021) find?</p>
          <textarea className="paste" style={{ minHeight: 90 }} placeholder="The AI can't fill this in for you." />
          <p className="vx-tiny">Socratic mode: “Which of your sources disagrees with C1, and why might that be?”</p>
        </Card>
      </div>
    </AppShell>
  );
}
