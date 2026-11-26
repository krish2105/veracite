import { describe, expect, it } from "vitest";
import type { Verification } from "../types";
import { explainVerdict } from "./explain";

const rec = { registry: "crossref" as const, id: "x", doi: "10.1038/nature14539", title: "Deep learning", authors: [{ family: "LeCun", given: "Yann" }], year: 2015, type: "article" as const, updates: [], fetchedAt: "2026-11-26T00:00:00Z" };
const v = (p: Partial<Verification>): Verification => ({ status: "notfound", checks: [], registries: [], updates: [], reasons: [], checkedAt: "2026-11-26T00:00:00Z", ms: 400, searched: [], ...p });
const s = (registry: "crossref" | "openalex" | "arxiv", hits: number, query = "q") => ({ registry, query, hits, at: "2026-11-26T00:00:00Z" });

describe("explainVerdict (K34): the registry trace and the rule behind each label", () => {
  it("traces every registry: how often it was searched, what it returned, whether it matched", () => {
    const e = explainVerdict(v({ status: "verified", matched: rec, registries: ["crossref", "openalex"], searched: [s("crossref", 3, "Deep learning LeCun"), s("openalex", 1), s("crossref", 1)] }));
    expect(e.trace).toEqual([
      { registry: "crossref", label: "Crossref", searches: 2, hits: 4, matched: true },
      { registry: "openalex", label: "OpenAlex", searches: 1, hits: 1, matched: true },
      { registry: "arxiv", label: "arXiv", searches: 0, hits: 0, matched: false },
    ]);
  });

  it("Verified names the two registries and the fields that matched", () => {
    const e = explainVerdict(v({ status: "verified", matched: rec, registries: ["crossref", "openalex"], checks: [{ field: "title", match: "exact" }, { field: "authors", match: "exact" }, { field: "year", match: "exact" }] }));
    expect(e.rule).toBe("Verified because Crossref and OpenAlex both have this paper, and the title, first author and year match what you typed.");
    expect(e.fields).toEqual(["Title: exact", "Authors: exact", "Year: exact"]);
  });

  it("Partial explains which of its three causes applies", () => {
    expect(explainVerdict(v({ status: "partial", matched: rec, registries: ["crossref"], checks: [] })).rule).toMatch(/^Partial because only a DOI was given/);
    expect(explainVerdict(v({ status: "partial", matched: rec, registries: ["openalex"], checks: [{ field: "title", match: "exact" }] })).rule).toMatch(/only one registry \(OpenAlex\)/);
    expect(explainVerdict(v({ status: "partial", registries: [] })).rule).toMatch(/web page/);
  });

  it("Mismatch lists the fields that differ", () => {
    expect(explainVerdict(v({ status: "mismatch", matched: rec, checks: [{ field: "year", claimed: "2021", found: "2025", match: "different" }, { field: "title", match: "exact" }] })).rule).toBe("Needs fix because the paper exists, but the year you typed differs from the registry (2021 vs 2025).");
  });

  it("Chimera, Retracted and Not found each state their rule", () => {
    expect(explainVerdict(v({ status: "chimera", parts: [{ field: "title", claimed: "x", note: "n" }, { field: "authors", claimed: "y", note: "m" }] })).rule).toMatch(/^Mismatch because the title and the authors come from different places/);
    expect(explainVerdict(v({ status: "retracted", matched: rec, updates: [{ kind: "retraction", noticeDoi: "10.1/notice", source: "retraction-watch", date: "2020-06-04" }] })).rule).toBe("Retracted because a retraction notice (10.1/notice, 2020-06-04) is linked to this paper by Retraction Watch.");
    expect(explainVerdict(v({ status: "notfound", searched: [s("crossref", 0), s("openalex", 0)] })).rule).toBe("Not found because no record in Crossref, OpenAlex or arXiv matches it, after 2 searches.");
  });

  it("says no AI was used", () => {
    expect(explainVerdict(v({})).footer).toMatch(/No AI/);
  });
});
