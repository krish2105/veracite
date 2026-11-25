/**
 * Draft Checker logic (K10). Pure code: each sentence's citations are matched to the student's own reference list,
 * quotes are compared with the source abstract, close copying is flagged, and the trust label is set by code.
 * The AI Skeptic can only LOWER a label, never raise it.
 */
import { assignLabel, MIN_QUOTE_WORDS, quoteInText } from "@/lib/agents/checks";
import { checkAgainstSources } from "@/lib/integrity/paraphrase";
import type { Challenge, Claim, Label, SourceRecord } from "@/lib/types";
import { sameSurname } from "@/lib/verify/text";
import { splitSentences, type Citation, type Sentence } from "./citations";

export interface CitationMatch {
  citation: Citation;
  source?: SourceRecord;
  /** Why it did not match, or an APA 7 form problem on a match. */
  problem?: string;
}

export interface SentenceResult {
  id: string;
  sentence: Sentence;
  matches: CitationMatch[];
  /** undefined = the sentence has no citation. */
  label?: Label;
  quote?: string;
  quoteFound?: boolean;
  notes: string[];
}

export interface DraftResult {
  sentences: SentenceResult[];
  /** Sources in the list that the draft never cites. */
  uncited: SourceRecord[];
}

export function matchCitation(c: Citation, sources: SourceRecord[]): CitationMatch {
  const byName = sources.filter((s) => sameSurname(c.families[0], s.authors[0]?.family));
  if (!byName.length) return { citation: c, problem: `No source by ${c.families[0]} is in your reference list. Verify it on the X-ray page and add it first.` };
  const byYear = byName.filter((s) => s.year === c.year);
  if (!byYear.length) return { citation: c, problem: `Your list has ${c.families[0]} from ${byName.map((s) => s.year ?? "n.d.").join(", ")}, not ${c.year ?? "n.d."}.` };
  const second = (s: SourceRecord) => c.families.slice(1).every((f, i) => sameSurname(f, s.authors[i + 1]?.family));
  const source = byYear.find(second);
  if (!source) return { citation: c, problem: `The co-author in "${c.raw}" does not match the source in your list.` };
  const n = source.authors.length;
  let problem: string | undefined;
  if (n >= 3 && !c.etAl) problem = `APA 7: with ${n} authors, write "${source.authors[0].family} et al.".`;
  else if (n === 2 && (c.etAl || c.families.length < 2)) problem = `APA 7: name both authors, "${source.authors[0].family} & ${source.authors[1].family}".`;
  else if (n === 1 && c.etAl) problem = `APA 7: this source has one author, so no "et al.".`;
  if (byYear.filter(second).length > 1) problem = "Two sources in your list match this citation: add a, b after the year.";
  return { citation: c, source, problem };
}

/** Quoted passages long enough to check (a few words in quotation marks are usually terms, not quotations). */
export function quotesIn(text: string): string[] {
  return [...text.matchAll(/“([^”]+)”|"([^"]+)"/g)].map((m) => (m[1] ?? m[2]).trim()).filter((q) => q.split(/\s+/).length >= MIN_QUOTE_WORDS);
}

export function checkSentence(sentence: Sentence, id: string, sources: SourceRecord[]): SentenceResult {
  const matches = sentence.citations.map((c) => matchCitation(c, sources));
  const quote = quotesIn(sentence.text)[0];
  const notes: string[] = [];
  if (!matches.length) {
    if (quote) notes.push("A quotation needs a citation.");
    else if (/\d+(\.\d+)?\s?(%|percent\b)/i.test(sentence.text)) notes.push("A figure like this usually needs a citation.");
    return { id, sentence, matches, quote, notes };
  }
  for (const m of matches) if (m.problem) notes.push(m.problem);
  const cited = matches.map((m) => m.source).filter((s): s is SourceRecord => !!s);
  if (cited.length < matches.length) return { id, sentence, matches, quote, label: "notfound", notes };

  const quoteFound = quote ? cited.some((s) => quoteInText(quote, s.abstract)) : undefined;
  const map = new Map(cited.map((s) => [s.id, s]));
  // Only the abstract can be read, so a quote that is not in it is "not yet checked", never "false".
  const label = assignLabel({ kind: "finding", sourceIds: cited.map((s) => s.id), quote: quoteFound ? quote : undefined }, map);
  if (quote && !quoteFound) notes.push("This quote is not in the abstract. We cannot read the full text, so check it word for word yourself.");
  else if (quoteFound) notes.push("The quote is in the source's abstract, word for word.");
  else notes.push("The source is real. Whether it says this has not been checked.");
  if (cited.some((s) => s.type === "preprint")) notes.push("Cites a preprint: say it is not peer reviewed.");

  const withText = cited.filter((s) => s.abstract).map((s) => ({ id: s.id, text: s.abstract! }));
  if (withText.length) {
    const p = checkAgainstSources(sentence.text, withText);
    if (p.verdict !== "ok") notes.push(p.results[0].message);
  }
  return { id, sentence, matches, quote, quoteFound, label, notes };
}

export function checkDraft(text: string, sources: SourceRecord[]): DraftResult {
  const sentences = splitSentences(text).map((s, i) => checkSentence(s, `C${i + 1}`, sources));
  const used = new Set(sentences.flatMap((s) => s.matches.map((m) => m.source?.id)));
  return { sentences, uncited: sources.filter((s) => !used.has(s.id)) };
}

/** The sentences the Skeptic can look at: every citation matched, shaped as claims. At most 12 per request. */
export function claimsForSkeptic(result: DraftResult): Claim[] {
  return result.sentences
    .filter((s) => s.matches.length && s.matches.every((m) => m.source))
    .slice(0, 12)
    .map((s) => ({ id: s.id, text: s.sentence.text.slice(0, 400), kind: "finding", sourceIds: s.matches.map((m) => m.source!.id), quote: s.quoteFound ? s.quote : undefined, quoteFound: s.quoteFound, label: s.label ?? "notfound", decision: "pending" }));
}

/** Apply a Skeptic verdict to a label. It can only lower it. */
export function lower(label: Label | undefined, challenge: Challenge | undefined): Label | undefined {
  if (!label || !challenge) return label;
  if (challenge.verdict === "unsupported") return "notfound";
  if (challenge.verdict === "partial" && label === "verified") return "reported";
  return label;
}
