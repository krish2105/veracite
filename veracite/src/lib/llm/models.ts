/**
 * Which model each agent uses (K06, docs/11 §6). Groq's free tier dropped Llama in Aug 2026; free chat models are
 * openai/gpt-oss-120b, openai/gpt-oss-20b and qwen/qwen3.8-27b (preview). Free limits are PER MODEL, so agents
 * are spread across models. Override per agent with env MODEL_<AGENT> ("primary" or "primary,fallback,…").
 */
import type { AgentName } from "../types";

/** The agents that call a language model. The Verifier, Scout and Integrity Clerk are code. */
export type LlmAgent = Extract<AgentName, "planner" | "reader" | "scribe" | "skeptic" | "coach">;

export const DEFAULT_CHAINS: Record<LlmAgent, string[]> = {
  planner: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  reader: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  scribe: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  // Different family from the Scribe on purpose: errors should not correlate.
  skeptic: ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
  coach: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
};

const ENV: Record<LlmAgent, string | undefined> = {
  planner: process.env.MODEL_PLANNER,
  reader: process.env.MODEL_READER,
  scribe: process.env.MODEL_SCRIBE,
  skeptic: process.env.MODEL_SKEPTIC,
  coach: process.env.MODEL_COACH,
};

/** The models to try for an agent, in order. An env override replaces the primary and keeps the defaults as fallbacks. */
export function chainFor(agent: LlmAgent): string[] {
  const fromEnv = (ENV[agent] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...new Set([...fromEnv, ...DEFAULT_CHAINS[agent]])];
}

export type ModelFamily = "gpt-oss" | "qwen" | "llama" | "other";

export function familyOf(model: string): ModelFamily {
  const m = model.toLowerCase();
  if (m.includes("gpt-oss")) return "gpt-oss";
  if (m.includes("qwen")) return "qwen";
  if (m.includes("llama")) return "llama";
  return "other";
}

/** Provider options per model. gpt-oss reasons: "low" effort keeps answers fast inside the 8K tokens/min free limit. */
export function groqOptions(model: string) {
  return {
    groq: {
      structuredOutputs: true,
      // Strict mode has per-model limits on Groq; the AI SDK still validates every answer against our zod schema.
      strictJsonSchema: false,
      ...(familyOf(model) === "gpt-oss" ? { reasoningEffort: "low" as const } : {}),
    },
  };
}
