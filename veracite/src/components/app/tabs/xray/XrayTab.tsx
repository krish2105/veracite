"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, FileText, FlaskConical, ScanSearch, X } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, Sample, StatusBadge } from "@/components/app/ui";
import type { RefStatus } from "@/lib/types";
import { MAX_REFERENCES, splitBibliography } from "@/lib/verify/split";
import { ChimeraPanel } from "./ChimeraPanel";
import { LabelLegend } from "./LabelLegend";
import { ReferenceList } from "./ReferenceList";
import { refList } from "./refList";
import { ResultRow } from "./ResultRow";
import { TEST_LIST } from "./testList";
import { useXray } from "./useXray";
import { pdfToXrayInput } from "@/lib/import/pdftext";
import { readChatAnswer } from "@/lib/import/chatanswer";
import "./xray.css";

const ORDER: RefStatus[] = ["verified", "partial", "mismatch", "chimera", "retracted", "notfound"];

export function XrayTab() {
  const [text, setText] = useState("");
  const [chimeraN, setChimeraN] = useState<number | undefined>();
  const { state, run, reset } = useXray();
  // PDF drop (K37): read the PDF in this browser, fill the box, let the student check it before the X-ray.
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfNote, setPdfNote] = useState("");
  const [dragging, setDragging] = useState(false);
  // K39: a pasted chatbot answer (prose + "Sources") → check only its real references, flag bare mentions.
  const chat = useMemo(() => readChatAnswer(text), [text]);
  const [dangling, setDangling] = useState<string[]>([]);
  const useChatRefs = () => {
    reset();
    setDangling(chat.unmatched);
    setText([...chat.refs, ...chat.dois].join("\n\n"));
  };
  const readPdf = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return setPdfNote("That is not a PDF. Paste the reference list instead.");
    const { readPdfText, MAX_PDF_BYTES } = await import("@/lib/import/pdfread");
    if (file.size > MAX_PDF_BYTES) return setPdfNote("That PDF is larger than 20 MB. Paste the reference list instead.");
    setPdfNote(`Reading ${file.name} in your browser…`);
    try {
      const r = await readPdfText(file, (d, t) => setPdfNote(`Reading ${file.name} in your browser: page ${d} of ${t}…`));
      const got = pdfToXrayInput(r.text);
      if (got.source === "none") return setPdfNote(r.text.trim() ? "No reference list or DOI found in this PDF. Paste the references instead." : "This PDF has no text layer (it may be scanned). Paste the references instead.");
      reset();
      setText(got.text);
      setPdfNote(`${got.source === "references" ? `Found the reference list: ${got.count} reference${got.count === 1 ? "" : "s"}` : `No reference heading, so the ${got.count} DOI${got.count === 1 ? "" : "s"} in the text are listed`}${got.count > MAX_REFERENCES ? ` (the first ${MAX_REFERENCES} are checked)` : ""}. PDF text can merge or split lines: check the box, then press X-ray.${r.read < r.pages ? ` Only the first ${r.read} of ${r.pages} pages were read.` : ""}`);
    } catch {
      setPdfNote("This PDF could not be read. It may be protected or damaged. Paste the references instead.");
    } finally {
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };
  const count = useMemo(() => splitBibliography(text).length, [text]);
  const isTestList = text.trim() === TEST_LIST.trim();

  const lines = Object.values(state.lines);
  const done = lines.length;
  const counts = ORDER.map((s) => [s, lines.filter((l) => l.verification.status === s).length] as const).filter(([, c]) => c > 0);
  // Show first the chimera a DOI-only check would pass (a real DOI on the wrong paper); otherwise the first one (K52).
  const chimeras = lines.filter((l) => l.verification.status === "chimera").sort((a, b) => a.n - b.n);
  const firstChimera = chimeras.find((l) => l.verification.parts?.some((p) => p.field === "doi" && p.belongsTo)) ?? chimeras[0];
  const shown = chimeraN ? state.lines[chimeraN] : firstChimera;

  // Every finished check goes into the log the AI-use statement is built from.
  useEffect(() => {
    if (state.summary) refList.logCheck(state.summary.total, state.summary.byStatus);
  }, [state.summary]);

  const start = () => {
    setChimeraN(undefined);
    void run(text);
  };
  const download = () => {
    const report = { tool: "Veracite Reference X-ray", checkedAt: new Date().toISOString(), summary: state.summary, results: lines.sort((a, b) => a.n - b.n) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: "veracite-xray-report.json" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Reference X-ray"
      subtitle="1. Paste references. 2. Check them against Crossref, OpenAlex and arXiv. 3. Approve the good ones. 4. Copy your APA 7 list and AI-use statement. No AI involved."
      actions={
        <button className="btn primary" onClick={start} disabled={!count || state.running} aria-busy={state.running}>
          <ScanSearch size={15} /> {state.running ? `Checking ${done}/${state.refs.length || count}…` : `X-ray ${count || ""} reference${count === 1 ? "" : "s"}`}
        </button>
      }
    >
      <div className="xrx">
      <div className="g2">
        <Card
          title={<>Your reference list {isTestList && <Sample>TEST LIST · by Team 7 · includes deliberate fakes</Sample>}</>}
          aside={
            <span style={{ display: "inline-flex", gap: 6 }}>
              <button className="btn small" onClick={() => setText(TEST_LIST)} disabled={state.running}>
                <FlaskConical size={14} /> Load test list
              </button>
              <button className="btn small" onClick={() => pdfRef.current?.click()} disabled={state.running}>
                <FileText size={14} /> Read a PDF
              </button>
              <input ref={pdfRef} type="file" accept="application/pdf,.pdf" hidden aria-label="PDF file" onChange={(e) => void readPdf(e.target.files?.[0])} />
              {text && (
                <button
                  className="btn small"
                  onClick={() => {
                    setText("");
                    setDangling([]);
                    reset();
                  }}
                  disabled={state.running}
                >
                  <X size={14} /> Clear
                </button>
              )}
            </span>
          }
        >
          <label htmlFor="xray-input" className="vx-eyebrow">
            One reference per line, numbered, or separated by blank lines · APA, Harvard, MLA, IEEE or a ChatGPT answer · up to {MAX_REFERENCES}
          </label>
          <textarea
            id="xray-input"
            className={`paste${dragging ? " drop" : ""}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onDragOver={(e) => { if ([...e.dataTransfer.items].some((i) => i.kind === "file")) { e.preventDefault(); setDragging(true); } }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { const f = e.dataTransfer.files?.[0]; if (f) { e.preventDefault(); setDragging(false); void readPdf(f); } }}
            spellCheck={false}
            placeholder={"1. Author, A., & Author, B. (2025). Title of the paper. Journal Name, 12(3), 45–67. https://doi.org/…\n2. …"}
          />
          {pdfNote && <p className="xr-note" role="status" style={{ margin: "6px 0 0" }}>{pdfNote}</p>}
          {chat.looksLikeProse && (
            <div className="banner xr-chat" role="status">
              <span>
                <b>This looks like a chatbot answer, not a reference list.</b> Only full references can be checked: {chat.refs.length} reference{chat.refs.length === 1 ? "" : "s"}
                {chat.dois.length ? ` and ${chat.dois.length} DOI${chat.dois.length === 1 ? "" : "s"} from the text` : ""}.
                {chat.unmatched.length > 0 && ` ${chat.unmatched.length} mention${chat.unmatched.length === 1 ? " has" : "s have"} no full reference.`}
              </span>
              <button className="btn small primary" onClick={useChatRefs} disabled={state.running || chat.refs.length + chat.dois.length === 0}>Check only its references</button>
            </div>
          )}
          {dangling.length > 0 && !chat.looksLikeProse && (
            <p className="xrx-warn" role="note" style={{ margin: "6px 0 0", listStyle: "none" }}>
              Cannot be checked, no full reference given: {dangling.join(" · ")}. Ask the chatbot for the full reference, or leave {dangling.length === 1 ? "it" : "them"} out.
            </p>
          )}
          <p className="vx-tiny">
            {count ? `${count} reference${count === 1 ? "" : "s"} detected.` : "Nothing to check yet. Paste references, or drop a PDF on the box."} Only titles, authors and DOIs are sent to the public
            registries. Nothing is stored; a PDF is read in your browser.
          </p>
        </Card>

        <Card title="Chimera, taken apart">
          <ChimeraPanel n={shown?.n} parts={shown?.verification.parts} />
        </Card>
      </div>

      {state.error && (
        <div className="banner" role="alert">
          <AlertTriangle size={16} color="var(--alert)" />
          <span>{state.error}</span>
        </div>
      )}

      <Card
        title={<>Results · live from Crossref, OpenAlex and arXiv</>}
        aside={
          state.summary ? (
            <button className="btn small" onClick={download}>
              <Download size={14} /> Download report
            </button>
          ) : undefined
        }
      >
        {counts.length > 0 && (
          <div className="summary" style={{ marginBottom: 12 }} aria-label="Summary">
            {counts.map(([s, c]) => (
              <span key={s} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <StatusBadge status={s} />
                <b className="mono">{c}</b>
              </span>
            ))}
            {state.summary && <span className="vx-tiny" style={{ margin: 0 }}>{state.summary.total} checked in {(state.summary.ms / 1000).toFixed(1)} s</span>}
          </div>
        )}
        <div aria-live="polite">
          {state.refs.length === 0 ? (
            <p className="xr-note">
              Paste a reference list above and press <b>X-ray</b>. Each reference gets a verdict: Verified, Partial, Mismatch, Chimera, Retracted or Not
              found, with the reasons and what the registries actually say.
            </p>
          ) : (
            state.refs.map((raw, i) => (
              <ResultRow key={i} n={i + 1} raw={raw} v={state.lines[i + 1]?.verification} onTakeApart={() => setChimeraN(i + 1)} />
            ))
          )}
        </div>
      </Card>

      <LabelLegend />
      <ReferenceList />
      </div>
    </AppShell>
  );
}
