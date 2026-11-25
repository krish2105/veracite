"use client";

import { useState } from "react";
import { Check, GitBranch, Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import { canAdd, refList, sourceId, toSource, useRefList } from "@/components/app/tabs/xray/refList";
import type { Candidate } from "@/lib/agents/scout";
import { isOn } from "@/lib/flags";
import type { CitationDirection } from "@/lib/registries/openalex";

const LABEL: Record<CitationDirection, string> = { references: "Papers it cites", cited_by: "Papers that cite it" };

interface State {
  direction: CitationDirection;
  loading: boolean;
  total?: number;
  candidates?: Candidate[];
  error?: string;
}

/** One lookup, logged in the Receipts. Outside the component: it reads the clock. */
async function fetchRelated(doi: string, direction: CitationDirection): Promise<{ total?: number; candidates?: Candidate[] }> {
  const t0 = Date.now();
  const res = await fetch("/api/sources/snowball", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doi, direction }) });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; total?: number; candidates?: Candidate[] };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "The citation list could not be loaded.");
  refList.log({ actor: "scout", action: "followed_citations", aiUsed: false, ms: Date.now() - t0, ok: true, detail: `${direction} of ${doi}: ${json.candidates?.length ?? 0} checked` });
  return { total: json.total, candidates: json.candidates };
}

/**
 * Citation snowballing (K11): find work through a source's citations. Every result is verified by code, and nothing
 * joins the reference list without a click.
 */
export function RelatedPapers({ doi }: { doi: string }) {
  const [state, setState] = useState<State>();
  const { sources } = useRefList();
  if (!isOn("snowball")) return null;

  const load = async (direction: CitationDirection) => {
    setState({ direction, loading: true });
    try {
      setState({ direction, loading: false, ...(await fetchRelated(doi, direction)) });
    } catch (e) {
      setState({ direction, loading: false, error: e instanceof Error ? e.message : "The citation list could not be loaded." });
    }
  };

  return (
    <div className="rel">
      <div className="xrx-row">
        <GitBranch size={13} aria-hidden />
        {(["references", "cited_by"] as const).map((d) => (
          <button key={d} className={`btn small ${state?.direction === d ? "ok" : ""}`} onClick={() => void load(d)} disabled={state?.loading}>
            {LABEL[d]}
          </button>
        ))}
        {state && <button className="btn small" onClick={() => setState(undefined)} disabled={state.loading}>Hide</button>}
      </div>
      <div aria-live="polite">
        {state?.loading && <p className="vx-tiny">Looking up citations and verifying each one…</p>}
        {state?.error && <p className="vx-tiny" role="alert">{state.error}</p>}
        {state?.candidates && (
          <>
            <p className="vx-tiny">
              {state.candidates.length
                ? `${LABEL[state.direction]}: showing ${state.candidates.length} of ${state.total}, most cited first, from OpenAlex.`
                : "OpenAlex lists none."}
            </p>
            <ul className="rel-list">
              {state.candidates.map(({ record, verification }) => {
                const src = toSource(verification.matched ? verification : { ...verification, matched: record });
                const added = sources.some((s) => s.id === sourceId(src.verification) || s.id === src.id);
                return (
                  <li key={src.id}>
                    <span className="rel-title">
                      {src.title} <span className="muted">({src.authors[0]?.family ?? "Unknown"}{src.authors.length > 1 ? " et al." : ""}, {src.year ?? "n.d."})</span>
                    </span>
                    <span className="rel-actions">
                      <StatusBadge status={verification.status} />
                      {canAdd(src.verification) ? (
                        <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.approveSource(src)} disabled={added}>
                          {added ? <Check size={12} /> : <Plus size={12} />} {added ? "In my list" : "Add"}
                        </button>
                      ) : (
                        <span className="vx-tiny" style={{ margin: 0 }}>Cannot be added.</span>
                      )}
                      {src.url && <a className="btn small" href={src.url} target="_blank" rel="noopener noreferrer">Open</a>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
