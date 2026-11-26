/**
 * Export gate rules (task Z15, guardrails G4 + G13, deck slides 4 and 6).
 *
 * Before a reference list is downloaded the student sees, in one place:
 *  - read-before-you-cite: sources they never opened;
 *  - explain-it-back: sources without their own one-line explanation (the AI never fills this);
 *  - sources whose check was not a clean "verified" (partial / mismatch);
 *  - the AI-use statement that goes with the list.
 *
 * The student stays in charge: nothing here forbids an export. Every open item is a warning the
 * student must acknowledge ("I take responsibility"), and that acknowledgement is logged.
 * Pure and deterministic.
 */
import type { RefStatus, SourceRecord } from "../types";

export interface GateSource {
  id: string;
  title: string;
  opened: boolean;
  explainBack?: string;
  status: RefStatus;
}

export interface GateReport {
  total: number;
  unread: GateSource[];
  unexplained: GateSource[];
  /** Checked, but not a clean "verified" (partial or mismatch): the student should check these by hand. */
  flagged: GateSource[];
  /** Anything that should never be exported (chimera, retracted, notfound). Normally empty: the list refuses them. */
  blocked: GateSource[];
  /** True when there is nothing to warn about. */
  clean: boolean;
  /** False only when there is nothing to export or a blocked source slipped in. */
  canExport: boolean;
  /** Plain-English lines for the checklist, in order of importance. */
  lines: { level: "block" | "warn" | "ok"; text: string }[];
}

const MIN_EXPLAIN = 12; // characters: "it shows" or "good paper" is not an explanation

export const toGateSource = (s: SourceRecord): GateSource => ({
  id: s.id,
  title: s.title,
  opened: s.opened,
  explainBack: s.explainBack,
  status: s.verification.status,
});

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function exportGate(sources: (SourceRecord | GateSource)[]): GateReport {
  const list = sources.map((s) => ("verification" in s ? toGateSource(s) : s));
  const unread = list.filter((s) => !s.opened);
  const unexplained = list.filter((s) => (s.explainBack?.trim().length ?? 0) < MIN_EXPLAIN);
  const flagged = list.filter((s) => s.status === "partial" || s.status === "mismatch");
  const blocked = list.filter((s) => s.status === "chimera" || s.status === "retracted" || s.status === "notfound");
  const lines: GateReport["lines"] = [];

  if (list.length === 0) lines.push({ level: "block", text: "There is nothing to export yet." });
  if (blocked.length) lines.push({ level: "warn", text: `${plural(blocked.length, "source")} ${blocked.length === 1 ? "is" : "are"} marked Mismatch, Retracted or Not found. ${blocked.length === 1 ? "It stays" : "They stay"} marked in every export; remove ${blocked.length === 1 ? "it" : "them"} unless you mean to discuss ${blocked.length === 1 ? "it" : "them"}.` });
  if (unread.length) lines.push({ level: "warn", text: `You have not opened ${plural(unread.length, "source")}. Read before you cite.` });
  else if (list.length) lines.push({ level: "ok", text: `You opened all ${plural(list.length, "source")}.` });
  if (unexplained.length) lines.push({ level: "warn", text: `${plural(unexplained.length, "source")} ${unexplained.length === 1 ? "has" : "have"} no explanation in your own words yet.` });
  else if (list.length) lines.push({ level: "ok", text: "Every source has your own one-line explanation." });
  if (flagged.length) lines.push({ level: "warn", text: `${plural(flagged.length, "source")} ${flagged.length === 1 ? "was" : "were"} only partly confirmed or had a mismatched detail. Check ${flagged.length === 1 ? "it" : "them"} by hand.` });

  return {
    total: list.length,
    unread,
    unexplained,
    flagged,
    blocked,
    clean: list.length > 0 && !unread.length && !unexplained.length && !flagged.length && !blocked.length,
    canExport: list.length > 0, // Phase 2: the student decides; warnings travel with the reference
    lines,
  };
}

/** Text to append to a downloaded reference list (APA 7 .txt). */
export function appendStatement(referenceList: string, statement: string, toolReference: string): string {
  return `${referenceList.trimEnd()}\n\n${toolReference}\n\n---\nAI use statement\n\n${statement.trim()}\n`;
}
