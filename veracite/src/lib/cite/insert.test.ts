import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/lib/types";
import { citedSources, insertAtCursor, inText } from "./insert";

const rec = (over: Partial<SourceRecord>): SourceRecord =>
  ({
    id: "S1",
    title: "AI tutoring outperforms in-class active learning",
    authors: [{ family: "Kestin", given: "Greg" }],
    year: 2025,
    type: "article",
    verification: { status: "verified", checks: [], registries: ["crossref", "openalex"], updates: [], reasons: [] },
    quality: {},
    tags: [],
    collections: [],
    notes: "",
    opened: false,
    addedAt: "2026-11-25T00:00:00.000Z",
    addedVia: "xray",
    ...over,
  }) as SourceRecord;

const one = rec({ id: "S1", authors: [{ family: "Kestin" }], year: 2025 });
const two = rec({ id: "S2", authors: [{ family: "Wang" }, { family: "Fan" }], year: 2025 });
const many = rec({ id: "S3", authors: [{ family: "Bastani" }, { family: "Bastani" }, { family: "Sungu" }], year: 2025 });
const undated = rec({ id: "S4", authors: [{ family: "Al Suwaidi" }], year: undefined });
const org = rec({ id: "S5", authors: [], title: "SP Jain Academic Integrity Policy", year: 2026 });

describe("inText", () => {
  it("formats 1, 2, 3+ authors, n.d., and authorless titles in APA 7", () => {
    expect(inText(one)).toBe("(Kestin, 2025)");
    expect(inText(two)).toBe("(Wang & Fan, 2025)");
    expect(inText(many)).toBe("(Bastani et al., 2025)");
    expect(inText(undated)).toBe("(Al Suwaidi, n.d.)");
    expect(inText(org)).toBe("(SP Jain Academic Integrity Policy, 2026)");
  });
});

describe("insertAtCursor", () => {
  it("inserts at the end with a leading space and advances cursor", () => {
    const res = insertAtCursor("AI tutors improved scores", 25, 25, "(Kestin, 2025)");
    expect(res.text).toBe("AI tutors improved scores (Kestin, 2025)");
    expect(res.cursor).toBe(res.text.length);
  });

  it("inserts before a period without doubling spaces", () => {
    const text = "AI tutors improved scores.";
    const res = insertAtCursor(text, 25, 25, "(Kestin, 2025)");
    expect(res.text).toBe("AI tutors improved scores (Kestin, 2025).");
    expect(res.cursor).toBe("AI tutors improved scores (Kestin, 2025)".length);
  });

  it("does not double space when cursor already follows whitespace or start of box", () => {
    expect(insertAtCursor("", 0, 0, "(Kestin, 2025)")).toEqual({ text: "(Kestin, 2025)", cursor: 14 });
    expect(insertAtCursor("AI helps ", 9, 9, "(Kestin, 2025)")).toEqual({ text: "AI helps (Kestin, 2025)", cursor: 23 });
  });

  it("replaces a selected range and separates from following word characters", () => {
    const text = "Evidence [CITE]shows gains.";
    const res = insertAtCursor(text, 9, 15, "(Wang & Fan, 2025)");
    expect(res.text).toBe("Evidence (Wang & Fan, 2025) shows gains.");
    expect(res.cursor).toBe("Evidence (Wang & Fan, 2025)".length);
  });

  it("clamps reversed or undefined selections safely", () => {
    expect(insertAtCursor("Hello", undefined, undefined, "(Kestin, 2025)")).toEqual({
      text: "Hello (Kestin, 2025)",
      cursor: 20,
    });
    expect(insertAtCursor("Hello world", 11, 6, "(Kestin, 2025)")).toEqual({
      text: "Hello (Kestin, 2025)",
      cursor: 20,
    });
  });
});

describe("citedSources", () => {
  it("returns only sources currently cited in the draft and drops removed ones", () => {
    const all = [one, two, many, org];
    const draft = "Active learning lagged (Kestin, 2025), while guardrails mattered (Bastani et al., 2025). Policy applies (SP Jain Academic Integrity Policy, 2026).";
    expect(citedSources(draft, all).map((s) => s.id)).toEqual(["S1", "S3", "S5"]);

    const edited = "Active learning lagged (Kestin, 2025).";
    expect(citedSources(edited, all).map((s) => s.id)).toEqual(["S1"]);
  });

  it("ignores citations not present in the verified list", () => {
    expect(citedSources("Fake claim (Fakerson, 2031).", [one, two])).toEqual([]);
  });
});
