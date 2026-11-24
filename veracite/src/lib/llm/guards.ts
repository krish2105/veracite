/**
 * Guards the gateway runs before ANY text reaches a model (K06). They come from Zedan's integrity library (Z05):
 * `scrubPII` removes personal data, `wrapUntrusted` strips hidden characters, scans for injection and wraps source
 * text as <untrusted_source> data, and `UNTRUSTED_SYSTEM_RULE` tells the model never to obey that text.
 * The interface exists so tests can inject their own guards.
 */
import { UNTRUSTED_SYSTEM_RULE, wrapUntrusted } from "../integrity/injection";
import { scrubPII } from "../integrity/scrub";

export interface Guards {
  /** Remove personal data. Returns the cleaned text and how many items were redacted. */
  scrub(text: string): { text: string; redactions: number };
  /** Wrap UNTRUSTED text (abstracts, web pages) as data, and report instruction-like content in it. */
  wrap(text: string, sourceId: string): { wrapped: string; flagged: boolean; findings: string[] };
  /** Added to the system prompt whenever sources are present. */
  systemRule: string;
}

export const integrityGuards: Guards = {
  scrub(text) {
    const r = scrubPII(text);
    return { text: r.text, redactions: r.total };
  },
  wrap(text, sourceId) {
    const w = wrapUntrusted(text, sourceId);
    return { wrapped: w.wrapped, flagged: w.scan.flagged, findings: w.scan.findings.map((f) => f.label) };
  },
  systemRule: UNTRUSTED_SYSTEM_RULE,
};

export const defaultGuards: Guards = integrityGuards;
