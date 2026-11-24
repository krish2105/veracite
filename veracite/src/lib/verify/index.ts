/**
 * The Verifier (K04): deterministic code that decides whether a reference is real. No AI, no prompt.
 *   verifyReference(textOrInput)  → Verification (status, field checks, chimera parts, reasons, receipts)
 *   parseReference(text)          → ReferenceInput (best-effort APA / Harvard / MLA / IEEE parser)
 *   decide(evidence)              → the pure rules, for tests and replays
 */
export { verifyReference, toInput, type RegistryDeps } from "./verify";
export { parseReference, parseAuthors } from "./parse";
export { decide, rankCandidates, titleScoreFor, type Evidence } from "./rules";
export { T as THRESHOLDS, titleSimilarity, checkAuthors, checkYear, venueSimilarity } from "./text";
