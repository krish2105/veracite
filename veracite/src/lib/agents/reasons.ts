/**
 * Tidying the Skeptic's reasons and a claim's source list (K02). Pure; changes how text reads, never what a label is.
 *
 * Found in the first live AI session (26 Nov 2026):
 *  - the model repeated the rule code at the start of a reason ("S7: …") although the UI already shows the rules;
 *  - reasons were capped at 240 characters in the answer schema, and Groq's structured output stopped the model exactly
 *    at the cap, mid-word ("…implying caus."). The cap now lives in code (clampReason), at a word boundary.
 *  - the Scribe sometimes listed the same source twice for one claim.
 */

/** How long a reason may be on screen. Longer ones are clamped at a word boundary. */
export const REASON_MAX = 300;

const RULE_PREFIX = /^S[1-8]\s*[:\-–—]\s*/;

/** Cut at the last whole word that fits, and say so with an ellipsis. Text that already fits is returned unchanged. */
export function clampReason(text: string, max = REASON_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,;:.–—-]+$/, "");
  return `${cut}…`;
}

/** A reason as the student should read it: no repeated rule code, and never a word cut in half. */
export function tidyReason(text: string): string {
  return clampReason(text.trim().replace(RULE_PREFIX, ""));
}

/** The same ids, each once, first occurrence first. */
export function uniqueIds<T>(ids: readonly T[]): T[] {
  return [...new Set(ids)];
}
