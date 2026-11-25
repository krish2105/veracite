/**
 * "Does this source say this?" (K36): for a cited claim without a quote, the closest sentence in the
 * source's abstract by shared key words. Pure code, no AI. It is evidence to read, never a verdict:
 * the label is not raised by it, and the wording never says "true", "false" or "supports".
 */
import { splitSentences } from "@/lib/agents/explain";

export interface Support {
  sentence: string;
  /** Share of the claim's key words that appear in that sentence, 0–1. */
  share: number;
  words: string[];
}

const STOP = new Set(
  "the and are was were for with this that these those its they them their than then into from about after before over under between also more most such only very some any each other our your you not but yet has have had can could would should will been being which what when where who whom why how does did there here while because study studies paper research authors found shows show showed suggest suggests".split(" "),
);
const keyWords = (s: string) => [...new Set((s.toLowerCase().normalize("NFKD").match(/\p{L}+/gu) ?? []).filter((w) => w.length > 2 && !STOP.has(w)))];
const stem = (w: string) => w.slice(0, 5);

export function closestSentence(claim: string, abstract: string | undefined): Support | undefined {
  if (!abstract) return undefined;
  // Leave out the citation and any quotation marks: only the claim's own words count.
  const words = keyWords(claim.replace(/\([^)]*\d{4}[^)]*\)/g, " ").replace(/[“”"]/g, " "));
  if (words.length < 2) return undefined;
  let best: Support | undefined;
  for (const sentence of splitSentences(abstract)) {
    const have = new Set(keyWords(sentence).map(stem));
    const shared = words.filter((w) => have.has(stem(w)));
    const share = shared.length / words.length;
    if (!best || share > best.share) best = { sentence, share, words: shared };
  }
  return best;
}

export function supportNote(s: Support): string {
  const pct = `${Math.round(s.share * 100)} %`;
  if (s.share >= 0.5) return `Most of your key words (${pct}) appear in this sentence of the abstract. Read it and decide whether it says the same thing.`;
  if (s.share >= 0.25) return `Some of your key words (${pct}) appear in this sentence of the abstract. It may say something narrower or different: read it before you cite.`;
  return `Few of your key words (${pct}) appear anywhere in the abstract. The source may not say this; check the full text before you cite it.`;
}
