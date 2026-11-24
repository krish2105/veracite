/**
 * Guards the gateway runs before ANY text reaches a model (K06).
 *
 * INTERIM: Zedan owns the real PII scrubber and injection detector (task Z05, src/lib/integrity/scrub*,
 * injection*). Until Z05 is merged, the gateway uses these small, conservative versions. When Z05 lands, swap the
 * implementation in `defaultGuards` below (one import); the `Guards` interface stays the same.
 */

export interface Guards {
  /** Remove personal data. Returns the cleaned text and how many items were redacted. */
  scrub(text: string): { text: string; redactions: number };
  /** Spot instruction-like text inside UNTRUSTED content (paper abstracts, web pages). */
  detectInjection(text: string): { flagged: boolean; matches: string[] };
}

const PII: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
  [/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, "[emirates-id]"],
  [/(?:\+|00)\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}\b/g, "[phone]"],
  [/\b0\d{1,2}[\s-]?\d{3}[\s-]?\d{4}\b/g, "[phone]"],
  [/\b(?:\d[ -]?){15,19}\b/g, "[number]"], // card-like numbers; 13-digit ISBNs are left alone
];

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all)\b[^.\n]{0,20}\b(instructions?|prompts?|rules?|messages?)/i,
  // Not "act as" or "system prompt" on their own: abstracts say "may act as a buffer", and AI papers discuss prompts.
  /\byou are now (a|an|the|in)\b/i,
  /\bnew instructions?\s*:/i,
  /\b(reveal|print|show) (your|the) (system )?(prompt|instructions)\b/i,
  /<\|?(im_start|im_end|system|endoftext)\|?>/i,
  /\bdo anything now\b|\bjailbreak\b/i,
  /\b(cite|include|add)\b[^.\n]{0,30}\b(this|the following) (reference|source|paper)\b[^.\n]{0,40}\b(instead|always|regardless)\b/i,
];

export const interimGuards: Guards = {
  scrub(text) {
    let redactions = 0;
    let out = text;
    for (const [re, label] of PII) {
      out = out.replace(re, () => {
        redactions++;
        return label;
      });
    }
    return { text: out, redactions };
  },
  detectInjection(text) {
    const matches = INJECTION.map((re) => text.match(re)?.[0]).filter((m): m is string => !!m);
    return { flagged: matches.length > 0, matches };
  },
};

/** Swap to Zedan's integrity library when Z05 is merged. */
export const defaultGuards: Guards = interimGuards;
