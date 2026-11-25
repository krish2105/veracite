"use client";

import { useState } from "react";
import { Bell, Check, Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import { canAdd, refList, sourceId, toSource, useRefList } from "@/components/app/tabs/xray/refList";
import type { Candidate } from "@/lib/agents/scout";
import type { SourceRecord } from "@/lib/types";

type Window = "saved" | "year";
interface Found { cites: string; src: SourceRecord; status: Candidate["verification"]["status"] }

const MAX_SOURCES = 10;
const PER_SOURCE = 5;
const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const short = (s: SourceRecord) => `${s.authors[0]?.family ?? "Unknown"}${s.authors.length > 1 ? " et al." : ""}, ${s.year ?? "n.d."}`;

/**
 * New citations (K41): papers that cite your saved sources and were published since you saved them (or in the
 * last 12 months), from OpenAlex. Every result goes through the Verifier; nothing is added without a click.
 */
export function NewCitations({ sources }: { sources: SourceRecord[] }) {
  const { sources: list } = useRefList();
  const [win, setWin] = useState<Window>("saved");
  const [busy, setBusy] = useState<{ done: number; total: number }>();
  const [found, setFound] = useState<Found[]>();
  const [failed, setFailed] = useState(0);

  const run = async () => {
    const targets = sources.filter((s) => s.doi).slice(0, MAX_SOURCES);
    const out = new Map<string, Found>();
    let errors = 0;
    let done = 0;
    const t0 = Date.now();
    setFound(undefined);
    setBusy({ done, total: targets.length });
    const queue = [...targets];
    const worker = async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        const since = win === "saved" ? day(new Date(s.addedAt)) : day(new Date(Date.now() - 365 * 86_400_000));
        try {
          const r = await fetch("/api/sources/snowball", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doi: s.doi, direction: "cited_by", since, perPage: PER_SOURCE }) });
          const j = (await r.json()) as { ok?: boolean; candidates?: Candidate[] };
          if (!j.ok) throw new Error();
          for (const { record, verification } of j.candidates ?? []) {
            const src = toSource(verification.matched ? verification : { ...verification, matched: record });
            if (!out.has(src.id)) out.set(src.id, { cites: short(s), src, status: verification.status });
          }
        } catch {
          errors++;
        }
        setBusy({ done: ++done, total: targets.length });
      }
    };
    await Promise.all([worker(), worker()]);
    refList.log({ actor: "scout", action: "checked_new_citations", aiUsed: false, ms: Date.now() - t0, ok: errors === 0, detail: `${targets.length} sources, ${win === "saved" ? "since saved" : "last 12 months"}: ${out.size} citing papers found` });
    setFound([...out.values()].filter((f) => !list.some((l) => l.id === f.src.id)));
    setFailed(errors);
    setBusy(undefined);
  };

  const n = Math.min(sources.filter((s) => s.doi).length, MAX_SOURCES);
  return (
    <>
      <p className="xr-note" style={{ marginTop: 0 }}>Papers that cite your saved sources, newest first, from OpenAlex. Each one is verified before you see it. No AI involved.</p>
      <div className="xrx-row">
        <select id="nc-window" value={win} onChange={(e) => setWin(e.target.value as Window)} aria-label="Time window">
          <option value="saved">Published since you saved each source</option>
          <option value="year">Published in the last 12 months</option>
        </select>
        <button className="btn primary" onClick={() => void run()} disabled={!!busy || !n} aria-busy={!!busy}>
          <Bell size={14} /> {busy ? `Checking ${busy.done}/${busy.total}…` : `Check ${n} source${n === 1 ? "" : "s"}`}
        </button>
      </div>
      {found && (
        found.length === 0 ? (
          <p className="xr-note" role="status">No new papers cite your sources in this window.{failed ? ` ${failed} could not be checked; try again later.` : ""}</p>
        ) : (
          <ul className="rel-list" style={{ marginTop: 10 }}>
            {found.map((f) => {
              const added = list.some((s) => s.id === sourceId(f.src.verification) || s.id === f.src.id);
              return (
                <li key={f.src.id}>
                  <span className="rel-title">{f.src.title} <span className="muted">({short(f.src)}) · cites {f.cites}</span></span>
                  <span className="rel-actions">
                    <StatusBadge status={f.status} />
                    {canAdd(f.src.verification) ? (
                      <button className={`btn small ${added ? "ok" : "primary"}`} onClick={() => refList.approveSource(f.src)} disabled={added}>
                        {added ? <Check size={12} /> : <Plus size={12} />} {added ? "In my list" : "Add"}
                      </button>
                    ) : (
                      <span className="vx-tiny" style={{ margin: 0 }}>Cannot be added.</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )
      )}
    </>
  );
}
