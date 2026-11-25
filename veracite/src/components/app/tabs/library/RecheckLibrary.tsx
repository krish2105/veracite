"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import { refList } from "@/components/app/tabs/xray/refList";
import { applyRecheck, recheckOutcome, type RecheckOutcome } from "@/lib/verify/recheck";
import type { SourceRecord, Verification } from "@/lib/types";

const KEY = "vx-library-checked-v1";
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

/**
 * Re-check my library (K35): papers get retracted after you save them. Each saved DOI is checked again,
 * three at a time, and only NEW retractions, corrections or concerns change anything. Code only, no AI.
 */
export function RecheckLibrary({ sources }: { sources: SourceRecord[] }) {
  const [last, setLast] = useState<string>();
  const [run, setRun] = useState<{ done: number; total: number } | undefined>();
  const [changes, setChanges] = useState<{ id: string; title: string; o: RecheckOutcome }[]>();
  const [failed, setFailed] = useState(0);
  useEffect(() => {
    try {
      setLast(localStorage.getItem(KEY) ?? undefined);
    } catch {
      /* private mode */
    }
  }, []);

  const start = async () => {
    const list = sources.filter((s) => s.doi);
    const t0 = Date.now();
    const found: { id: string; title: string; o: RecheckOutcome }[] = [];
    let errors = 0;
    let done = 0;
    setChanges(undefined);
    setFailed(0);
    setRun({ done, total: list.length });
    const queue = [...list];
    const worker = async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        try {
          const r = await fetch("/api/sources/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: `https://doi.org/${s.doi}` }) });
          const j = (await r.json()) as { ok: boolean; verification?: Verification };
          if (!j.ok || !j.verification) throw new Error();
          const o = recheckOutcome(s.verification, j.verification);
          const at = new Date().toISOString();
          if (o.kind !== "unchanged") {
            refList.update(s.id, { verification: applyRecheck(s.verification, o, at) });
            found.push({ id: s.id, title: s.title, o });
          }
        } catch {
          errors++;
        }
        setRun({ done: ++done, total: list.length });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    const at = new Date().toISOString();
    try {
      localStorage.setItem(KEY, at);
    } catch {
      /* private mode */
    }
    refList.log({ actor: "verifier", action: "rechecked_library", aiUsed: false, ms: Date.now() - t0, ok: errors === 0, detail: `${list.length} re-checked: ${found.length} changed${errors ? `, ${errors} could not be checked` : ""}` });
    setLast(at);
    setChanges(found);
    setFailed(errors);
    setRun(undefined);
  };

  const withDoi = sources.filter((s) => s.doi).length;
  return (
    <>
      <p className="xr-note" style={{ marginTop: 0 }}>Papers can be retracted or corrected after you save them. Check every saved DOI again against Crossref, OpenAlex and Retraction Watch data. No AI involved.</p>
      <div className="xrx-row">
        <button className="btn primary" onClick={() => void start()} disabled={!!run || !withDoi} aria-busy={!!run}>
          <RefreshCw size={14} /> {run ? `Checking ${run.done}/${run.total}…` : `Re-check ${withDoi} source${withDoi === 1 ? "" : "s"} now`}
        </button>
        <span className="vx-tiny">{last ? `Last re-checked ${when(last)} (Dubai)` : "Not re-checked since you saved them."}</span>
      </div>
      {changes && (
        changes.length === 0 ? (
          <p className="xr-note" role="status">No new retractions, corrections or concerns.{failed ? ` ${failed} could not be checked; try again later.` : ""}</p>
        ) : (
          <ul className="xrx-warn" role="alert" aria-label="What changed">
            {changes.map((c) => (
              <li key={c.id}><StatusBadge status={c.o.kind === "retracted" ? "retracted" : "partial"} /> <b>{c.title}</b>: {c.o.message}</li>
            ))}
          </ul>
        )
      )}
    </>
  );
}
