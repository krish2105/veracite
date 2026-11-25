import { describe, expect, it } from "vitest";
import { closestSentence, supportNote } from "./support";

const ABSTRACT = "We study how generative AI affects learning. Access to GPT-4 improved practice performance by 48%. However, when access was taken away, students performed worse than those who never had access. Guardrails mitigated these harms.";

describe("closestSentence (K36): which abstract sentence is nearest to the claim, by key words", () => {
  it("finds the sentence that shares most of the claim's key words, ignoring the citation itself", () => {
    const r = closestSentence("Students performed worse once AI access was taken away (Bastani et al., 2025).", ABSTRACT)!;
    expect(r.sentence).toMatch(/^However, when access was taken away/);
    expect(r.share).toBeGreaterThanOrEqual(0.6);
    expect(r.words).toEqual(expect.arrayContaining(["students", "access", "taken", "away"]));
  });

  it("returns a low share when the abstract does not talk about the claim", () => {
    const r = closestSentence("Students who used AI earned higher salaries ten years later (Bastani et al., 2025).", ABSTRACT)!;
    expect(r.share).toBeLessThan(0.34);
  });

  it("returns nothing without an abstract or without key words", () => {
    expect(closestSentence("Anything (Doe, 2020).", undefined)).toBeUndefined();
    expect(closestSentence("It is (Doe, 2020).", ABSTRACT)).toBeUndefined();
  });
});

describe("supportNote: what the student is told (never 'true', never 'false')", () => {
  it("strong overlap: read it and decide", () => {
    expect(supportNote({ sentence: "x", share: 0.75, words: ["a"] })).toMatch(/^Most of your key words/);
  });
  it("weak overlap: the source may not say this", () => {
    expect(supportNote({ sentence: "x", share: 0.1, words: [] })).toMatch(/may not say this/);
  });
  it("never claims the source supports or contradicts the claim", () => {
    for (const share of [0, 0.3, 0.6, 1]) expect(supportNote({ sentence: "x", share, words: [] })).not.toMatch(/\b(proves|supports|confirms|false|true)\b/i);
  });
});
