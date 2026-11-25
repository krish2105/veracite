/**
 * Research session rules (K09). Pure and unit-tested; the hook in useResearch.ts drives them.
 *   ask → planning → ✋cp1_plan → searching/verifying → ✋cp2_sources → reading → drafting → challenging → ✋cp3_claims → export
 * Nothing is searched before the plan is approved; nothing is exported before every claim is kept, edited or dropped.
 */
import { assignLabel } from "../agents/checks";
import type { Autonomy, Claim, EvidenceCard, Phase, SourceRecord } from "../types";

export const STEPS: { phase: Phase; label: string; gate?: boolean }[] = [
  { phase: "ask", label: "You ask" },
  { phase: "planning", label: "Planner" },
  { phase: "cp1_plan", label: "✋ Approve plan", gate: true },
  { phase: "searching", label: "Scout + Verifier" },
  { phase: "cp2_sources", label: "✋ Approve sources", gate: true },
  { phase: "reading", label: "Reader" },
  { phase: "drafting", label: "Scribe" },
  { phase: "challenging", label: "Skeptic" },
  { phase: "cp3_claims", label: "✋ Approve claims", gate: true },
  { phase: "export", label: "Export" },
];

const ORDER: Phase[] = STEPS.map((s) => s.phase);

/** "done" | "active" | "todo" for the stepper. Steps an autonomy level skips show as "skip". */
export function stepState(step: Phase, current: Phase, autonomy: Autonomy): "done" | "active" | "todo" | "skip" {
  if (skipped(step, autonomy)) return "skip";
  const a = ORDER.indexOf(step === "verifying" ? "searching" : step);
  const b = ORDER.indexOf(current === "verifying" ? "searching" : current === "done" ? "export" : current);
  return a < b ? "done" : a === b ? "active" : "todo";
}

/** Off: no AI at all. Assist: the AI reads and challenges, the student writes (no Scribe). Co-pilot: everything. */
export function skipped(step: Phase, autonomy: Autonomy): boolean {
  if (autonomy === "off") return ["planning", "reading", "drafting", "challenging", "cp3_claims"].includes(step);
  if (autonomy === "assist") return step === "drafting";
  return false;
}

/** Assist mode: each evidence card becomes a "finding" claim, labelled by code. */
export function claimsFromEvidence(cards: EvidenceCard[], sources: SourceRecord[]): Claim[] {
  const byId = new Map(sources.map((s) => [s.id, s]));
  return cards.map((e, i) => {
    const c: Claim = { id: `C${i + 1}`, text: e.finding, kind: "finding", sourceIds: [e.sourceId], quote: e.quote, quoteFound: e.quoteFound, label: "notfound", decision: "pending" };
    return { ...c, label: assignLabel(c, byId) };
  });
}

/** Export is allowed only when no claim is still pending (checkpoint 3). */
export const canExport = (claims: Claim[]) => claims.every((c) => c.decision !== "pending");

/** One-line-per-item editing for the plan. */
export const linesToList = (text: string) => text.split("\n").map((l) => l.trim()).filter((l) => l.length >= 3);
