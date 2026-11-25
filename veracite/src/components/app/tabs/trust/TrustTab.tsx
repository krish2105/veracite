"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card } from "@/components/app/ui";
import { useRefList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import { buildLedger, ledgerToCSV, ledgerToJSON, ledgerToMarkdown } from "@/lib/integrity/ledger";
import { DEFAULT_CHAINS } from "@/lib/llm/models";
import type { Health } from "@/lib/types";
import results from "../../../../../tests/results/latest.json";

const ISSUES = "https://github.com/krish2105/veracite/issues/new?title=Wrong%20verdict&body=Paste%20the%20reference%20and%20the%20verdict%20you%20expected.%20No%20personal%20data%2C%20please.";

const AGENTS: [string, string, string, string][] = [
  ["Planner", DEFAULT_CHAINS.planner[0], "Propose search terms", "Search, cite or answer"],
  ["Scout", "Code", "Query Crossref and OpenAlex", "Edit metadata or invent records"],
  ["Verifier", "Code", "Decide whether a reference is real", "Be prompted: it has no prompt"],
  ["Reader", DEFAULT_CHAINS.reader[0], "Pull exact quotes", "Keep a quote that is not in the text"],
  ["Scribe", DEFAULT_CHAINS.scribe[0], "Draft from approved sources", "Cite anything unapproved"],
  ["Skeptic", DEFAULT_CHAINS.skeptic[0], "Challenge claims (rules S1–S8)", "Raise a label or add sources"],
];

const RULES = ["SP Jain Academic Integrity Policy v2 §h(vi) APA", "§h(viii) name AI tools and prompts", "§h(ix) fabricated references", "§g(vi) faculty verify references", "APA 7 + GenAI guidance", "UNESCO GenAI guidance", "UAE AI Charter", "UAE PDPL", "EU AI Act Art. 50", "COPE / ICMJE"];

const save = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function TrustTab() {
  const { receipts } = useRefList();
  const ledger = buildLedger(receipts);
  const [health, setHealth] = useState<(Health & { aiReason?: string }) | "error">();
  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setHealth)
      .catch(() => setHealth("error"));
  }, []);

  const m = results.summary;
  const rows = results.rows as { id: string; set: string; expected: string; got: string }[];
  const count = (set: string, ok: (r: (typeof rows)[number]) => boolean) => {
    const in_ = rows.filter((r) => r.set === set);
    return `${in_.filter(ok).length}/${in_.length}`;
  };
  const fakes = rows.filter((r) => r.set === "fabricated" || r.set === "chimeras");
  const wronglyVerified = rows.filter((r) => r.expected !== "verified" && r.got === "verified").length;
  const stats: [string, string][] = [
    [`${fakes.filter((r) => r.got !== "verified").length}/${fakes.length}`, "fabricated or stitched references not accepted"],
    [String(wronglyVerified), "fakes marked Verified (target 0)"],
    [count("real", (r) => r.got === "verified"), "real references verified"],
    [count("retracted", (r) => r.got === "retracted"), "retractions flagged"],
    [count("web", (r) => r.got === r.expected), "web pages as expected"],
  ];

  return (
    <AppShell
      title="Trust Center"
      subtitle="Who is accountable, what the AI may and may not do, where your data goes, and how well the checks actually perform."
      actions={<a className="btn" href={ISSUES} target="_blank" rel="noopener noreferrer"><AlertTriangle size={14} /> Report a wrong verdict</a>}
    >
      <div className="xrx">
        <Card title={<>Measured on our test set · {rows.length} references</>}>
          <div className="trust-stats">
            {stats.map(([v, t]) => (
              <div className="stat" key={t}><b>{v}</b><span>{t}</span></div>
            ))}
          </div>
          <p className="vx-tiny">
            Run {new Date(results.ranAt).toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" })} (Dubai) against live Crossref, OpenAlex and arXiv.
            Median {(m.timeMs.median / 1000).toFixed(1)} s per reference. Test data written or collected by Team 7; a small set, so treat the numbers as a check, not a guarantee.
          </p>
        </Card>

        <Card title="Right now">
          <p className="vx-tiny" style={{ marginTop: 0 }} aria-live="polite">
            {!health ? "Checking registries…" : health === "error" ? "The status check did not answer." : (
              <>
                Crossref {health.registries.crossref} · OpenAlex {health.registries.openalex} · arXiv {health.registries.arxiv}. AI:{" "}
                {health.ai === "rules" ? `Rules mode. ${health.aiReason ?? ""}` : "available"}
              </>
            )}
          </p>
        </Card>

        <Card title="Prompt Ledger · every prompt this device sent to an AI">
          {ledger.length === 0 ? (
            <p className="xr-note">No AI requests have been logged on this device. Checks made by code are listed in the Receipts of a research session.</p>
          ) : (
            <>
              <p className="xr-note">{ledger.length} AI request{ledger.length === 1 ? "" : "s"}, personal data removed. Attach it to your submission if your course asks for prompts (SP Jain §h(viii)).</p>
              <div className="xrx-row">
                <button className="btn small primary" onClick={() => save("prompt-ledger.md", ledgerToMarkdown(ledger), "text/markdown")}><Download size={13} /> Markdown</button>
                <button className="btn small" onClick={() => save("prompt-ledger.csv", ledgerToCSV(ledger), "text/csv")}><Download size={13} /> CSV</button>
                <button className="btn small" onClick={() => void ledgerToJSON(ledger).then((j) => save("prompt-ledger.json", JSON.stringify(j, null, 2), "application/json"))}><Download size={13} /> JSON with fingerprint</button>
              </div>
            </>
          )}
        </Card>

        <Card title="The crew · what each part may and may not do">
          <ul className="trust-agents">
            {AGENTS.map(([name, engine, can, cannot]) => (
              <li key={name}><b>{name}</b> <span className="mono muted">{engine}</span><br />May: {can}. <span className="muted">May not: {cannot}.</span></li>
            ))}
          </ul>
          <p className="vx-tiny">Trust labels are set by code. A model never writes a reference, a label or a score.</p>
        </Card>

        <Card title="Accountability">
          <div className="policy"><b>You (the student)</b>Author of record. You approve the plan, the sources and every claim.</div>
          <div className="policy" style={{ marginTop: 8 }}><b>Veracite (Team 7)</b>Accountable for the truth of its checks. Test results are published here, including what fails.</div>
          <div className="policy" style={{ marginTop: 8 }}><b>Faculty</b>Can re-check any bibliography by opening its certificate.</div>
        </Card>

        <Card title="Where your data goes">
          <div className="flow">
            <div><b>Your device</b>Reference list, notes and logs. No account; nothing stored on our servers.</div>
            <div><b>Registries</b>References and search terms go to Crossref, OpenAlex and arXiv through our server.</div>
            <div><b>AI (Groq)</b>Only when AI is on: your question and source abstracts, with personal data removed.</div>
            <div><b>Certificate</b>The data travels inside the link; anyone with it can read and re-check it.</div>
          </div>
        </Card>

        <Card title="Known limits">
          <ul className="xrx-warn" style={{ color: "var(--ink2)" }}>
            <li>Only abstracts are read, so a true quote from deeper in a paper shows “not yet checked”.</li>
            <li>Web pages without a DOI can only be Partial.</li>
            <li>Registries can be wrong or incomplete; “Verified” means two public registries agree with the reference.</li>
          </ul>
        </Card>

        <Card title="Rules we design for">
          <div className="chips">{RULES.map((p) => <span key={p} className="on">{p}</span>)}</div>
        </Card>
      </div>
    </AppShell>
  );
}
