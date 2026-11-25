/**
 * Deterministic checks on agent output (K08). Pure code, unit-tested. Models propose; these decide.
 *   quoteInText   is the quote really in the source text? (check C)
 *   assignLabel   the trust label of a claim (docs/03 §3), never set by a model
 */
import type { Challenge, Claim, Label, SourceRecord } from "../types";
import { normalizeText } from "../verify/text";

/** Minimum share of a quote's words that must appear, in order, in one window of the source text. */
export const QUOTE_FUZZY = 0.92;

/**
 * True when the quote appears in the text: exactly after normalising (case, accents, punctuation, spacing),
 * or with at most ~8 % of its words different inside one window (OCR hyphens, a dropped "the").
 * Quotes under 5 words never count: a fragment that short proves nothing. Under 6 words they must match exactly.
 */
export const MIN_QUOTE_WORDS = 5;
export function quoteInText(quote: string | undefined, text: string | undefined): boolean {
  const q = normalizeText(quote);
  const t = normalizeText(text);
  if (!q || !t) return false;
  const qw = q.split(" ");
  if (qw.length < MIN_QUOTE_WORDS) return false;
  if (t.includes(q)) return true;
  if (qw.length < 6) return false;
  const tw = t.split(" ");
  const need = Math.ceil(qw.length * QUOTE_FUZZY);
  for (let start = 0; start + need <= tw.length; start++) {
    // Greedy in-order match of quote words inside a window slightly longer than the quote.
    const end = Math.min(tw.length, start + qw.length + 3);
    let qi = 0;
    let hits = 0;
    for (let ti = start; ti < end && qi < qw.length; ti++) {
      if (tw[ti] === qw[qi]) {
        hits++;
        qi++;
      } else if (qi + 1 < qw.length && tw[ti] === qw[qi + 1]) {
        qi += 2;
        hits++;
      }
    }
    if (hits >= need) return true;
  }
  return false;
}

/**
 * The trust label of a claim. Rules (docs/03 §3), in order:
 *   ai        kind is "reasoning" (the AI's own synthesis)
 *   notfound  no source, an unknown/unverified source, a quote not in the text, or the Skeptic says unsupported
 *   verified  every source registry-verified, quote found in its text, Skeptic did not reject
 *   reported  sources are real but the detail could not be checked (no text, no quote, or Skeptic "partial")
 */
export function assignLabel(claim: Pick<Claim, "kind" | "sourceIds" | "quote">, sources: Map<string, SourceRecord>, challenge?: Challenge): Label {
  if (claim.kind === "reasoning") return "ai";
  const cited = claim.sourceIds.map((id) => sources.get(id));
  if (!cited.length || cited.some((s) => !s)) return "notfound";
  if (challenge?.verdict === "unsupported") return "notfound";
  const allVerified = cited.every((s) => s!.verification.status === "verified");
  if (!allVerified) return "reported";
  if (!claim.quote) return "reported";
  const found = cited.some((s) => quoteInText(claim.quote, s!.abstract));
  if (!found) return cited.some((s) => s!.abstract) ? "notfound" : "reported";
  return challenge?.verdict === "partial" ? "reported" : "verified";
}
