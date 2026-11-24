/**
 * AI budget caps (K06). Stops runaway loops and keeps us inside Groq's free tier.
 * Honest limitation (say it on the Trust Center): counters live in server memory, so on serverless they are
 * per instance and reset on a cold start. Groq's own per-model limits are the hard backstop (429 → fallback model →
 * Rules mode). Research sessions also cap themselves on the client (K09).
 */

export interface BudgetLimits {
  callsPerDay: number;
  tokensPerDay: number;
  callsPerSession: number;
}

const num = (v: string | undefined, d: number) => (v && Number(v) > 0 ? Number(v) : d);

export const DEFAULT_LIMITS: BudgetLimits = {
  callsPerDay: num(process.env.BUDGET_CALLS_PER_DAY, 600),
  tokensPerDay: num(process.env.BUDGET_TOKENS_PER_DAY, 400_000),
  callsPerSession: num(process.env.BUDGET_CALLS_PER_SESSION, 12),
};

export interface BudgetSnapshot extends BudgetLimits {
  day: string;
  callsToday: number;
  tokensToday: number;
}

export interface Budget {
  check(sessionId: string): { ok: true } | { ok: false; reason: string };
  record(sessionId: string, tokens: number): void;
  snapshot(): BudgetSnapshot;
}

export function createBudget(limits: BudgetLimits = DEFAULT_LIMITS, today = () => new Date().toISOString().slice(0, 10)): Budget {
  let day = today();
  let calls = 0;
  let tokens = 0;
  const sessions = new Map<string, number>();
  const roll = () => {
    if (today() !== day) {
      day = today();
      calls = 0;
      tokens = 0;
      sessions.clear();
    }
  };
  return {
    check(sessionId) {
      roll();
      if (calls >= limits.callsPerDay) return { ok: false, reason: `Today's AI budget (${limits.callsPerDay} calls) is used up.` };
      if (tokens >= limits.tokensPerDay) return { ok: false, reason: `Today's AI budget (${limits.tokensPerDay.toLocaleString()} tokens) is used up.` };
      if ((sessions.get(sessionId) ?? 0) >= limits.callsPerSession) return { ok: false, reason: `This session reached its cap of ${limits.callsPerSession} AI calls.` };
      return { ok: true };
    },
    record(sessionId, used) {
      roll();
      calls++;
      tokens += used;
      sessions.set(sessionId, (sessions.get(sessionId) ?? 0) + 1);
    },
    snapshot() {
      roll();
      return { ...limits, day, callsToday: calls, tokensToday: tokens };
    },
  };
}
