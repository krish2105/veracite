"use client";

/**
 * Export gate (task Z15): shown before any reference list is downloaded.
 * Read-before-you-cite + explain-it-back + flagged sources + the AI-use statement, in one place.
 * The student decides: open items are warnings they acknowledge, never silent, never forced.
 * Rules live in `lib/integrity/gate.ts` (unit-tested); this file is only the dialog.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, X, XCircle } from "lucide-react";
import { refList } from "@/components/app/tabs/xray/refList";
import { appendStatement, exportGate } from "@/lib/integrity/gate";
import { buildAiUseStatement } from "@/lib/integrity/statement";
import type { Receipt, RegistryName, SourceRecord } from "@/lib/types";
import "./ExportGate.css";

const REGISTRY: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };

export interface ExportFormat {
  label: string;
  filename: string;
  mime: string;
  build: () => string;
  /** Plain-text formats (APA 7) can carry the AI-use statement; BibTeX/RIS/JSON cannot. */
  canIncludeStatement: boolean;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportGate({ sources, receipts, format, onClose }: { sources: SourceRecord[]; receipts: Receipt[]; format: ExportFormat; onClose: () => void }) {
  const report = exportGate(sources);
  const [ack, setAck] = useState(false);
  const [ownWork, setOwnWork] = useState("");
  const [withStatement, setWithStatement] = useState(format.canIncludeStatement);
  const heading = useRef<HTMLHeadingElement>(null);

  const statement = useMemo(() => {
    const named = sources.map((s) => ({ ...s, verification: { ...s.verification, registries: s.verification.registries.map((r) => REGISTRY[r]) } }));
    return buildAiUseStatement({ receipts, autonomy: receipts.some((r) => r.aiUsed) ? "assist" : "off", sources: named, ownWork });
  }, [sources, receipts, ownWork]);

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const needsAck = !report.clean;
  const ready = report.canExport && (!needsAck || ack);

  function confirm() {
    if (!ready) return;
    const body = format.build();
    download(format.filename, withStatement && format.canIncludeStatement ? appendStatement(body, statement.text, statement.toolReference) : body, format.mime);
    const open = report.lines.filter((l) => l.level === "warn").length;
    refList.log({ actor: "student", action: "export_references", detail: `${format.label}: ${report.total} sources${open ? `, ${open} warning${open === 1 ? "" : "s"} acknowledged` : ""}${withStatement && format.canIncludeStatement ? ", AI-use statement included" : ""}`, aiUsed: false, ms: 0, ok: true });
    onClose();
  }

  return (
    <div className="xg-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xg" role="dialog" aria-modal="true" aria-labelledby="xg-title">
        <div className="xg-head">
          <h2 id="xg-title" ref={heading} tabIndex={-1}>Before you export · {format.label}</h2>
          <button className="btn small" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <ul className="xg-checks">
          {report.lines.map((l) => (
            <li key={l.text} data-level={l.level}>
              {l.level === "ok" ? <CheckCircle2 size={15} /> : l.level === "warn" ? <AlertTriangle size={15} /> : <XCircle size={15} />}
              <span>{l.text}</span>
            </li>
          ))}
        </ul>

        {report.unread.length > 0 && (
          <details className="xg-sec">
            <summary>Not opened yet ({report.unread.length})</summary>
            <ul>
              {report.unread.map((s) => {
                const url = sources.find((x) => x.id === s.id)?.url;
                return (
                  <li key={s.id}>
                    {url ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => refList.opened(s.id)}>{s.title}</a> : s.title}
                  </li>
                );
              })}
            </ul>
          </details>
        )}

        {report.unexplained.length > 0 && (
          <details className="xg-sec" open>
            <summary>Explain it back, in your own words ({report.unexplained.length})</summary>
            <p className="vx-tiny">One line each: what does this source show? There is no AI button here on purpose.</p>
            {report.unexplained.map((s) => (
              <label key={s.id} className="xg-explain">
                <span>{s.title}</span>
                <textarea defaultValue={s.explainBack ?? ""} maxLength={600} rows={2} onBlur={(e) => refList.update(s.id, { explainBack: e.target.value.slice(0, 600) })} />
              </label>
            ))}
          </details>
        )}

        <details className="xg-sec" open={format.canIncludeStatement}>
          <summary>AI-use statement (built from your session log)</summary>
          <p className="xg-statement">{statement.text}</p>
          <label className="xg-explain">
            <span>Your own sentence on how you used the output (the tool never writes this for you)</span>
            <textarea value={ownWork} onChange={(e) => setOwnWork(e.target.value.slice(0, 600))} rows={2} placeholder="e.g. I wrote the final text myself and used Veracite to check my references." />
          </label>
          {format.canIncludeStatement ? (
            <label className="xg-tick">
              <input type="checkbox" checked={withStatement} onChange={(e) => setWithStatement(e.target.checked)} /> Add the statement and the tool's APA reference to the file
            </label>
          ) : (
            <p className="vx-tiny">{format.label} files can't hold the statement: copy it from the X-ray page or download APA 7.</p>
          )}
        </details>

        {needsAck && report.canExport && (
          <label className="xg-tick xg-ack">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I have read the warnings above. I am the author and take responsibility for these references.
          </label>
        )}

        <div className="xg-foot">
          <button className="btn small" onClick={onClose}>Back</button>
          <button className="btn small primary" disabled={!ready} onClick={confirm}><Download size={13} /> Download {format.label}</button>
        </div>
      </div>
    </div>
  );
}
