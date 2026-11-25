/**
 * K14 debate tests. No key, no network: per-model mock answers, a real Crossref source (Bastani et al. 2025).
 * Code decides what survives: unknown source ids are blocked, quotes must be in the abstract, labels are set by code.
 */
import { readFileSync } from "node:fs";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { createBudget, createGateway } from "../llm";
import { parseCrossrefWork, type CrossrefWork } from "../registries/crossref";
import type { Claim, RegistryRecord, SourceRecord } from "../types";
import { runDebateRound } from "./debate";
import { splitSentences } from "./explain";

const fx = (n: string) => readFileSync(new URL(`../registries/__fixtures__/${n}`, import.meta.url), "utf8");
const toSource = (r: RegistryRecord, id: string): SourceRecord => ({
  id, doi: r.doi, title: r.title, authors: r.authors, year: r.year, venue: r.venue, type: r.type, abstract: r.abstract, textAvailable: "abstract",
  verification: { status: "verified", checks: [], registries: ["crossref", "openalex"], updates: [], reasons: [], searched: [], checkedAt: "2026-11-25T00:00:00Z", ms: 0 },
  quality: {}, tags: [], collections: [], notes: "", opened: false, addedAt: "2026-11-25T00:00:00Z", addedVia: "research",
});
const S1 = toSource(parseCrossrefWork((JSON.parse(fx("crossref-bastani-correction.json")) as { message: CrossrefWork }).message), "S1");
const [q1, q2] = splitSentences(S1.abstract!).slice(5, 7);
const claim: Claim = { id: "C1", text: "Unguided AI tutors can harm later learning.", kind: "finding", sourceIds: ["S1"], quote: q1, quoteFound: true, label: "verified", decision: "pending" };

/** Answers by model family: the Advocate runs on the Scribe's model, the Skeptic on Qwen. Records prompts. */
function gw(byModel: (id: string) => unknown, seen: { model: string; prompt: string }[] = []) {
  const usage = { inputTokens: { total: 40, noCache: 40, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 20, text: 20, reasoning: undefined } };
  return createGateway({
    aiMode: () => ({ mode: "ai" }),
    budget: createBudget(),
    model: (id) =>
      new MockLanguageModelV4({
        modelId: id,
        doGenerate: async (o) => {
          seen.push({ model: id, prompt: JSON.stringify(o.prompt) });
          return { content: [{ type: "text", text: JSON.stringify(byModel(id)) }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
        },
      }),
  });
}
const advocateSays = { argument: "The study found students did worse once the AI was removed.", sourceId: "S1", quote: q1 };
const skepticSays = { argument: "This is one study of high-school maths in one country; it may not generalise.", sourceId: "S1", quote: q2 };
const answers = (id: string) => (/qwen/i.test(id) ? skepticSays : advocateSays);

describe("runDebateRound (K14): Advocate vs Skeptic, judged by the student", () => {
  it("round 1: the Advocate and then the Skeptic speak, on different model families", async () => {
    const seen: { model: string; prompt: string }[] = [];
    const r = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw(answers, seen) });
    expect(r.mode).toBe("ai");
    expect(r.data.turns.map((t) => `${t.side}:${t.round}`)).toEqual(["advocate:1", "skeptic:1"]);
    expect(seen).toHaveLength(2);
    expect(seen[0].model).not.toBe(seen[1].model);
    expect(seen[1].prompt).toContain("did worse once the AI was removed"); // the Skeptic answers the Advocate
  });

  it("labels by code: a quote in the abstract of a verified source is Verified", async () => {
    const r = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw(answers) });
    expect(r.data.turns.every((t) => t.label === "verified" && t.quote)).toBe(true);
  });

  it("a made-up quote is removed and the turn becomes AI reasoning", async () => {
    const r = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw((id) => (/qwen/i.test(id) ? { ...skepticSays, quote: "the authors admit the whole experiment was a failure from the start" } : advocateSays)) });
    const sk = r.data.turns[1];
    expect(sk.label).toBe("ai");
    expect(sk.quote).toBeUndefined();
    expect(r.dropped.length).toBeGreaterThan(0);
  });

  it("a source that was never approved is blocked and recorded as a blocked citation", async () => {
    const r = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw((id) => (/qwen/i.test(id) ? skepticSays : { ...advocateSays, sourceId: "doi:10.9999/invented" })) });
    expect(r.data.blocked).toHaveLength(1);
    expect(r.data.blocked[0].citedId).toBe("doi:10.9999/invented");
    expect(r.data.turns[0]).toMatchObject({ label: "ai" });
    expect(r.data.turns[0].sourceId).toBeUndefined();
  });

  it("round 2 sends the transcript so far", async () => {
    const seen: { model: string; prompt: string }[] = [];
    const first = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw(answers) });
    const second = await runDebateRound(claim, [S1], first.data.turns, 2, { sessionId: "t", gateway: gw(answers, seen) });
    expect(second.data.turns.map((t) => `${t.side}:${t.round}`)).toEqual(["advocate:2", "skeptic:2"]);
    expect(seen[0].prompt).toContain("may not generalise");
  });

  it("without AI it says so and adds no turns", async () => {
    const r = await runDebateRound(claim, [S1], [], 1, { sessionId: "t", gateway: gw(answers), aiOff: true });
    expect(r.mode).toBe("rules");
    expect(r.data.turns).toEqual([]);
    expect(r.reason).toBeTruthy();
  });
});
