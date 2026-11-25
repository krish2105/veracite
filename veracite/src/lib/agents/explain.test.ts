/**
 * K30 "Explain this paper" tests. No key, no network: a mock model answers, the source is a real Crossref
 * record (Bastani et al. 2025). Code decides every label; the model only proposes sentences and quotes.
 */
import { readFileSync } from "node:fs";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { createBudget, createGateway } from "../llm";
import { parseCrossrefWork, type CrossrefWork } from "../registries/crossref";
import type { RegistryRecord, SourceRecord, Verification } from "../types";
import { runExplainer, splitSentences } from "./explain";

const fx = (n: string) => readFileSync(new URL(`../registries/__fixtures__/${n}`, import.meta.url), "utf8");
const toSource = (r: RegistryRecord, status: Verification["status"] = "verified"): SourceRecord => ({
  id: `doi:${r.doi}`, doi: r.doi, title: r.title, authors: r.authors, year: r.year, venue: r.venue, type: r.type, abstract: r.abstract,
  textAvailable: r.abstract ? "abstract" : "none",
  verification: { status, checks: [], registries: ["crossref", "openalex"], updates: [], reasons: [], searched: [], checkedAt: "2026-11-25T00:00:00Z", ms: 0 },
  quality: {}, tags: [], collections: [], notes: "", opened: false, addedAt: "2026-11-25T00:00:00Z", addedVia: "xray",
});
const bastani = toSource(parseCrossrefWork((JSON.parse(fx("crossref-bastani-correction.json")) as { message: CrossrefWork }).message));
const [first, second] = splitSentences(bastani.abstract!);

function gw(answer: unknown, seen: string[] = []) {
  const usage = { inputTokens: { total: 50, noCache: 50, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 20, text: 20, reasoning: undefined } };
  return createGateway({
    aiMode: () => ({ mode: "ai" }),
    budget: createBudget(),
    model: (id) =>
      new MockLanguageModelV4({
        modelId: id,
        doGenerate: async (o) => {
          seen.push(JSON.stringify(o.prompt));
          return { content: [{ type: "text", text: JSON.stringify(answer) }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] };
        },
      }),
  });
}
const ctx = (g: ReturnType<typeof gw>, aiOff = false) => ({ sessionId: "t", gateway: g, aiOff });

describe("splitSentences", () => {
  it("splits an abstract into sentences without breaking on e.g., decimals or initials", () => {
    expect(splitSentences("We studied 1,000 students (e.g. in Turkey). Scores rose 4.5 points in the U.S. sample. It mattered!")).toEqual([
      "We studied 1,000 students (e.g. in Turkey).",
      "Scores rose 4.5 points in the U.S. sample.",
      "It mattered!",
    ]);
  });
  it("the fixture abstract has several sentences", () => {
    expect(splitSentences(bastani.abstract!).length).toBeGreaterThan(3);
  });
});

describe("runExplainer: without AI (Rules mode)", () => {
  it("says so when there is no abstract, and calls no model", async () => {
    const seen: string[] = [];
    const r = await runExplainer({ ...bastani, abstract: undefined }, undefined, ctx(gw({}, seen)));
    expect(r.mode).toBe("rules");
    expect(r.reason).toMatch(/no abstract/i);
    expect(r.data.sentences).toEqual([]);
    expect(seen).toHaveLength(0);
  });

  it("with AI off, shows the abstract's own sentences, labelled by code", async () => {
    const r = await runExplainer(bastani, undefined, ctx(gw({}), true));
    expect(r.mode).toBe("rules");
    expect(r.reason).toBeTruthy();
    expect(r.data.sentences.length).toBe(splitSentences(bastani.abstract!).length);
    expect(r.data.sentences.every((s) => s.kind === "abstract" && s.label === "verified" && s.quote === s.text)).toBe(true);
  });

  it("with AI off, answers a question with the abstract sentences that contain its words", async () => {
    const r = await runExplainer(bastani, "What happened to students when the AI was taken away?", ctx(gw({}), true));
    expect(r.data.answer?.found).toBe(true);
    expect(r.data.answer?.label).toBe("verified");
    expect(bastani.abstract).toContain(r.data.answer!.quote!);
  });

  it("with AI off, says Not found when no abstract sentence matches", async () => {
    const r = await runExplainer(bastani, "What is the capital of France?", ctx(gw({}), true));
    expect(r.data.answer).toMatchObject({ found: false, label: "notfound" });
  });
});

describe("runExplainer: with AI, code sets every label", () => {
  const answer = {
    sentences: [
      { text: "The study asks whether AI tutors help students learn maths.", quote: first },
      { text: "Students who used AI scored 300% higher on every exam.", quote: "students who used AI scored three hundred percent higher on every exam they took" },
      { text: "This matters because schools are adopting AI quickly.", quote: null },
    ],
    answer: null,
  };

  it("Verified only for a sentence whose quote is in the abstract; a made-up quote is removed", async () => {
    const r = await runExplainer(bastani, undefined, ctx(gw(answer)));
    expect(r.mode).toBe("ai");
    const [a, b, c] = r.data.sentences;
    expect(a).toMatchObject({ kind: "explanation", label: "verified", quote: first });
    expect(b.label).toBe("ai");
    expect(b.quote).toBeUndefined();
    expect(c).toMatchObject({ label: "ai" });
    expect(r.dropped).toHaveLength(1);
  });

  it("a real quote from a source that is not registry-verified is Reported, not Verified", async () => {
    const r = await runExplainer({ ...bastani, verification: { ...bastani.verification, status: "partial" } }, undefined, ctx(gw(answer)));
    expect(r.data.sentences[0].label).toBe("reported");
  });

  it("an answer needs a real quote from the abstract, or it is Not found", async () => {
    const q = "What did they find?";
    const ok = await runExplainer(bastani, q, ctx(gw({ ...answer, answer: { found: true, text: "Access to GPT-4 helped practice but hurt later tests.", quote: second } })));
    expect(ok.data.answer).toMatchObject({ found: true, label: "verified", quote: second, question: q });
    const fake = await runExplainer(bastani, q, ctx(gw({ ...answer, answer: { found: true, text: "It doubled grades.", quote: "the intervention doubled the grades of every single student" } })));
    expect(fake.data.answer).toMatchObject({ found: false, label: "notfound" });
    expect(fake.dropped.some((d) => /answer/i.test(d))).toBe(true);
    const none = await runExplainer(bastani, q, ctx(gw({ ...answer, answer: { found: false, text: "Not found in the abstract", quote: null } })));
    expect(none.data.answer).toMatchObject({ found: false, label: "notfound" });
  });

  it("sends the abstract as data and the question to the model", async () => {
    const seen: string[] = [];
    await runExplainer(bastani, "What did they find?", ctx(gw(answer, seen)));
    expect(seen[0]).toContain("What did they find?");
    expect(seen[0]).toContain(first.slice(0, 40));
  });
});
