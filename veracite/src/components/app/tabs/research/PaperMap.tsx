"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import { canAdd, refList, sourceId, toSource, useRefList } from "@/components/app/tabs/xray/refList";
import type { Candidate } from "@/lib/agents/scout";
import type { CitationDirection } from "@/lib/registries/openalex";
import type { RefStatus, SourceRecord } from "@/lib/types";
import { mapLayout } from "./mapLayout";

const W = 640;
const H = 360;
const TONE: Record<RefStatus, string> = { verified: "var(--ok)", partial: "var(--warn)", mismatch: "var(--warn)", chimera: "var(--alert)", retracted: "var(--alert)", notfound: "var(--alert)" };
const short = (s: SourceRecord) => `${s.authors[0]?.family ?? "Unknown"}${s.authors.length > 1 ? " et al." : ""}, ${s.year ?? "n.d."}`;

async function side(doi: string, direction: CitationDirection): Promise<SourceRecord[]> {
  const r = await fetch("/api/sources/snowball", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doi, direction, perPage: 8 }) });
  const j = (await r.json()) as { ok?: boolean; error?: string; candidates?: Candidate[] };
  if (!j.ok) throw new Error(j.error ?? "The citations could not be loaded.");
  return (j.candidates ?? []).map(({ record, verification }) => toSource(verification.matched ? verification : { ...verification, matched: record }));
}

/**
 * Related-papers map (K42): what a paper cites (left) and what cites it (right), oldest at the top, size by
 * citations, colour by Veracite's verdict. Every node is verified by code; nothing is added without a click.
 */
export function PaperMap({ doi }: { doi: string }) {
  const { sources } = useRefList();
  const [data, setData] = useState<{ refs: SourceRecord[]; citing: SourceRecord[] }>();
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<string>();

  useEffect(() => {
    let live = true;
    const t0 = Date.now();
    Promise.all([side(doi, "references"), side(doi, "cited_by")])
      .then(([refs, citing]) => {
        if (!live) return;
        setData({ refs, citing });
        refList.log({ actor: "scout", action: "mapped_citations", aiUsed: false, ms: Date.now() - t0, ok: true, detail: `${doi}: ${refs.length} it cites, ${citing.length} citing it, all verified` });
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "The citations could not be loaded."));
    return () => {
      live = false;
    };
  }, [doi]);

  const all = useMemo(() => (data ? [...data.refs, ...data.citing] : []), [data]);
  const layout = useMemo(
    () => (data ? mapLayout(data.refs.map((s) => ({ id: s.id, year: s.year, citedBy: s.quality.citedBy })), data.citing.map((s) => ({ id: s.id, year: s.year, citedBy: s.quality.citedBy })), W, H) : undefined),
    [data],
  );
  if (error) return <p className="vx-tiny" role="alert">{error}</p>;
  if (!data || !layout) return <p className="vx-tiny" aria-live="polite">Drawing the map: looking up citations and verifying each one…</p>;
  const byId = new Map(all.map((s) => [s.id, s]));
  const sel = picked ? byId.get(picked) : undefined;
  const added = sel ? sources.some((s) => s.id === sourceId(sel.verification) || s.id === sel.id) : false;

  return (
    <div className="pmap">
      <div className="pmap-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Citation map: ${data.refs.length} papers it cites on the left, ${data.citing.length} papers citing it on the right`}>
          <text x={16} y={18} className="pmap-cap">It cites ({data.refs.length})</text>
          <text x={W - 16} y={18} className="pmap-cap" textAnchor="end">Cited by ({data.citing.length})</text>
          {layout.nodes.map((n) => <line key={`l-${n.id}`} x1={layout.center.x} y1={layout.center.y} x2={n.x} y2={n.y} className="pmap-edge" />)}
          <circle cx={layout.center.x} cy={layout.center.y} r={14} className="pmap-center" />
          <text x={layout.center.x} y={layout.center.y + 30} textAnchor="middle" className="pmap-cap">This paper</text>
          {layout.nodes.map((n) => {
            const s = byId.get(n.id)!;
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.title} (${short(s)}), ${s.verification.status}`}
                aria-pressed={picked === n.id}
                className="pmap-node"
                onClick={() => setPicked(n.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setPicked(n.id))}
              >
                <title>{`${s.title} (${short(s)})`}</title>
                <circle cx={n.x} cy={n.y} r={n.r} fill={TONE[s.verification.status]} fillOpacity={picked === n.id ? 0.95 : 0.55} stroke={TONE[s.verification.status]} strokeWidth={picked === n.id ? 3 : 1.5} />
                <text x={n.side === "references" ? n.x + n.r + 4 : n.x - n.r - 4} y={n.y + 4} textAnchor={n.side === "references" ? "start" : "end"} className="pmap-year">{s.year ?? "n.d."}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="vx-tiny" style={{ margin: "4px 0 0" }}>Oldest at the top · bigger = more cited · colour = Veracite&apos;s verdict (green Verified, amber not yet, red do not cite). From OpenAlex, checked by code. Tap a dot.</p>
      {sel && (
        <div className="pmap-pick" aria-live="polite">
          <p className="rel-title" style={{ margin: 0 }}>{sel.title} <span className="muted">({short(sel)})</span></p>
          <div className="xrx-row">
            <StatusBadge status={sel.verification.status} />
            {canAdd(sel.verification) ? (
              <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.approveSource(sel)} disabled={added}>
                {added ? <Check size={12} /> : <Plus size={12} />} {added ? "In my list" : "Add to my list"}
              </button>
            ) : (
              <span className="vx-tiny" style={{ margin: 0 }}>Cannot be added.</span>
            )}
            {sel.url && <a className="btn small" href={sel.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Open</a>}
          </div>
        </div>
      )}
    </div>
  );
}
