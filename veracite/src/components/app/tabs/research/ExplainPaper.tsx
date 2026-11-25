"use client";

import { useState } from "react";
import { BookOpenText, Send } from "lucide-react";
import { autonomyStore } from "@/components/app/AppShell";
import { TrustLabel } from "@/components/app/ui";
import { refList } from "@/components/app/tabs/xray/refList";
import { useStore } from "@/components/lab/store";
import type { AgentRun, Explanation } from "@/lib/agents";
import type { SourceRecord } from "@/lib/types";

type Result = AgentRun<Explanation> & { ok: true };

/**
 * "Explain this paper" (K30) on a saved source. The Reader explains the abstract; code labels every
 * sentence. With AI off or unavailable it shows the abstract's own sentences instead, and says so.
 */
export function ExplainPaper({ source }: { source: SourceRecord }) {
  const autonomy = useStore(autonomyStore);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>();

  const run = async (q?: string) => {
    setBusy(true);
    setError("");
    const t0 = Date.now();
    try {
      const res = await fetch("/api/agents/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "library", aiOff: autonomy === "off", sources: [source], question: q }),
      });
      const j = (await res.json()) as Result | { ok: false; error: string };
      if (!j.ok) throw new Error(j.error);
      setResult(j);
      refList.log({
        actor: "reader",
        action: "explained_source",
        detail: `${source.id}${q ? ` · question: ${q.slice(0, 120)}` : ""} · ${j.mode === "ai" ? "AI" : "Rules mode"}${j.dropped.length ? ` · ${j.dropped.length} removed by code` : ""}`,
        aiUsed: j.mode === "ai",
        model: j.model,
        prompt: j.prompt,
        tokens: j.tokens,
        ms: Date.now() - t0,
        ok: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The explanation could not be made.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn small" onClick={() => { setOpen(true); void run(); }}>
        <BookOpenText size={13} /> Explain this paper
      </button>
    );
  }

  const ex = result?.data;
  return (
    <div className="ex-box" aria-busy={busy}>
      <p className="vx-eyebrow" style={{ margin: 0 }}>Explain this paper · from its abstract only</p>
      {busy && !result && <p className="xr-note" aria-live="polite">Reading the abstract…</p>}
      {error && <p className="xr-note" role="alert"><span className="xrx-verdict">The explanation did not finish.</span> {error}</p>}

      {result && ex && (
        <>
          <p className="vx-tiny" style={{ marginTop: 4 }}>
            {result.mode === "ai"
              ? `Written by AI (${result.model ?? "model"}) from the abstract only. Labels are set by code: Verified means the quoted words are in the abstract.`
              : `Rules mode: ${result.reason ?? "AI is not available."} ${ex.sentences.length ? "Below are the abstract's own sentences, not an explanation." : ""}`}
          </p>
          <ul className="ex-list">
            {ex.sentences.map((s, i) => (
              <li key={i}>
                <TrustLabel kind={s.label} />
                <span>{s.text}</span>
                {s.kind === "explanation" && s.quote && <span className="ex-quote">From the abstract: “{s.quote}”</span>}
              </li>
            ))}
          </ul>
          {result.dropped.length > 0 && (
            <ul className="xrx-warn" aria-label="Removed by code">
              {result.dropped.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
          {ex.answer && (
            <div className="ex-answer">
              <p className="vx-tiny" style={{ margin: 0 }}>You asked: “{ex.answer.question}”</p>
              {ex.answer.found ? (
                <p className="xr-note" style={{ margin: "4px 0 0" }}>
                  <TrustLabel kind={ex.answer.label} /> {ex.answer.text}
                  {result.mode === "ai" && ex.answer.quote && <span className="ex-quote">From the abstract: “{ex.answer.quote}”</span>}
                </p>
              ) : (
                <p className="xr-note" style={{ margin: "4px 0 0" }}><TrustLabel kind="notfound" /> Not found in the abstract. Read the full paper to answer this.</p>
              )}
            </div>
          )}
        </>
      )}

      {source.abstract && <form
        className="lib-filters"
        style={{ marginTop: 8, marginBottom: 0 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) void run(question.trim());
        }}
      >
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about this paper, e.g. What did they find?" aria-label="Ask a question about this paper" maxLength={300} />
        <button className="btn small" type="submit" disabled={busy || !question.trim()}><Send size={13} /> Ask</button>
      </form>}
      <p className="vx-tiny">Only the abstract is read, never the full text. {autonomy === "off" ? "AI autonomy is Off, so no AI is used." : "Recorded in your AI-use statement."}</p>
    </div>
  );
}
