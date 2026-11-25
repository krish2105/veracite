"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, FlaskConical, ScanSearch, X } from "lucide-react";
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
import "./xray.css";

const ORDER: RefStatus[] = ["verified", "partial", "mismatch", "chimera", "retracted", "notfound"];

export function XrayTab() {
  const [text, setText] = useState("");
  const [chimeraN, setChimeraN] = useState<number | undefined>();
  const { state, run, reset } = useXray();
  const count = useMemo(() => splitBibliography(text).length, [text]);
  const isTestList = text.trim() === TEST_LIST.trim();

  const lines = Object.values(state.lines);
  const done = lines.length;
  const counts = ORDER.map((s) => [s, lines.filter((l) => l.verification.status === s).length] as const).filter(([, c]) => c > 0);
  const firstChimera = lines.filter((l) => l.verification.status === "chimera").sort((a, b) => a.n - b.n)[0];
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
              {text && (
                <button
                  className="btn small"
                  onClick={() => {
                    setText("");
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
            className="paste"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={"1. Author, A., & Author, B. (2025). Title of the paper. Journal Name, 12(3), 45–67. https://doi.org/…\n2. …"}
          />
          <p className="vx-tiny">
            {count ? `${count} reference${count === 1 ? "" : "s"} detected.` : "Nothing to check yet."} Only titles, authors and DOIs are sent to the public
            registries. Nothing is stored.
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
