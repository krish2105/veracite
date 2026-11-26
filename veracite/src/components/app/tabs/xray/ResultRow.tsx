"use client";

import { AlertTriangle, Check, Copy, ExternalLink, Plus, Scissors, X } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import type { RefStatus, RegistryName, Verification } from "@/lib/types";
import { FullTextLink } from "./FullTextLink";
import { HowDecided } from "./HowDecided";
import { JournalChips } from "./JournalChips";
import { canAdd, refList, sourceId, typedId, useRefList } from "./refList";
import { canAddWeb, toWebSource } from "@/lib/verify/websource";

const REGISTRY: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };
/** The plain verdict, said first, so nobody has to know what a label means. */
const VERDICT: Record<RefStatus, string> = {
  verified: "Verified.",
  partial: "Not yet verified.",
  mismatch: "Needs fix: not verified as typed.",
  chimera: "Mismatch: it does not point to one real paper. Do not cite it.",
  retracted: "Retracted. Do not cite it.",
  notfound: "Not found.",
};
const LABEL: Record<RefStatus, string> = { verified: "Verified", partial: "Partial", mismatch: "Needs fix", chimera: "Mismatch", retracted: "Retracted", notfound: "Not found" };
/** Which step from the Phase 1 deck handled this result, and on what basis it was called (Phase 2: "name the step"). */
const HANDLED: Record<RefStatus, string> = {
  verified: "check A: two registries (Crossref and OpenAlex) agree on the title, first author and year",
  partial: "only part of the reference could be confirmed, so it is not Verified",
  mismatch: "field-by-field comparison with the registry record; you decide whether to accept the correction",
  chimera: "chimera check: the DOI, title or authors belong to different registry records",
  retracted: "check B: retraction check (Crossref updates, Retraction Watch and OpenAlex)",
  notfound: "searched Crossref, OpenAlex and arXiv; no record matches, and nothing is swapped in",
};
const FIELD: Record<string, string> = { doi: "DOI", title: "Title", authors: "Authors", year: "Year", venue: "Journal" };

/** One reference in the X-ray results: verdict, plain-English reasons, the field-by-field table and the receipts. */
export function ResultRow({ n, raw, v, onTakeApart, dupOf, merged, onMerge }: { n: number; raw: string; v?: Verification; onTakeApart?: () => void; dupOf?: number; merged?: boolean; onMerge?: () => void }) {
  const rows = v?.checks.filter((c) => c.claimed || c.found) ?? [];
  const notice = v?.updates.find((u) => u.noticeDoi);
  const { sources } = useRefList();
  const added = !!v?.matched && sources.some((s) => s.id === sourceId(v));
  const webAdded = !!v?.web && sources.some((s) => s.id === `url:${v.web!.url}`);
  const typedKept = sources.some((s) => s.id === typedId(raw));
  const fix = v?.status === "mismatch" ? v.reasons.slice(1).filter((r) => !/^A (correction|expression)/.test(r)) : [];
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
          {v.status === "retracted" && (
            <div className="banner" role="alert" style={{ marginTop: 8 }}>
              <AlertTriangle size={16} color="var(--alert)" />
              <span><b>Retracted.</b> This paper was withdrawn after publication. It is not a normal verified source: do not cite it as evidence. If you keep it, it stays marked Retracted in your library and in every export.</span>
            </div>
          )}
          {fix.length > 0 && !added && !typedKept && (
            <p className="xr-note" style={{ marginTop: 8 }}><b>Suggested fix:</b> {fix.join(" ")} Nothing changes until you accept or reject it.</p>
          )}
          {dupOf && !merged && (
            <div className="banner" role="status" style={{ marginTop: 8 }}>
              <Copy size={16} />
              <span><b>Duplicate.</b> This is the same paper as reference {dupOf} (the registries resolve both to the same record), typed in a different format. Your list keeps one entry.</span>
              <button className="btn small primary" onClick={onMerge}>Merge: keep one entry</button>
            </div>
          )}
          <div className="chips" style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {dupOf && merged ? (
              <span className="lbl lbl-verified"><Check size={12} /> Merged into reference {dupOf}: one entry kept</span>
            ) : v.status === "mismatch" && v.matched ? (
              <>
                <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.acceptFix(v)} disabled={added || typedKept}>
                  <Check size={13} /> {added ? "Fix accepted · in my list" : "Accept fix: use the registry’s details"}
                </button>
                <button className={`btn small ${typedKept ? "ok" : ""}`} onClick={() => refList.keepAsTyped(raw, v)} disabled={added || typedKept}>
                  <X size={13} /> {typedKept ? "Fix rejected · kept as typed, marked Needs fix" : "Reject fix: keep as typed"}
                </button>
              </>
            ) : v.status === "retracted" && v.matched ? (
              <button className={`btn small ${added ? "ok" : "no"}`} onClick={() => refList.addRetracted(v)} disabled={added}>
                {added ? <Check size={13} /> : <AlertTriangle size={13} />} {added ? "In my list, marked Retracted" : "I have read the warning: keep it, marked Retracted"}
              </button>
            ) : canAdd(v) ? (
              <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.approve(v)} disabled={added}>
                {added ? <Check size={13} /> : <Plus size={13} />} {added ? "In my list" : "Add to my list"}
              </button>
            ) : canAddWeb(v) ? (
              <>
                <button className={`btn small ${webAdded ? "ok" : ""}`} onClick={() => refList.addWeb(toWebSource(v, raw))} disabled={webAdded}>
                  {webAdded ? <Check size={13} /> : <Plus size={13} />} {webAdded ? "In my list (web source)" : "Add as web source"}
                </button>
                <span className="vx-tiny" style={{ margin: 0 }}>Web source, not checked in a scholarly database: saved as Partial, never Verified. Author and date as you typed them; “n.d.” if there is no date.</span>
              </>
            ) : (
              <>
                <button className={`btn small ${typedKept ? "ok" : ""}`} onClick={() => refList.keepAsTyped(raw, v)} disabled={typedKept}>
                  {typedKept ? <Check size={13} /> : <Plus size={13} />} {typedKept ? `Kept as typed, marked ${LABEL[v.status]}` : `Keep as typed, marked ${LABEL[v.status]}`}
                </button>
                <span className="vx-tiny" style={{ margin: 0 }}>Never added as verified; the mark stays in your library and every export.</span>
              </>
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
          <p className="vx-tiny" style={{ margin: "6px 0 0" }}>
            <b>Handled by:</b> the Verifier (code, no AI){v.web ? " and the web check (live page and Wayback Machine)" : ""}. Called for every pasted reference, before anything can enter your list. Basis: {v.web ? "a web page has no registry record, so it is a web source, not checked in a scholarly database" : HANDLED[v.status]}
            {dupOf ? `; duplicate check: it resolves to the same record as reference ${dupOf}` : ""}.
          </p>
          <HowDecided v={v} />
        </>
      )}
    </div>
  );
}

