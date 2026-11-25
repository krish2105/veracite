"use client";

import { Check, ExternalLink, Plus, Scissors } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import type { RefStatus, RegistryName, Verification } from "@/lib/types";
import { FullTextLink } from "./FullTextLink";
import { HowDecided } from "./HowDecided";
import { JournalChips } from "./JournalChips";
import { canAdd, refList, sourceId, useRefList } from "./refList";

const REGISTRY: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };
/** The plain verdict, said first, so nobody has to know what a label means. */
const VERDICT: Record<RefStatus, string> = {
  verified: "Verified.",
  partial: "Not yet verified.",
  mismatch: "Not verified as typed.",
  chimera: "Could not be verified. Do not cite it.",
  retracted: "Retracted. Do not cite it.",
  notfound: "Could not be verified.",
};
const FIELD: Record<string, string> = { doi: "DOI", title: "Title", authors: "Authors", year: "Year", venue: "Journal" };

/** One reference in the X-ray results: verdict, plain-English reasons, the field-by-field table and the receipts. */
export function ResultRow({ n, raw, v, onTakeApart }: { n: number; raw: string; v?: Verification; onTakeApart?: () => void }) {
  const rows = v?.checks.filter((c) => c.claimed || c.found) ?? [];
  const notice = v?.updates.find((u) => u.noticeDoi);
  const { sources } = useRefList();
  const added = !!v?.matched && sources.some((s) => s.id === sourceId(v));
  return (
    <div className="xr">
      <div className="xr-head">
        <span className="xr-ref">
          <span className="mono muted">{n}. </span>
          {raw.replace(/^(?:\[\d{1,3}\]|\d{1,3}[.)])\s+/, "")}
        </span>
        {v ? <StatusBadge status={v.status} /> : <span className="lbl" style={{ color: "var(--ink2)" }} aria-label="Checking">checking…</span>}
      </div>

      {v && (
        <>
          <p className="xr-note">
            <span className="xrx-verdict">{VERDICT[v.status]}</span> {v.reasons.join(" ")}
          </p>
          {rows.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>You pasted</th>
                  <th>Registry says</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.field}>
                    <td className="mono">{FIELD[c.field] ?? c.field}</td>
                    <td>{c.claimed ?? "—"}</td>
                    <td>{c.found ?? "—"}</td>
                    <td className={`mono field-${c.match}`}>
                      {c.match}
                      {c.field === "title" && c.score !== undefined && c.match !== "exact" ? ` · ${c.score.toFixed(2)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="chips" style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {canAdd(v) ? (
              <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.approve(v)} disabled={added}>
                {added ? <Check size={13} /> : <Plus size={13} />} {added ? "In my list" : v.status === "mismatch" ? "Add the registry's version" : "Add to my list"}
              </button>
            ) : (
              <span className="vx-tiny" style={{ margin: 0 }}>Cannot be added to your list.</span>
            )}
            {v.registries.map((r) => (
              <span key={r} className="lbl lbl-verified">{REGISTRY[r]} ✓</span>
            ))}
            <span className="vx-tiny" style={{ margin: 0 }}>
              Searched {v.searched.length} {v.searched.length === 1 ? "time" : "times"} · {v.ms < 1000 ? `${v.ms} ms` : `${(v.ms / 1000).toFixed(1)} s`} · no AI used
            </span>
            {v.matched?.doi && (
              <a className="btn small" href={`https://doi.org/${v.matched.doi}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> Open record
              </a>
            )}
            {canAdd(v) && v.matched && <FullTextLink doi={v.matched.doi} oaUrl={v.matched.oaUrl} openAccess={v.matched.openAccess} />}
            {canAdd(v) && <JournalChips facts={v.matched?.journal} />}
            {notice?.noticeDoi && (
              <a className="btn small" href={`https://doi.org/${notice.noticeDoi}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> {notice.kind} notice
              </a>
            )}
            {v.status === "chimera" && onTakeApart && (
              <button className="btn small no" onClick={onTakeApart}>
                <Scissors size={13} /> Take apart
              </button>
            )}
          </div>
          <HowDecided v={v} />
        </>
      )}
    </div>
  );
}

