/**
 * What each model is allowed to answer (K08). The AI SDK validates every answer against these.
 * No schema has a field for a reference: models can only point at source IDs we gave them.
 */
import { z } from "zod";

const id = z.string().min(1).max(200); // "doi:…" ids; old SICI DOIs are long

export const PlanOut = z.object({
  subQuestions: z.array(z.string().min(3).max(200)).min(1).max(5),
  queries: z.array(z.string().min(3).max(120)).min(1).max(6),
  yearFrom: z.number().int().min(1900).max(2100).nullable(),
  rationale: z.string().max(400),
});

export const ReaderOut = z.object({
  cards: z
    .array(
      z.object({
        sourceId: id,
        finding: z.string().min(5).max(300),
        quote: z.string().min(10).max(400),
      }),
    )
    .max(16),
});

export const ScribeOut = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().min(10).max(400),
        kind: z.enum(["finding", "reasoning"]),
        sourceIds: z.array(id).max(4),
        quote: z.string().max(400).nullable(),
      }),
    )
    .min(1)
    .max(8),
});

/** "Explain this paper" (K30): plain-English sentences, each with the abstract words it rests on, or null. */
export const ExplainOut = z.object({
  sentences: z
    .array(z.object({ text: z.string().min(5).max(300), quote: z.string().max(400).nullable() }))
    .min(1)
    .max(6),
  answer: z.object({ found: z.boolean(), text: z.string().max(400), quote: z.string().max(400).nullable() }).nullable(),
});

/** Debate mode (K14): one turn, by the Advocate or the Skeptic. */
export const DebateTurnOut = z.object({
  argument: z.string().min(10).max(500),
  sourceId: id.nullable(),
  quote: z.string().max(400).nullable(),
});

export const SKEPTIC_RULES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] as const;

export const SkepticOut = z.object({
  challenges: z
    .array(
      z.object({
        claimId: id,
        verdict: z.enum(["supported", "partial", "unsupported"]),
        rules: z.array(z.enum(SKEPTIC_RULES)).max(8),
        // A generous bound: the readable length is clamped in code at a word boundary (reasons.ts), because a schema
        // cap made Groq stop the model mid-word (K02).
        reasons: z.array(z.string().max(1000)).max(4),
        counterSourceIds: z.array(id).max(4),
      }),
    )
    .max(8),
});

export type PlanOutput = z.infer<typeof PlanOut>;
export type ReaderOutput = z.infer<typeof ReaderOut>;
export type ScribeOutput = z.infer<typeof ScribeOut>;
export type SkepticOutput = z.infer<typeof SkepticOut>;
