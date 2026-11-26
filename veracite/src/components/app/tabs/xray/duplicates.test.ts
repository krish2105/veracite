import { describe, expect, it } from "vitest";
import type { Verification } from "@/lib/types";
import { dedupeKey, findDuplicates } from "./duplicates";

const v = (status: Verification["status"], doi?: string, title = "Sleep and memory", family = "Smith", year = 2019): Verification =>
  ({ status, checks: [], registries: [], updates: [], reasons: [], searched: [], checkedAt: "", ms: 0, matched: { registry: "crossref", id: "x", doi, title, authors: [{ family }], year, type: "article" } }) as unknown as Verification;

describe("duplicates in a pasted list (Phase 2, case 5)", () => {
  it("two lines that resolve to the same DOI are one paper, whatever the format typed", () => {
    const d = findDuplicates([{ n: 1, key: dedupeKey(v("mismatch", "10.1/A")) }, { n: 2, key: dedupeKey(v("verified", "10.1/b")) }, { n: 7, key: dedupeKey(v("verified", "10.1/a")) }]);
    expect(d).toEqual({ 7: 1 });
  });
  it("with no DOI, the same title, first author and year is the same paper", () => {
    expect(dedupeKey(v("verified", undefined, "Sleep & Memory", "SMITH"))).toBe(dedupeKey(v("partial", undefined, "sleep and memory".replace("and", "&"), "Smith")));
  });
  it("a line with no registry record behind it is never called a duplicate", () => {
    expect(dedupeKey(v("notfound", "10.1/a"))).toBeUndefined();
    expect(dedupeKey(v("chimera", "10.1/a"))).toBeUndefined();
    expect(findDuplicates([{ n: 1 }, { n: 2 }])).toEqual({});
  });
});
