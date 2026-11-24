"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle, Archive, Upload, FileText } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, Sample, StatusBadge } from "@/components/app/ui";
import { SOURCES } from "@/components/app/data";

const Galaxy = dynamic(() => import("@/components/app/three/Galaxy"), { ssr: false });

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
