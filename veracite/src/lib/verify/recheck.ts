/**
 * Re-check my library (K35): has anything happened to a saved source since it was saved? Pure, no AI.
 * A fresh DOI check is compared with the saved verdict; only NEW notices count. A retraction turns the saved
 * verdict into Retracted; a correction or expression of concern is added as a notice. The original field
 * checks are kept, so the student can still see why the reference itself was real.
 */
import type { Update, Verification } from "../types";

export interface RecheckOutcome {
  kind: "retracted" | "correction" | "concern" | "unchanged";
  newUpdates: Update[];
  message: string;
}

/** The date as the student sees it in Dubai, e.g. 2026-11-26. */
const dubaiDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const same = (a: Update, b: Update) => a.kind === b.kind && (a.noticeDoi ?? "") === (b.noticeDoi ?? "");

export function recheckOutcome(saved: Verification, fresh: Verification): RecheckOutcome {
  const newUpdates = fresh.updates.filter((u) => !saved.updates.some((s) => same(s, u)));
  const retraction = newUpdates.find((u) => u.kind === "retraction" || u.kind === "withdrawal");
  if (saved.status !== "retracted" && (fresh.status === "retracted" || retraction)) {
    return { kind: "retracted", newUpdates, message: `This paper was ${retraction?.kind === "withdrawal" ? "withdrawn" : "retracted"}${retraction?.date ? ` on ${retraction.date}` : ""}${retraction?.noticeDoi ? ` (notice ${retraction.noticeDoi})` : ""}. Do not cite it as evidence.` };
  }
  const concern = newUpdates.find((u) => u.kind === "concern");
  if (concern) return { kind: "concern", newUpdates, message: `An expression of concern was published${concern.date ? ` on ${concern.date}` : ""}. Read it before you cite this paper.` };
  const correction = newUpdates.find((u) => u.kind === "correction");
  if (correction) return { kind: "correction", newUpdates, message: `A correction was published${correction.date ? ` on ${correction.date}` : ""}. Check whether it changes what you cite.` };
  return { kind: "unchanged", newUpdates: [], message: "No new retraction, correction or concern." };
}

export function applyRecheck(saved: Verification, o: RecheckOutcome, at: string): Verification {
  if (o.kind === "unchanged") return { ...saved, checkedAt: at };
  return {
    ...saved,
    status: o.kind === "retracted" ? "retracted" : saved.status,
    updates: [...saved.updates, ...o.newUpdates],
    reasons: [`Re-checked on ${dubaiDay(at)}: ${o.message}`, ...saved.reasons],
    checkedAt: at,
  };
}
