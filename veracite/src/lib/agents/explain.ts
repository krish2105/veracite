/**
 * "Explain this paper" (K30): the Reader explains ONE saved source's abstract in plain English.
 * The model proposes sentences and the abstract words each rests on; CODE decides every label:
 *   Verified / Reported  the quoted words really are in the abstract (Reported if the source itself is not verified)
 *   AI reasoning         the sentence has no quote, or its quote was not in the abstract (that quote is removed)
 *   Not found            a question the abstract does not answer, or an answer without a real quote
 * Without AI (Rules mode) it shows the abstract's own sentences and matches a question to them, with no model.
 * The model never writes a reference, a label or a number the student acts on.
 */
import { gateway as defaultGateway } from "../llm";
import type { Label, SourceRecord } from "../types";
import { meta, type AgentRun, type Ctx } from "./agents";
import { quoteInText } from "./checks";
import { ExplainOut } from "./schemas";

export interface ExplainSentence {
  /** "explanation" = written by the AI; "abstract" = the abstract's own sentence (Rules mode). */
  kind: "explanation" | "abstract";
  text: string;
  /** Words from the abstract, present only when code found them there. */
  quote?: string;
  label: Label;
}

export interface ExplainAnswer {
  question: string;
  found: boolean;
  text?: string;
  quote?: string;
  label: Label;
}

export interface Explanation {
  sourceId: string;
  sentences: ExplainSentence[];
  answer?: ExplainAnswer;
}

const EXPLAIN_SYSTEM = `You are the Reader in Veracite. Explain ONE paper to a first-year university student, using ONLY its abstract.
Write 3-5 short plain-English sentences: what was studied, how, what was found, and why it matters.
For each sentence, give the exact words from the abstract it rests on (copied word for word, at least 6 words), or null if the sentence is your own explanation.
Do not add facts, numbers or claims that are not in the abstract. Never name other papers, authors, journals or DOIs. Never write a reference.
If a question is given, answer it only from the abstract with the exact supporting words. If the abstract does not answer it, set found to false and text to "Not found in the abstract".
If no question is given, set answer to null.`;

/** Splits an abstract into sentences; keeps "e.g.", "U.S." and decimals together. Pure. */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?][”"’')\]]?)\s+(?=[A-Z“"‘(\d])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

const STOP = new Set(
  "what which when where who whom why how does did do the and are was were for with this that these those its they them their paper study about from been has have had can could would should will there than then into after before over under between also more most such only very some any each other our your you not but yet".split(" "),
);
const stems = (s: string) => new Set((s.toLowerCase().normalize("NFKD").match(/\p{L}+/gu) ?? []).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)));

/** Rules mode: the abstract sentences that share the question's words (at most two, in abstract order). */
export function matchSentences(question: string, abstract: string): string[] {
  const want = [...stems(question)];
  if (!want.length) return [];
  const need = want.length <= 2 ? 1 : 2;
  const scored = splitSentences(abstract).map((s, i) => {
    const have = stems(s);
    return { s, i, n: want.filter((w) => have.has(w)).length };
  });
  return scored
    .filter((x) => x.n >= need)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, 2)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

export async function runExplainer(source: SourceRecord, question: string | undefined, ctx: Ctx): Promise<AgentRun<Explanation>> {
  const abstract = source.abstract?.trim();
  const q = question?.trim() || undefined;
  const sourceId = source.id;
  // A quote found in the abstract proves the words are there; "Verified" also needs a registry-verified source.
  const found: Label = source.verification.status === "verified" ? "verified" : "reported";
  if (!abstract) {
    return {
      data: { sourceId, sentences: [], answer: q ? { question: q, found: false, label: "notfound" } : undefined },
      mode: "rules",
      reason: "This record has no abstract in Crossref, OpenAlex or arXiv, so there is nothing to explain from. Open the paper and read it.",
      ms: 0,
      dropped: [],
    };
  }

  const rulesData = (): Explanation => {
    const matches = q ? matchSentences(q, abstract) : [];
    return {
      sourceId,
      sentences: splitSentences(abstract).map((t) => ({ kind: "abstract" as const, text: t, quote: t, label: found })),
      answer: q ? (matches.length ? { question: q, found: true, text: matches.join(" "), quote: matches.join(" "), label: found } : { question: q, found: false, label: "notfound" }) : undefined,
    };
  };

  const gw = ctx.gateway ?? defaultGateway;
  const task = q ? `Explain this paper. Then answer the student's question: ${q}` : "Explain this paper. No question was asked.";
  const r = await gw.run(
    { agent: "reader", sessionId: ctx.sessionId, system: EXPLAIN_SYSTEM, task, sources: [{ id: source.id, text: `${source.title}\n${abstract}` }], schema: ExplainOut, maxOutputTokens: 900 },
    { aiOff: ctx.aiOff },
  );
  if (!r.ok) return meta(r, rulesData(), []);

  const dropped: string[] = [];
  const sentences: ExplainSentence[] = r.data.sentences.map((s) => {
    if (s.quote && quoteInText(s.quote, abstract)) return { kind: "explanation", text: s.text, quote: s.quote, label: found };
    if (s.quote) dropped.push(`A quote the AI gave is not in the abstract, so it was removed and the sentence is labelled AI reasoning: "${s.text.slice(0, 80)}".`);
    return { kind: "explanation", text: s.text, label: "ai" };
  });

  let answer: ExplainAnswer | undefined;
  if (q) {
    const a = r.data.answer;
    if (a?.found && a.quote && quoteInText(a.quote, abstract)) answer = { question: q, found: true, text: a.text, quote: a.quote, label: found };
    else {
      if (a?.found) dropped.push("The AI's answer had no supporting words from the abstract, so Veracite shows Not found in the abstract.");
      answer = { question: q, found: false, label: "notfound" };
    }
  }
  return meta(r, { sourceId, sentences, answer }, dropped);
}
