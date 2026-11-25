"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileUp, FlaskConical, Plus, ScanSearch } from "lucide-react";
import { Sample, StatusBadge } from "@/components/app/ui";
import { canAdd, refList, sourceId, useRefList } from "@/components/app/tabs/xray/refList";
import { useXray } from "@/components/app/tabs/xray/useXray";
import { parseLibraryFile, toReferenceLine, type ParsedLibrary } from "@/lib/import/bibfile";
import { SAMPLE_BIB } from "@/lib/import/sample";
import { MAX_REFERENCES } from "@/lib/verify/split";
import type { RefStatus, XrayLine } from "@/lib/types";

const MAX_BYTES = 2_000_000;
const VERDICT: Record<RefStatus, string> = {
  verified: "Verified.",
  partial: "Not yet verified.",
  mismatch: "Not verified as written.",
  chimera: "Stitched together from different papers. Do not cite it.",
  retracted: "Retracted. Do not cite it.",
  notfound: "Not found in any registry.",
};
const FORMAT = { bibtex: "BibTeX", ris: "RIS", unknown: "unknown" } as const;

type Loaded = ParsedLibrary & { name: string; sample: boolean };

/**
 * Import an existing library (K28): a .bib or .ris file goes through the same code-only X-ray, 30 at a
 * time. Only references found in the registries can be added, and what is saved is the registry's record.
 */
export function ImportLibrary() {
  const [loaded, setLoaded] = useState<Loaded>();
  const [paste, setPaste] = useState("");
  const [problem, setProblem] = useState("");
  const [batch, setBatch] = useState(-1);
  const { state, run, reset } = useXray();
  const { sources } = useRefList();
  const fileRef = useRef<HTMLInputElement>(null);

  const lines = useMemo(() => loaded?.entries.map(toReferenceLine) ?? [], [loaded]);
  const batches = Math.ceil(lines.length / MAX_REFERENCES);
  const results = Object.values(state.lines).sort((a, b) => a.n - b.n);
  const verifiedToAdd = results.filter((l) => l.verification.status === "verified" && canAdd(l.verification) && !sources.some((s) => s.id === sourceId(l.verification)));

  useEffect(() => {
    if (state.summary) refList.logCheck(state.summary.total, state.summary.byStatus);
  }, [state.summary]);

  const load = (text: string, name: string, sample = false) => {
    reset();
    setBatch(-1);
    const parsed = parseLibraryFile(text);
    if (parsed.format === "unknown") {
      setLoaded(undefined);
      setProblem("This is not a BibTeX or RIS file. In Zotero: File → Export Library → BibTeX or RIS.");
      return;
    }
    setProblem(parsed.entries.length ? "" : "No references with a title or DOI were found in this file.");
    setLoaded({ ...parsed, name, sample });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return setProblem("That file is larger than 2 MB. Export one collection at a time.");
    load(await file.text(), file.name);
    if (fileRef.current) fileRef.current.value = "";
  };

  const check = (b: number) => {
    setBatch(b);
    void run(lines.slice(b * MAX_REFERENCES, (b + 1) * MAX_REFERENCES).join("\n\n"));
  };

  const counts = (["verified", "partial", "mismatch", "chimera", "retracted", "notfound"] as RefStatus[])
    .map((s) => [s, results.filter((l) => l.verification.status === s).length] as const)
    .filter(([, n]) => n);

  return (
    <>
      <p className="xr-note" style={{ marginTop: 0 }}>
        Export your library from Zotero, Mendeley or EndNote as <b>BibTeX (.bib)</b> or <b>RIS (.ris)</b>. Veracite checks every entry against Crossref, OpenAlex and arXiv, and you add only the ones that are real. Nothing is added automatically. No AI involved.
      </p>
      <div className="xrx-row">
        <button className="btn primary" onClick={() => fileRef.current?.click()}><FileUp size={14} /> Choose a .bib or .ris file</button>
        <input ref={fileRef} type="file" accept=".bib,.bibtex,.ris,.txt" hidden onChange={(e) => void onFile(e.target.files?.[0])} aria-label="Library file" />
        <button className="btn" onClick={() => load(SAMPLE_BIB, "sample-library.bib", true)}><FlaskConical size={14} /> Load sample file</button>
      </div>
      <details className="lib-org">
        <summary>Or paste the file&apos;s text</summary>
        <label>
          BibTeX or RIS text
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"@article{key,\n  title = {…},\n  author = {…},\n  doi = {10.…}\n}"} />
        </label>
        <div className="xrx-row">
          <button className="btn small" disabled={!paste.trim()} onClick={() => load(paste, "pasted text")}>Read the pasted text</button>
        </div>
      </details>

      {problem && <p className="xr-note" role="alert"><span className="xrx-verdict">{problem}</span></p>}

      {loaded && loaded.entries.length > 0 && (
        <div className="imp-box">
          <p className="xr-note" style={{ margin: 0 }}>
            {loaded.sample && <><Sample>SAMPLE FILE · by Team 7 · includes deliberate fakes</Sample>{" "}</>}
            <b>{loaded.name}</b>: {loaded.entries.length} reference{loaded.entries.length === 1 ? "" : "s"} found ({FORMAT[loaded.format]})
            {loaded.skipped > 0 && <>; {loaded.skipped} left out because {loaded.skipped === 1 ? "it has" : "they have"} no title or DOI</>}.
          </p>
          <div className="xrx-row">
            {Array.from({ length: batches }, (_, b) => {
              const from = b * MAX_REFERENCES + 1;
              const to = Math.min((b + 1) * MAX_REFERENCES, lines.length);
              return (
                <button key={b} className={`btn small${b === 0 && batch < 0 ? " primary" : ""}`} disabled={state.running} onClick={() => check(b)} aria-busy={state.running && batch === b}>
                  <ScanSearch size={13} /> {state.running && batch === b ? `Checking ${results.length}/${to - from + 1}…` : batches === 1 ? `X-ray ${lines.length} reference${lines.length === 1 ? "" : "s"}` : `X-ray ${from}–${to}`}
                </button>
              );
            })}
            {batches > 1 && <span className="vx-tiny">Checked {MAX_REFERENCES} at a time, so the registries are not overloaded.</span>}
          </div>
        </div>
      )}

      {state.error && <p className="xr-note" role="alert"><span className="xrx-verdict">The check did not finish.</span> {state.error} Nothing was added.</p>}

      {results.length > 0 && (
        <div className="imp-box">
          <div className="xrx-row" style={{ marginTop: 0 }}>
            {counts.map(([s, n]) => <span key={s} className="imp-count"><StatusBadge status={s} /> {n}</span>)}
          </div>
          <div className="xrx-row">
            <button className="btn primary" disabled={!verifiedToAdd.length} onClick={() => verifiedToAdd.forEach((l) => refList.approve(l.verification, "import"))}>
              <Plus size={14} /> {verifiedToAdd.length ? `Add the ${verifiedToAdd.length} verified reference${verifiedToAdd.length === 1 ? "" : "s"}` : "All verified references are in your list"}
            </button>
            <span className="vx-tiny">Bring your Zotero library; keep only the references that are real.</span>
          </div>
          <ul className="imp-list">
            {results.map((l) => <ImportRow key={l.n} l={l} added={!!l.verification.matched && sources.some((s) => s.id === sourceId(l.verification))} />)}
          </ul>
        </div>
      )}
    </>
  );
}

function ImportRow({ l, added }: { l: XrayLine; added: boolean }) {
  const v = l.verification;
  return (
    <li className="imp-row">
      <div className="imp-head">
        <StatusBadge status={v.status} />
        <span className="imp-ref">{l.raw}</span>
      </div>
      <p className="vx-tiny" style={{ margin: "4px 0 0" }}>
        <span className="xrx-verdict">{VERDICT[v.status]}</span> {v.reasons[0]}
      </p>
      {canAdd(v) ? (
        <button className={`btn small ${added ? "ok" : ""}`} style={{ marginTop: 6 }} disabled={added} onClick={() => refList.approve(v, "import")}>
          {added ? <Check size={13} /> : <Plus size={13} />} {added ? "In my list" : v.status === "mismatch" ? "Add the registry's version" : "Add to my list"}
        </button>
      ) : (
        <p className="vx-tiny" style={{ margin: "4px 0 0" }}>Cannot be added to your list.</p>
      )}
    </li>
  );
}
