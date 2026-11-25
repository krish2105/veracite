/**
 * Error banners that say what happened and what to do (K32). Pure, unit-tested in errors.test.ts.
 */
export type SessionStep = "plan" | "search" | "agents";

/** A failed request with its HTTP status, so the banner can tell "busy" from "did not answer". */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

const WHO: Record<SessionStep, string> = { plan: "The Planner", search: "The search", agents: "The AI agents" };

export function explainError(step: SessionStep, e: unknown): string {
  const who = WHO[step];
  if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) {
    return `${who} could not reach Veracite's server. Check the Wi-Fi, then press Try again.`;
  }
  if (e instanceof HttpError && (e.status === 429 || /rate|busy|budget/i.test(e.message))) {
    return `${who} could not run: the AI service is busy (free-tier limit). Press Try again in a minute, or set AI autonomy to Off: every reference check still runs without AI.`;
  }
  if (e instanceof HttpError && e.status >= 500) {
    return `${who} stopped: a registry or the AI service did not answer in time. Nothing you approved was lost. Press Try again.`;
  }
  const msg = e instanceof Error && e.message ? e.message : "something went wrong. Press Try again.";
  return `${who} stopped: ${msg}`;
}
