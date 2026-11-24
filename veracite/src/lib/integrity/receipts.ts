/**
 * Receipt conventions the Integrity Clerk reads (task Z04).
 *
 * The `Receipt` type itself is the shared contract in `src/lib/types.ts` (K18, owner Krishna); it is
 * re-exported here so integrity code has one import. The statement and the ledger are computed ONLY
 * from these records: if it isn't in the log, it isn't in the disclosure.
 *
 * `types.ts` leaves `action` as free text. The orchestrator (K09) should use the `ACTIONS` strings
 * below for the steps the AI-use statement counts; any other action is still listed in the ledger.
 */

import type { AgentName, Autonomy, Receipt } from "../types";

export type { Autonomy, Receipt };

export const ACTORS = {
  student: "student",
  system: "system",
  planner: "planner",
  scout: "scout",
  verifier: "verifier",
  reader: "reader",
  scribe: "scribe",
  skeptic: "skeptic",
  clerk: "clerk",
  coach: "coach",
} as const satisfies Record<string, AgentName | "student" | "system">;

/** Actions the Integrity Clerk counts. */
export const ACTIONS = {
  // student decisions (actor = "student")
  approvePlan: "approve_plan",
  approveSources: "approve_sources",
  approveClaims: "approve_claims",
  rejectSource: "reject_source",
  keepClaim: "keep_claim",
  editClaim: "edit_claim",
  dropClaim: "drop_claim",
  openSource: "open_source",
  // safety events (actor = "system", or the agent involved)
  blockedCitation: "blocked_citation",
  fallbackRules: "fallback_rules",
  injectionFlagged: "injection_flagged",
} as const;

/** The autonomy dial (feature F29). Written into the disclosure. */
export const AUTONOMY_LABEL: Record<Autonomy, string> = {
  off: "Off (reference manager and checker only, no AI)",
  assist: "Assist",
  copilot: "Co-pilot",
};

/** True if this receipt is a call to an AI model. */
export const isAiCall = (r: Receipt): boolean => r.aiUsed === true && typeof r.model === "string" && r.model.length > 0;
