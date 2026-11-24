"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, X, Eye, EyeOff, Swords, Download, AlertTriangle, RefreshCw, Archive, Upload, FileText } from "lucide-react";
import AppShell from "./AppShell";
import { Card, LabelIcon, Sample, StatusBadge, TrustLabel } from "./ui";
import { AGENTS, BRIEF, QUESTION, RECEIPTS, SOURCES, XRAY } from "./data";

const MiniMission = dynamic(() => import("./three/MiniMission"), { ssr: false });
const Galaxy = dynamic(() => import("./three/Galaxy"), { ssr: false });

/* ============================== Research ============================== */
const STEPS: [string, "done" | "active" | "todo", boolean?][] = [
  ["You asked", "done"], ["Planner", "done"], ["✋ Approve plan", "done", true], ["Scout", "done"], ["Verifier", "done"],
  ["✋ Approve sources", "done", true], ["Reader", "done"], ["Skeptic", "done"], ["Scribe", "done"], ["✋ Approve claims", "active", true], ["Integrity Clerk", "todo"],
];

export function ResearchTab() {
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected" | undefined>>(Object.fromEntries(SOURCES.map((s) => [s.id, s.decision])));
  const [kept, setKept] = useState<Record<string, "kept" | "dropped" | undefined>>({});
  return (
    <AppShell title="Research" subtitle="Five agents do the legwork. You approve three times." actions={<Sample>SAMPLE SESSION</Sample>}>
      <Card title={<>Mission control <Sample /></>} aside={<span className="lbl lbl-reported">Waiting for you · approve claims</span>}>
        <div className="qbox"><span className="mono muted">Q</span><b>{QUESTION}</b><span className="chips"><span>2015–2026</span><span>peer-reviewed first</span><span>any language</span></span></div>
        <div className="stepper">
          {STEPS.map(([t, st, gate], i) => (
            <span key={t} style={{ display: "contents" }}>
              <span className={`step ${st} ${gate ? "gate" : ""}`}><i />{t}</span>
              {i < STEPS.length - 1 && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
        <div className="mini3d"><MiniMission /><span className="mini3d-cap">3D · signals queue at the gate until you approve</span></div>
      </Card>

      <div className="g2">
        <Card title={<>Checkpoint 2 · sources <Sample /></>} aside={<span className="muted mono" style={{ fontSize: 11 }}>62 found · 48 verified · showing 6</span>}>
          <table className="vx-table">
            <thead><tr><th>Status</th><th>Source</th><th>Quality facts</th><th>Read</th><th>Decision</th></tr></thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.id} className={decisions[s.id] === "rejected" ? "rejected" : ""}>
                  <td><StatusBadge status={s.status} /></td>
                  <td><div className="t">{s.title}</div><div className="s">{s.authors} ({s.year}) · {s.venue} · <span className="mono">{s.doi}</span></div></td>
                  <td><div className="chips">
                    <span className={s.peer ? "on" : "warn"}>{s.peer ? "peer-reviewed" : "preprint"}</span>
                    {s.doaj && <span className="on">DOAJ</span>}{s.oa && <span>open access</span>}<span>cited {s.cited}</span><span>{s.country}</span>
                  </div></td>
                  <td title={s.opened ? "You opened this source" : "Not opened yet"}>{s.opened ? <Eye size={16} /> : <EyeOff size={16} className="muted" />}</td>
                  <td>
                    {s.status === "retracted" ? <span className="lbl lbl-notfound">Blocked</span> : (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button className={`btn small ${decisions[s.id] === "accepted" ? "ok" : ""}`} onClick={() => setDecisions((d) => ({ ...d, [s.id]: "accepted" }))} aria-label="Accept"><Check size={14} /></button>
                        <button className={`btn small ${decisions[s.id] === "rejected" ? "no" : ""}`} onClick={() => setDecisions((d) => ({ ...d, [s.id]: "rejected" }))} aria-label="Reject"><X size={14} /></button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={<>Checkpoint 3 · evidence brief <Sample /></>} aside={<button className="btn small"><Swords size={14} /> Debate a claim</button>}>
          <div className="claims">
            {BRIEF.map((c) => (
              <div key={c.id} className={`claim ${c.label}`} style={{ opacity: kept[c.id] === "dropped" ? 0.45 : 1 }}>
                <p>{c.text}</p>
                <div className="meta">
                  <TrustLabel kind={c.label} />
                  {c.sources.map((s) => <span key={s} className="srcchip">{s}</span>)}
                  <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
                    <button className={`btn small ${kept[c.id] === "kept" ? "ok" : ""}`} onClick={() => setKept((k) => ({ ...k, [c.id]: "kept" }))}>Keep</button>
                    <button className="btn small">Edit</button>
                    <button className={`btn small ${kept[c.id] === "dropped" ? "no" : ""}`} onClick={() => setKept((k) => ({ ...k, [c.id]: "dropped" }))}>Drop</button>
                  </span>
                </div>
                {c.quote && <p className="quote">“{c.quote}” · matched in source text</p>}
                {c.skeptic && <p className="sk"><Swords size={14} /> Skeptic: {c.skeptic}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="g2">
        <Card title="Receipts · audit trail" aside={<button className="btn small"><Download size={14} /> JSON</button>}>
          <div className="receipts">{RECEIPTS.map((r) => <div key={r.t}><time>{r.t}</time><b>{r.who}</b><span>{r.what}</span></div>)}</div>
        </Card>
        <Card title="Coach · explain it back" aside={<span className="muted mono" style={{ fontSize: 11 }}>required before export</span>}>
          <p className="read" style={{ marginTop: 0, fontSize: 15 }}>In one line, in your own words: what did Rahman &amp; Okafor (2021) find?</p>
          <textarea className="paste" style={{ minHeight: 90 }} placeholder="The AI can't fill this in for you." />
          <p className="vx-tiny">Socratic mode: “Which of your sources disagrees with C1, and why might that be?”</p>
        </Card>
      </div>
    </AppShell>
  );
}

/* ============================== Reference X-ray ============================== */
const PASTED = XRAY.map((r) => `${r.n}. ${r.pasted}`).join("\n\n");

export function XrayTab() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell title="Reference X-ray" subtitle="Paste any bibliography. Every line is checked field by field against Crossref, OpenAlex and arXiv. No AI involved."
      actions={<button className="btn primary">X-ray 5 references</button>}>
      <div className="g2">
        <Card title={<>Pasted bibliography <Sample>SAMPLE · AI-generated test list</Sample></>} aside={<button className="btn small"><Upload size={14} /> Drop PDF / BibTeX</button>}>
          <textarea className="paste" defaultValue={PASTED} spellCheck={false} />
          <div className="summary" style={{ marginTop: 12 }}>
            <StatusBadge status="verified" /><StatusBadge status="chimera" /><StatusBadge status="mismatch" /><StatusBadge status="notfound" /><StatusBadge status="retracted" />
          </div>
        </Card>
        <Card title="Chimera, taken apart" aside={<button className="btn small" onClick={() => setOpen((o) => !o)}>{open ? "Reassemble" : "Take apart"}</button>}>
          <div className={`chim ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)}>
            <div className="chim-card">
              <div className="chim-void">VOID</div>
              <div className="chim-slice a">Digital wellbeing apps raise GPA: a meta-analysis of 48 trials<small>Title · reworded from Lee &amp; Park (2019)</small></div>
              <div className="chim-slice b">Rahman, S., &amp; Lee, J.<small>Authors · real, but never co-authored</small></div>
              <div className="chim-slice c">(2020) · J. Sample Studies, 9(1) · doi:10.5555/sample.2020.9917<small>Year + DOI · invented, no record</small></div>
            </div>
            <span className="chim-hint">SP Jain policy §h(ix): fabricated from components of actual references · click</span>
          </div>
        </Card>
      </div>
      <Card title={<>Results · 5 references <Sample /></>} aside={<button className="btn small"><Download size={14} /> Export report</button>}>
        {XRAY.map((r) => (
          <div className="xr" key={r.n}>
            <div className="xr-head"><span className="xr-ref"><span className="mono muted">{r.n}. </span>{r.pasted}</span><StatusBadge status={r.status} /></div>
            <p className="xr-note">{r.note}</p>
            <table><thead><tr><th>Field</th><th>You pasted</th><th>Registry says</th><th>Match</th></tr></thead>
              <tbody>{r.fields.map((f) => <tr key={f.f}><td className="mono">{f.f}</td><td>{f.pasted}</td><td>{f.registry}</td><td className={`mono field-${f.match}`}>{f.match}</td></tr>)}</tbody></table>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}

/* ============================== Draft Checker ============================== */
export function DraftTab() {
  return (
    <AppShell title="Draft Checker" subtitle="Paste a paragraph. Each in-text citation is matched to its reference and the claim is checked against the source."
      actions={<button className="btn primary">Check paragraph</button>}>
      <div className="g2">
        <Card title={<>Your paragraph <Sample /></>}>
          <p className="draft">
            <mark className="verified">Teenagers who use phones in the hour before bed report poorer sleep quality</mark> <cite>(Rahman &amp; Okafor, 2021)</cite>.{" "}
            <mark className="reported">The same pattern appears among adolescents in the Gulf</mark> <cite>(Al Suwaidi &amp; Mensah, 2023)</cite>.{" "}
            <mark className="para">Participants with device use in the final hour before bed reported significantly poorer sleep quality</mark>, which shows the effect is robust.{" "}
            <mark className="notfound">Screen time also causes a 40% drop in exam grades</mark> <cite>(Chen et al., 2019)</cite>.
          </p>
          <div className="summary"><TrustLabel kind="verified" /><TrustLabel kind="reported" /><TrustLabel kind="notfound" /><span className="lbl lbl-ai"><LabelIcon kind="ai" size={12} />Copied too closely</span></div>
        </Card>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div className="note"><b style={{ color: "var(--ok)" }}>● Supported</b>The quote is found in Rahman &amp; Okafor (2021), checked against the abstract.</div>
          <div className="note"><b style={{ color: "var(--warn)" }}>◐ Reported, not checked</b>The source is real, but this detail isn't in its open text.</div>
          <div className="note"><b style={{ color: "var(--ai)" }}>Paraphrase guard</b>81% word overlap with Rahman &amp; Okafor (2021). Put it in quotation marks, or rewrite it in your own words.</div>
          <div className="note"><b style={{ color: "var(--alert)" }}>○ Not supported</b>Chen et al. (2019) is about melatonin; it never mentions exam grades. It's also a causal claim (Skeptic rule S4).</div>
          <div className="note"><b>APA 7 check</b>“Chen et al., 2019” is correct for 3+ authors. Two citations are missing from your reference list.</div>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================== Library ============================== */
export function LibraryTab() {
  const [view, setView] = useState<"galaxy" | "list">("galaxy");
  return (
    <AppShell title="Library" subtitle="Stored on this device. Every item verified on the way in, and re-checked when you open the library."
      actions={<div className="vx-seg"><button aria-checked={view === "galaxy"} role="radio" onClick={() => setView("galaxy")}>3D Galaxy</button><button aria-checked={view === "list"} role="radio" onClick={() => setView("list")}>List</button></div>}>
      <div className="banner"><AlertTriangle size={16} color="var(--alert)" /><span><b>Watchdog:</b> “Social media at night and adolescent wellbeing” (2018) was retracted after you saved it. It's now marked and excluded from exports. <Sample /></span></div>
      <div className="g-side">
        <Card title="Collections">
          <div className="coll">
            {[["Thesis · sleep & screens", 18, true], ["Methods reading", 7], ["To read", 11], ["Group project (shared)", 9]].map(([n, c, on]) => (
              <button key={n as string} aria-pressed={!!on}><span>{n}</span><span className="mono muted">{c}</span></button>
            ))}
          </div>
          <p className="vx-eyebrow" style={{ marginTop: 16 }}>Tags</p>
          <div className="chips"><span>cohort</span><span>RCT</span><span>MENA</span><span>null result</span><span>to cite</span></div>
          <p className="vx-eyebrow" style={{ marginTop: 16 }}>Import</p>
          <div className="exports"><button className="btn small"><Upload size={13} /> BibTeX / RIS</button><button className="btn small"><FileText size={13} /> Drop PDF</button></div>
        </Card>
        {view === "galaxy" ? (
          <Card title={<>Evidence Galaxy · drag to rotate <Sample /></>} aside={<span className="muted mono" style={{ fontSize: 11 }}>shape = type · colour = status</span>}>
            <div className="galaxy"><Galaxy /><div className="galaxy-legend"><span className="lbl lbl-verified">● verified</span><span className="lbl lbl-reported">◆ preprint / partial</span><span className="lbl lbl-notfound">■ retracted</span></div></div>
          </Card>
        ) : (
          <Card title={<>Sources <Sample /></>}>
            <table className="vx-table"><thead><tr><th>Status</th><th>Reference</th><th>Facts</th></tr></thead>
              <tbody>{SOURCES.map((s) => <tr key={s.id}><td><StatusBadge status={s.status} /></td><td><div className="t">{s.title}</div><div className="s">{s.authors} ({s.year}) · {s.venue}</div></td><td><div className="chips"><span>{s.peer ? "peer-reviewed" : "preprint"}</span><span>{s.country}</span></div></td></tr>)}</tbody></table>
          </Card>
        )}
      </div>
      <div className="g3">
        <Card title="Bias lens · countries">
          <div className="bars">{[["UK", 34], ["US", 28], ["CN", 14], ["AE", 9], ["JP", 8], ["other", 7]].map(([c, v]) => <div key={c}><span className="mono">{c}</span><i style={{ width: `${(v as number) * 2.4}%` }} /><span className="mono muted">{v}%</span></div>)}</div>
          <p className="vx-tiny">62% of your sources come from two countries. Consider regional studies (e.g. MENA).</p>
        </Card>
        <Card title="Bias lens · years">
          <div className="bars">{[["≤2015", 6], ["2016–19", 31], ["2020–22", 42], ["2023–26", 21]].map(([c, v]) => <div key={c}><span className="mono">{c}</span><i style={{ width: `${(v as number) * 2}%`, background: "var(--ok)" }} /><span className="mono muted">{v}%</span></div>)}</div>
          <p className="vx-tiny">Good recency. 21% from the last 3 years.</p>
        </Card>
        <Card title="Export">
          <div className="exports">{["APA 7", "MLA 9", "Harvard", "IEEE", "Chicago", "BibTeX", "RIS", "CSL-JSON"].map((e) => <button key={e} className={`btn small ${e === "APA 7" ? "primary" : ""}`}>{e}</button>)}</div>
          <p className="vx-tiny">Formatted with the official CSL style files (the same family Zotero uses). The AI-use statement and Prompt Ledger are attached automatically.</p>
          <p className="vx-tiny"><Archive size={12} /> Web sources include a Wayback Machine snapshot link.</p>
        </Card>
      </div>
    </AppShell>
  );
}

/* ============================== Trust Center ============================== */
export function TrustTab() {
  return (
    <AppShell title="Trust Center" subtitle="Who is accountable, what the AI may and may not do, where your data goes, and how well the checks actually perform."
      actions={<button className="btn"><AlertTriangle size={14} /> Report a wrong verdict</button>}>
      <Card title={<>Measured on our test set <Sample>ILLUSTRATIVE · real numbers after the 25 Nov test run</Sample></>}>
        <div className="g3" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
          <div className="stat"><b>—/20</b><span>fabricated references caught</span></div>
          <div className="stat"><b>0</b><span>target: fakes marked Verified</span></div>
          <div className="stat"><b>—%</b><span>real references verified</span></div>
          <div className="stat"><b>&lt;2s</b><span>target X-ray time per reference</span></div>
        </div>
      </Card>
      <div className="g2">
        <Card title="Model card · the agent crew">
          <table className="vx-table"><thead><tr><th>Agent</th><th>Engine</th><th>May</th><th>May not</th></tr></thead>
            <tbody>{AGENTS.map((a) => <tr key={a.name}><td><b>{a.name}</b></td><td className="mono" style={{ fontSize: 11.5 }}>{a.engine}</td><td>{a.can}</td><td className="muted">{a.cannot}</td></tr>)}</tbody></table>
        </Card>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <Card title="Accountability">
            <div className="policy"><b>You (the student)</b>Author of record. You approve the plan, the sources and every claim.</div>
            <div className="policy" style={{ marginTop: 8 }}><b>Veracite</b>Accountable for the truth of its checks. Test results are published here.</div>
            <div className="policy" style={{ marginTop: 8 }}><b>Faculty</b>Can re-verify any bibliography by scanning its certificate.</div>
          </Card>
          <Card title="Rules we follow">
            <div className="chips">
              {["SP Jain AI Policy v2 §h(vi)", "§h(viii) prompts", "§h(ix) fabrication", "§g(vi) faculty check", "APA 7 + GenAI 2025", "UNESCO GenAI", "UAE AI Charter", "UAE PDPL", "EU AI Act Art. 50", "COPE / ICMJE"].map((p) => <span key={p} className="on">{p}</span>)}
            </div>
          </Card>
        </div>
      </div>
      <Card title="Where your data goes">
        <div className="flow">
          <div><b>Your device</b>Library, notes, drafts, Prompt Ledger. Nothing is stored on our servers.</div>
          <div><b>Registries</b>Titles and DOIs only → Crossref, OpenAlex, arXiv. No personal data.</div>
          <div><b>AI (Groq)</b>Text scrubbed of names, emails and IDs first. Not used for training.</div>
          <div><b>Certificate</b>Data travels inside the link itself; anyone can re-check it.</div>
        </div>
      </Card>
      <Card title={<>Your AI-use statement · generated from the log <Sample /></>} aside={<button className="btn small"><Download size={14} /> Copy</button>}>
        <p className="statement">I used Veracite (Team 7, 2026) in <b>Assist</b> mode on 25 November 2026 to plan literature searches and check references. Its AI agents (open models hosted on Groq) proposed search terms and drafted a labelled evidence summary. All 4 cited references were verified against Crossref and OpenAlex; I reviewed and approved every source and claim, opened 3 of 4 sources, and wrote the final text myself. The full prompt ledger is attached.</p>
      </Card>
    </AppShell>
  );
}

/* ============================== Certificate ============================== */
function Rosette() {
  const paths = [0, 1, 2].map((k) => {
    const R = 120, r = [36, 45, 30][k], d = [70, 52, 44][k]; const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
    const loops = r / g(R, r); let s = "";
    for (let i = 0; i <= 1400; i++) { const t = (i / 1400) * Math.PI * 2 * loops; const x = 150 + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t); const y = 150 + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t); s += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }
    return s;
  });
  return <svg className="cert-ros" viewBox="0 0 300 300" aria-hidden>{paths.map((p, i) => <path key={i} d={p} fill="none" stroke={i === 1 ? "var(--accent)" : "var(--micro)"} strokeWidth=".7" opacity=".7" />)}</svg>;
}

export function CertificateTab() {
  const [qr, setQr] = useState("");
  useEffect(() => { QRCode.toDataURL("https://veracite.example/certificate#SAMPLE-7f3a9c", { margin: 0, width: 240 }).then(setQr); }, []);
  return (
    <AppShell title="Verification Certificate" subtitle="Attach to your submission. Your professor scans it and Veracite re-checks every reference live."
      actions={<><button className="btn"><RefreshCw size={14} /> Re-verify now</button><button className="btn primary"><Download size={14} /> PDF</button></>}>
      <article className="cert">
        <Rosette />
        <p className="vx-eyebrow">Veracite · Verification certificate · <span style={{ color: "var(--alert)" }}>SAMPLE</span></p>
        <h2>Every reference verified</h2>
        <p className="muted" style={{ margin: 0 }}>“Does screen time before bed reduce sleep quality in teenagers?”</p>
        <div className="cert-meta">
          <dl>
            <dt>Student</dt><dd>(name hidden in sample)</dd>
            <dt>Checked</dt><dd>25 Nov 2026, 10:44 Dubai</dd>
            <dt>Registries</dt><dd>Crossref · OpenAlex · Retraction Watch</dd>
            <dt>AI use</dt><dd>Assist mode · statement + ledger attached</dd>
            <dt>Result</dt><dd><TrustLabel kind="verified" /> 4 of 4 references · 0 retracted · 0 not found</dd>
          </dl>
          {qr ? <img className="cert-qr" src={qr} alt="QR code that opens this certificate for re-verification (sample)" /> : <div className="cert-qr" />}
        </div>
        <ol>
          {SOURCES.filter((s) => s.decision === "accepted").map((s) => (
            <li key={s.id}>{s.authors} ({s.year}). <i>{s.title}</i>. {s.venue}. <span className="mono" style={{ fontSize: 12 }}>https://doi.org/{s.doi}</span> <span style={{ color: "var(--ok)" }}><LabelIcon kind="verified" size={12} /></span></li>
          ))}
        </ol>
        <p className="cert-hash">SHA-256 · 7f3a9c0e5b1d42a8c6f0e93b7d21a4c58e6f0b9d3a7c12e4f5b6a8d9c0e1f2a3 · tamper-evident · SAMPLE</p>
      </article>
    </AppShell>
  );
}
