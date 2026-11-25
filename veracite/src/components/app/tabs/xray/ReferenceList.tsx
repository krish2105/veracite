"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Trash2 } from "lucide-react";
import { Card, StatusBadge } from "@/components/app/ui";
import { buildAiUseStatement, type StatementClaim } from "@/lib/integrity/statement";
import type { Autonomy, RegistryName } from "@/lib/types";
import { RelatedPapers } from "@/components/app/tabs/research/RelatedPapers";
import { listOutput, STYLES } from "@/lib/cite/styles";
import { useCiteStyle } from "@/lib/cite/styleStore";
import { refList, useRefList } from "./refList";
import { StyleSelect } from "./StyleSelect";
import { useStyledEntries } from "./useStyled";

const REGISTRY: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };

/** Copy with italics where the browser allows it, plain text everywhere else. */
async function copy(text: string, html?: string): Promise<boolean> {
  try {
    if (html && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) })]);
    } else await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CopyButton({ text, html, label }: { text: string; html?: string; label: string }) {
  const [said, setSaid] = useState("");
  return (
    <button
      className="btn primary small"
      onClick={async () => {
        setSaid((await copy(text, html)) ? "Copied" : "Select the text and copy it");
        setTimeout(() => setSaid(""), 2200);
      }}
    >
      {said === "Copied" ? <Check size={14} /> : <Copy size={14} />} <span aria-live="polite">{said || label}</span>
    </button>
  );
}

export function ReferenceList({ autonomy = "off", claims }: { autonomy?: Autonomy; claims?: StatementClaim[] } = {}) {
  const { sources, receipts } = useRefList();
  const [ownWork, setOwnWork] = useState("");
  const style = useCiteStyle();
  const styled = useStyledEntries(style, sources);
  const effective = styled.failed ? "apa" : style;
  const list = useMemo(() => listOutput(effective, styled.entries), [effective, styled.entries]);
  const byId = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const { label, heading, file } = STYLES[effective];
  const statement = useMemo(() => {
    const named = sources.map((s) => ({ ...s, verification: { ...s.verification, registries: s.verification.registries.map((r) => REGISTRY[r]) } }));
    return buildAiUseStatement({ receipts, autonomy, sources: named, claims, ownWork });
  }, [receipts, sources, ownWork, autonomy, claims]);
  const full = `${statement.text}\n\nReference for the tool:\n${statement.toolReference}`;

  return (
    <>
      <Card
        title={<>My reference list · {label} · {sources.length}</>}
        aside={sources.length ? <button className="btn small" onClick={() => refList.clear()}><Trash2 size={13} /> Clear list</button> : undefined}
      >
        {sources.length === 0 ? (
          <p className="xr-note">Empty. Nothing is added automatically: press <b>Add to my list</b> on a checked reference above.</p>
        ) : (
          <>
            <div className="xrx-row" style={{ marginTop: 0, marginBottom: 8 }}>
              <StyleSelect id="xrx-style" />
              {styled.loading && <span className="vx-tiny" aria-live="polite">Formatting in {label}…</span>}
              {styled.failed && <span className="vx-tiny" role="alert">{label} could not load, so APA 7 is shown.</span>}
            </div>
            <ul className="xrx-list">
              {styled.entries.map((e) => {
                const s = byId.get(e.id);
                if (!s) return null;
                return (
                <li key={s.id}>
                  {/* Built by code from the registry record; values are HTML-escaped (apa.ts / citeproc). */}
                  <p className="xrx-apa" dangerouslySetInnerHTML={{ __html: e.html }} />
                  <div className="xrx-row">
                    <StatusBadge status={s.verification.status} />
                    {s.verification.status !== "verified" && <span className="vx-tiny">Registry version. Not yet verified: check it before you submit.</span>}
                    {s.url && (
                      <a className="btn small" href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => refList.opened(s.id)}>
                        <ExternalLink size={13} /> {s.opened ? "Opened" : "Open and read"}
                      </a>
                    )}
                    <button className="btn small" onClick={() => refList.remove(s.id)}><Trash2 size={13} /> Remove</button>
                  </div>
                  {s.doi && <RelatedPapers doi={s.doi} />}
                </li>
                );
              })}
            </ul>
            <div className="xrx-row">
              <CopyButton text={list.text} html={list.html} label={`Copy ${label} list`} />
              <button
                className="btn small"
                disabled={styled.loading}
                onClick={() => download(file.replace(/\.txt$/, ".doc"), `<!doctype html><meta charset="utf-8"><body style="font-family:'Times New Roman',serif;font-size:12pt">${list.html.replace(/<p style="margin:0 0 12px;font-weight:600">[^<]*<\/p>/, `<p style="text-align:center"><b>${heading}</b></p>`)}</body>`, "application/msword")}
              >
                <Download size={13} /> Download for Word
              </button>
              <button className="btn small" disabled={styled.loading} onClick={() => download(file, `${list.text}\n`, "text/plain;charset=utf-8")}>
                <Download size={13} /> Download text
              </button>
            </div>
            <p className="vx-tiny">
              Formatted by code from registry records{style === "apa" ? "" : ", with the official CSL style"}. {style === "apa" ? "Check title capitalisation (APA uses sentence case)." : "Check capitalisation and details against your course's guide before you submit."}
            </p>
          </>
        )}
      </Card>

      <Card title={<>AI use statement</>}>
        {sources.length === 0 ? (
          <p className="xr-note">Add at least one reference, and a statement you can paste into your assignment appears here.</p>
        ) : (
          <>
            <label className="vx-eyebrow" htmlFor="xrx-own">Your own sentence: how did you use this? (we will not write it for you)</label>
            <textarea id="xrx-own" className="paste xrx-own" value={ownWork} onChange={(e) => setOwnWork(e.target.value)} placeholder="e.g. I read each source and wrote the final text myself." />
            <p className="statement xrx-statement">{full}</p>
            {statement.warnings.length > 0 && (
              <ul className="xrx-warn" aria-label="Check before submitting">
                {statement.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
            <div className="xrx-row">
              <CopyButton text={full} label="Copy statement" />
              <span className="vx-tiny">Built from this device&apos;s log of what was checked and what you approved.</span>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
