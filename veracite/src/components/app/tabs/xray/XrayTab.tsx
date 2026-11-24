"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, Sample, StatusBadge } from "@/components/app/ui";
import { XRAY } from "@/components/app/data";

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
