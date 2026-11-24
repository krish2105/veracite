/**
 * LLM gateway (K06). Server-side only: agents (K08) call `gateway.run({ agent, sessionId, system, task, sources, schema })`.
 * When AI is unavailable, the result is `{ ok: false, mode: "rules", reason }` and the caller falls back to code.
 */
export { gateway, createGateway, type AgentCall, type AgentResult, type Attempt, type AiMode, type Gateway, type GatewayDeps } from "./gateway";
export { chainFor, familyOf, DEFAULT_CHAINS, type LlmAgent, type ModelFamily } from "./models";
export { createBudget, DEFAULT_LIMITS, type Budget, type BudgetLimits, type BudgetSnapshot } from "./budget";
export { defaultGuards, integrityGuards, type Guards } from "./guards";
