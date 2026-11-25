"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Trash2 } from "lucide-react";
import { Card, StatusBadge } from "@/components/app/ui";
import { buildAiUseStatement } from "@/lib/integrity/statement";
import type { RegistryName } from "@/lib/types";
import { apaList, apaReference } from "./apa";
import { refList, useRefList } from "./refList";

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

export function ReferenceList() {
  const { sources, receipts } = useRefList();
  const [ownWork, setOwnWork] = useState("");
  const apa = useMemo(() => apaList(sources), [sources]);
  const statement = useMemo(() => {
    const named = sources.map((s) => ({ ...s, verification: { ...s.verification, registries: s.verification.registries.map((r) => REGISTRY[r]) } }));
    return buildAiUseStatement({ receipts, autonomy: "off", sources: named, ownWork });
  }, [receipts, sources, ownWork]);
  const full = `${statement.text}\n\nReference for the tool:\n${statement.toolReference}`;

  return (
    <>
      <Card
        title={<>My reference list · APA 7 · {sources.length}</>}
        aside={sources.length ? <button className="btn small" onClick={() => refList.clear()}><Trash2 size={13} /> Clear list</button> : undefined}
      >
        {sources.length === 0 ? (
          <p className="xr-note">Empty. Nothing is added automatically: press <b>Add to my list</b> on a checked reference above.</p>
        ) : (
          <>
            <ul className="xrx-list">
              {[...sources].sort((a, b) => apaReference(a).text.localeCompare(apaReference(b).text, "en")).map((s) => (
                <li key={s.id}>
                  {/* Built by code from the registry record; every value is HTML-escaped in apa.ts. */}
                  <p className="xrx-apa" dangerouslySetInnerHTML={{ __html: apaReference(s).html }} />
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
                </li>
              ))}
            </ul>
            <div className="xrx-row">
              <CopyButton text={apa.text} html={apa.html} label="Copy APA 7 list" />
              <button
                className="btn small"
                onClick={() => download("references-apa7.doc", `<!doctype html><meta charset="utf-8"><body style="font-family:'Times New Roman',serif;font-size:12pt"><p style="text-align:center"><b>References</b></p>${apa.html}</body>`, "application/msword")}
              >
                <Download size={13} /> Download for Word
              </button>
              <button className="btn small" onClick={() => download("references-apa7.txt", `References\n\n${apa.text}\n`, "text/plain;charset=utf-8")}>
                <Download size={13} /> Download text
              </button>
            </div>
            <p className="vx-tiny">Formatted by code from registry records. Check title capitalisation (APA uses sentence case).</p>
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
