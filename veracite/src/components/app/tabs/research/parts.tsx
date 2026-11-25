"use client";

import { useState } from "react";
import { AlertTriangle, Check, Pencil, Swords, X } from "lucide-react";
import { Card, StatusBadge, TrustLabel } from "@/components/app/ui";
import { canAdd } from "@/components/app/tabs/xray/refList";
import { linesToList } from "@/lib/session/machine";
import type { Claim, Label, Plan, SourceRecord } from "@/lib/types";

const short = (s: SourceRecord) => `${s.authors[0]?.family ?? "Unknown"}${s.authors.length > 1 ? " et al." : ""}, ${s.year ?? "n.d."}`;

const LABELS: [Label, string][] = [
  ["verified", "A registry-verified source contains this, word for word, and the Skeptic did not reject it."],
  ["reported", "Not yet checked: the source is real, but this detail could not be confirmed in its text."],
  ["ai", "AI suggestion: the AI's own reasoning across sources, not something a source says."],
  ["notfound", "Not found: no approved source supports it, the quote is not in the text, or the Skeptic rejected it."],
];

export function ClaimLegend() {
  return (
    <details className="xrx-legend" open>
      <summary>What the claim labels mean</summary>
      <dl>
        {LABELS.map(([k, t]) => (
          <div key={k}>
            <dt><TrustLabel kind={k} /></dt>
            <dd>{t}</dd>
          </div>
        ))}
      </dl>
      <p className="vx-tiny">Labels are set by code after the Skeptic, never by the AI. Source labels are explained on the X-ray page.</p>
    </details>
  );
}

export function PlanCard({ plan, by, onApprove, onRestart, busy }: { plan: Plan; by?: "ai" | "rules"; onApprove: (p: Plan) => void; onRestart: () => void; busy: boolean }) {
  const [queries, setQueries] = useState(plan.queries.join("\n"));
  const [year, setYear] = useState(plan.filters.yearFrom ? String(plan.filters.yearFrom) : "");
  const list = linesToList(queries);
  return (
    <Card title={<>Checkpoint 1 · approve the search plan</>} aside={by === "ai" ? <TrustLabel kind="ai" /> : <span className="vx-tiny" style={{ margin: 0 }}>No AI used</span>}>
      <p className="vx-tiny" style={{ marginTop: 0 }}>{plan.rationale}</p>
      {plan.subQuestions.length > 0 && (
        <ul className="rs-sub">
          {plan.subQuestions.map((q) => <li key={q}>{q}</li>)}
        </ul>
      )}
      <label className="vx-eyebrow" htmlFor="rs-queries">Search terms (one per line, edit freely)</label>
      <textarea id="rs-queries" className="paste rs-queries" value={queries} onChange={(e) => setQueries(e.target.value)} spellCheck={false} />
      <div className="xrx-row">
        <label className="vx-tiny" style={{ margin: 0 }}>
          From year{" "}
          <input className="rs-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="any" aria-label="Only papers from this year on" />
        </label>
        <button className="btn primary" disabled={busy || !list.length} onClick={() => onApprove({ ...plan, queries: list.slice(0, 4), filters: Number(year) > 1900 ? { yearFrom: Number(year) } : {} })}>
          <Check size={15} /> Approve plan and search
        </button>
        <button className="btn small" onClick={onRestart} disabled={busy}>Change question</button>
      </div>
      <p className="vx-tiny">Nothing is searched until you approve. Up to 4 search terms are used.</p>
    </Card>
  );
}

export function SourcesCard({ candidates, decisions, onDecide, onContinue, onBack, busy, aiOff }: {
  candidates: SourceRecord[];
  decisions: Record<string, "accepted" | "rejected">;
  onDecide: (s: SourceRecord, d: "accepted" | "rejected") => void;
  onContinue: () => void;
  onBack: () => void;
  busy: boolean;
  aiOff: boolean;
}) {
  const accepted = candidates.filter((c) => decisions[c.id] === "accepted").length;
  return (
    <Card title={<>Checkpoint 2 · approve sources · {candidates.length} found</>}>
      <p className="vx-tiny" style={{ marginTop: 0 }}>Every result was checked by code against two registries. A source enters your reference list only when you press Add.</p>
      <ul className="xrx-list rs-sources">
        {candidates.map((s) => {
          const d = decisions[s.id];
          return (
            <li key={s.id} className={d === "rejected" ? "rs-rejected" : undefined}>
              <div className="xr-head">
                <span className="xr-ref"><b>{s.title}</b><br /><span className="muted">{short(s)}{s.venue ? ` · ${s.venue}` : ""}</span></span>
                <StatusBadge status={s.verification.status} />
              </div>
              <div className="chips" style={{ marginTop: 6 }}>
                <span className={s.type === "preprint" ? "warn" : "on"}>{s.type === "preprint" ? "preprint, not peer reviewed" : s.type}</span>
                {s.quality.openAccess && <span>open access</span>}
                {s.quality.citedBy ? <span>cited {s.quality.citedBy}</span> : null}
                <span className={s.abstract ? "on" : "warn"}>{s.abstract ? "abstract available" : "no abstract: claims can't be checked"}</span>
              </div>
              {s.verification.status !== "verified" && <p className="xr-note">{s.verification.reasons.join(" ")}</p>}
              <div className="xrx-row">
                {canAdd(s.verification) ? (
                  <button className={`btn small ${d === "accepted" ? "ok" : "primary"}`} onClick={() => onDecide(s, "accepted")} disabled={busy || d === "accepted"}>
                    <Check size={13} /> {d === "accepted" ? "In my list" : "Add to my list"}
                  </button>
                ) : (
                  <span className="vx-tiny" style={{ margin: 0 }}>Cannot be added.</span>
                )}
                <button className={`btn small ${d === "rejected" ? "no" : ""}`} onClick={() => onDecide(s, "rejected")} disabled={busy || d === "rejected"}>
                  <X size={13} /> Reject
                </button>
                {s.url && <a className="btn small" href={s.url} target="_blank" rel="noopener noreferrer">Open</a>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="xrx-row">
        <button className="btn primary" onClick={onContinue} disabled={busy || (!aiOff && accepted === 0)}>
          {aiOff ? `Continue to export (${accepted} added)` : `Continue with ${accepted} approved source${accepted === 1 ? "" : "s"}`}
        </button>
        <button className="btn small" onClick={onBack} disabled={busy}>Back to the plan</button>
      </div>
    </Card>
  );
}

function ClaimRow({ c, sources, onDecide, busy }: { c: Claim; sources: Map<string, SourceRecord>; onDecide: (id: string, d: "kept" | "dropped" | "edited", t?: string) => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.editedText ?? c.text);
  return (
    <div className={`claim ${c.label}`} style={{ opacity: c.decision === "dropped" ? 0.5 : 1 }}>
      {editing ? (
        <textarea className="paste rs-edit" value={text} onChange={(e) => setText(e.target.value)} aria-label="Edit the claim" />
      ) : (
        <p>{c.editedText ?? c.text}</p>
      )}
      <div className="meta">
        <TrustLabel kind={c.label} />
        {c.sourceIds.map((id) => <span key={id} className="srcchip">{sources.get(id) ? short(sources.get(id)!) : id}</span>)}
        {c.decision === "edited" && <span className="vx-tiny" style={{ margin: 0 }}>Edited by you: re-check it against the source.</span>}
      </div>
      {c.quote && <p className="quote">“{c.quote}” · {c.quoteFound ? "found in the source text" : "NOT found in the source text"}</p>}
      {c.skeptic && (c.skeptic.rules.length > 0 || c.skeptic.reasons.length > 0) && (
        <p className="sk"><Swords size={14} /> Skeptic ({c.skeptic.verdict}{c.skeptic.rules.length ? ` · ${c.skeptic.rules.join(", ")}` : ""}): {c.skeptic.reasons.join(" ") || "no reason given"}</p>
      )}
      <div className="xrx-row">
        {editing ? (
          <button className="btn small primary" onClick={() => { onDecide(c.id, "edited", text); setEditing(false); }} disabled={busy || text.trim().length < 5}>Save edit</button>
        ) : (
          <>
            <button className={`btn small ${c.decision === "kept" ? "ok" : ""}`} onClick={() => onDecide(c.id, "kept")} disabled={busy}><Check size={13} /> Keep</button>
            <button className="btn small" onClick={() => setEditing(true)} disabled={busy}><Pencil size={13} /> Edit</button>
            <button className={`btn small ${c.decision === "dropped" ? "no" : ""}`} onClick={() => onDecide(c.id, "dropped")} disabled={busy}><X size={13} /> Drop</button>
          </>
        )}
      </div>
    </div>
  );
}

export function ClaimsCard({ claims, sources, blocked, onDecide, onFinish, busy }: {
  claims: Claim[];
  sources: SourceRecord[];
  blocked: number;
  onDecide: (id: string, d: "kept" | "dropped" | "edited", t?: string) => void;
  onFinish: () => void;
  busy: boolean;
}) {
  const map = new Map(sources.map((s) => [s.id, s]));
  const pending = claims.filter((c) => c.decision === "pending").length;
  return (
    <Card title={<>Checkpoint 3 · keep, edit or drop each claim</>}>
      {blocked > 0 && (
        <div className="banner" role="status" style={{ marginBottom: 12 }}>
          <AlertTriangle size={16} color="var(--alert)" />
          <span><b>{blocked} blocked fabrication{blocked === 1 ? "" : "s"}:</b> the AI tried to cite sources you never approved. Code removed them.</span>
        </div>
      )}
      <div className="claims">
        {claims.map((c) => <ClaimRow key={c.id} c={c} sources={map} onDecide={onDecide} busy={busy} />)}
      </div>
      <div className="xrx-row">
        <button className="btn primary" onClick={onFinish} disabled={busy || pending > 0}>
          {pending ? `Review ${pending} more claim${pending === 1 ? "" : "s"} to continue` : "Approve claims and export"}
        </button>
      </div>
    </Card>
  );
}
