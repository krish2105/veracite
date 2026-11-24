"use client";

import { Download, AlertTriangle } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, Sample } from "@/components/app/ui";
import { AGENTS } from "@/components/app/data";

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
