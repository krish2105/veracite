"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, PenLine, Swords } from "lucide-react";
import AppShell, { autonomyStore } from "@/components/app/AppShell";
import { Card, Sample, TrustLabel } from "@/components/app/ui";
import { useRefList, refList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import { useStore } from "@/components/lab/store";
import type { AgentRun } from "@/lib/agents/agents";
import { ACTIONS } from "@/lib/integrity/receipts";
import type { Challenge, Label, SourceRecord } from "@/lib/types";
import { checkDraft, claimsForSkeptic, lower, type DraftResult } from "./check";
import "./draft.css";

const cite = (s: SourceRecord) => {
  const [a, b] = s.authors;
  const who = !a ? s.title : s.authors.length === 1 ? a.family : s.authors.length === 2 ? `${a.family} & ${b.family}` : `${a.family} et al.`;
  return `(${who}, ${s.year ?? "n.d."})`;
};

/** A test paragraph built from the student's own list, with one deliberate fake citation and one uncited figure. */
function exampleFor(sources: SourceRecord[]): string {
  const s = sources.find((x) => x.abstract) ?? sources[0];
  const quote = s.abstract?.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, "");
  return [
    quote ? `The authors note that “${quote}” ${cite(s)}.` : `This question has been studied ${cite(s)}.`,
    `AI tools always improve every student's grades ${cite(s)}.`,
    "A study found a 40% rise in exam scores (Fakerson, 2031).",
    "About 90% of students now rely on these tools.",
  ].join(" ");
}

const MEANING: [Label, string][] = [
  ["verified", "The sentence quotes a verified source, and the quote is in its abstract word for word."],
  ["reported", "Not yet checked: the source is real, but whether it says this has not been confirmed."],
  ["notfound", "Not found: the citation is not in your reference list, or the Skeptic says the source does not support it."],
];

export function DraftTab() {
  const autonomy = useStore(autonomyStore);
  const { sources } = useRefList();
  const [text, setText] = useState("");
  const [result, setResult] = useState<DraftResult>();
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [isExample, setIsExample] = useState(false);

  const stale = useMemo(() => !!result && JSON.stringify(checkDraft(text, sources)) !== JSON.stringify(result), [result, text, sources]);

  const run = () => {
    const r = checkDraft(text, sources);
    setResult(r);
    setChallenges({});
    setAiNote("");
    refList.log({ sessionId: "draft", actor: "verifier", action: "checked_draft", aiUsed: false, ms: 0, ok: true, detail: `${r.sentences.length} sentences against ${sources.length} sources` });
  };

  const askSkeptic = async () => {
    if (!result) return;
    const claims = claimsForSkeptic(result);
    setBusy(true);
    setAiNote("");
    try {
      const res = await fetch("/api/agents/skeptic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "draft", sources, claims, round: 1 }) });
      const json = (await res.json()) as AgentRun<Challenge[]> & { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "The Skeptic could not run.");
      if (json.mode === "ai") {
        refList.log({ sessionId: "draft", actor: "skeptic", action: "challenged_claims", aiUsed: true, model: json.model, prompt: json.prompt, tokens: json.tokens, ms: json.ms, ok: true });
        setChallenges(Object.fromEntries(json.data.map((c) => [c.claimId, c])));
        setAiNote("The Skeptic finished. It can only lower a label, never raise one.");
      } else {
        refList.log({ sessionId: "draft", actor: "system", action: ACTIONS.fallbackRules, aiUsed: false, ms: json.ms, ok: true, detail: `skeptic: ${json.reason}` });
        setAiNote(json.reason ?? "The AI is unavailable. The code checks above still apply.");
      }
    } catch (e) {
      setAiNote(e instanceof Error ? e.message : "The Skeptic could not run.");
    } finally {
      setBusy(false);
    }
  };

  const canAsk = !!result && !stale && claimsForSkeptic(result).length > 0 && autonomy !== "off";

  return (
    <AppShell
      title="Draft Checker"
      subtitle="Paste your paragraph. Each APA citation is matched to your own reference list; quotes and close copying are checked."
      actions={<button className="btn primary" onClick={run} disabled={!text.trim() || !sources.length}><PenLine size={15} /> Check paragraph</button>}
    >
      <div className="xrx dr">
        {sources.length === 0 && (
          <div className="banner" role="status">
            <AlertTriangle size={16} color="var(--alert)" />
            <span>Your reference list is empty. Add verified sources on the <Link href="/xray">X-ray</Link> or <Link href="/research">Research</Link> page first: citations are checked only against them.</span>
          </div>
        )}
        <Card
          title={<>Your paragraph {isExample && <Sample>TEST PARAGRAPH · includes a fake citation</Sample>}</>}
          aside={<button className="btn small" disabled={!sources.length} onClick={() => { setText(exampleFor(sources)); setIsExample(true); setResult(undefined); }}><FlaskConical size={14} /> Use a test paragraph</button>}
        >
          <textarea className="paste dr-input" value={text} onChange={(e) => { setText(e.target.value); setIsExample(false); }} aria-label="Your paragraph" placeholder="Paste a paragraph with APA citations, e.g. “…” (Bastani et al., 2025)." />
          <p className="vx-tiny">Your text is checked in your browser. It is sent to a server only if you press “Ask the Skeptic”, with personal details removed before any AI call.</p>
        </Card>

        {result && (
          <Card
            title={<>Result · {result.sentences.length} sentence{result.sentences.length === 1 ? "" : "s"}</>}
            aside={autonomy === "off" ? <span className="vx-tiny" style={{ margin: 0 }}>AI is off</span> : <button className="btn small" onClick={() => void askSkeptic()} disabled={!canAsk || busy}><Swords size={13} /> {busy ? "Asking…" : "Ask the Skeptic"}</button>}
          >
            {stale && <p className="vx-tiny" role="status">Your text or list changed. Press “Check paragraph” again.</p>}
            {aiNote && <p className="vx-tiny" role="status">{aiNote}</p>}
            <ol className="dr-list">
              {result.sentences.map((s) => {
                const challenge = challenges[s.id];
                const label = lower(s.label, challenge);
                return (
                  <li key={s.id} className={`claim ${label ?? "none"}`}>
                    <p>{s.sentence.text}</p>
                    <div className="meta">
                      {label ? <TrustLabel kind={label} /> : <span className="lbl dr-none">No citation · not checked</span>}
                      {s.matches.map((m) => m.source && <span key={m.citation.raw + m.source.id} className="srcchip">{cite(m.source)}</span>)}
                    </div>
                    {s.notes.length > 0 && (
                      <ul className="dr-notes">
                        {s.notes.map((n) => <li key={n}>{n}</li>)}
                      </ul>
                    )}
                    {challenge && (
                      <p className="sk"><Swords size={14} /> AI suggestion from the Skeptic ({challenge.verdict}{challenge.rules.length ? ` · ${challenge.rules.join(", ")}` : ""}): {challenge.reasons.join(" ") || "no reason given"}</p>
                    )}
                  </li>
                );
              })}
            </ol>
            {result.uncited.length > 0 && (
              <p className="vx-tiny">In your list but not cited here: {result.uncited.map(cite).join(" ")}. APA 7 lists only works you cite.</p>
            )}
          </Card>
        )}

        <details className="xrx-legend" open>
          <summary>What the labels mean here</summary>
          <dl>
            {MEANING.map(([k, t]) => (
              <div key={k}>
                <dt><TrustLabel kind={k} /></dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
          <p className="vx-tiny">Labels are set by code. Only abstracts can be read, so read the full source before you rely on it. Close-copying warnings are prompts to quote or rewrite, not accusations.</p>
        </details>
      </div>
    </AppShell>
  );
}
