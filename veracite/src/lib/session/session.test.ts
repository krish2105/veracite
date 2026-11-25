import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scout } from "../agents/scout";
import { parseCrossrefWork, type CrossrefWork } from "../registries/crossref";
import type { DoiLookup } from "../registries";
import type { RegistryRecord, SourceRecord } from "../types";
import { canExport, claimsFromEvidence, linesToList, skipped, stepState } from "./machine";

const fx = (n: string) => readFileSync(new URL(`../registries/__fixtures__/${n}`, import.meta.url), "utf8");
const bastani = parseCrossrefWork((JSON.parse(fx("crossref-bastani-correction.json")) as { message: CrossrefWork }).message);
const wang = parseCrossrefWork((JSON.parse(fx("crossref-wang-fan-retracted.json")) as { message: CrossrefWork }).message);
const rcpt = (q: string, n: number) => ({ registry: "crossref" as const, query: q, hits: n, at: "2026-11-25T00:00:00Z" });

describe("session rules", () => {
  it("stepper follows the phase and the autonomy dial", () => {
    expect(stepState("planning", "cp2_sources", "assist")).toBe("done");
    expect(stepState("cp2_sources", "cp2_sources", "assist")).toBe("active");
    expect(stepState("cp3_claims", "cp2_sources", "assist")).toBe("todo");
    expect(skipped("drafting", "assist")).toBe(true);
    expect(skipped("drafting", "copilot")).toBe(false);
    expect(["planning", "reading", "challenging", "cp3_claims"].every((p) => skipped(p as never, "off"))).toBe(true);
  });

  it("export waits until every claim is kept, edited or dropped", () => {
    const c = { id: "C1", text: "t", kind: "finding" as const, sourceIds: [], label: "notfound" as const, decision: "pending" as const };
    expect(canExport([c])).toBe(false);
    expect(canExport([{ ...c, decision: "dropped" }])).toBe(true);
    expect(canExport([])).toBe(true);
  });

  it("Assist mode turns evidence into code-labelled claims", () => {
    const src = { id: "S1", abstract: bastani.abstract, verification: { status: "verified" } } as unknown as SourceRecord;
    const quote = bastani.abstract!.split(". ")[0];
    const [c] = claimsFromEvidence([{ id: "E1", sourceId: "S1", finding: "f", quote, quoteFound: true, location: "abstract" }], [src]);
    expect(c).toMatchObject({ kind: "finding", sourceIds: ["S1"], label: "verified", decision: "pending" });
  });

  it("edited search terms: one per line, blanks dropped", () => {
    expect(linesToList("ai tutors\n\n  x \nchatgpt learning ")).toEqual(["ai tutors", "chatgpt learning"]);
  });
});

describe("Scout", () => {
  it("merges duplicates, ranks by how many queries found them, and verifies each one (retraction caught)", async () => {
    const lookup = async (doi: string): Promise<DoiLookup> => {
      const rec = [bastani, wang].find((r) => r.doi === doi.toLowerCase()) ?? null;
      return { doi, records: { crossref: rec, openalex: rec && ({ ...rec, registry: "openalex" } as RegistryRecord) }, receipts: [], errors: [] };
    };
    const r = await scout(["ai harm learning", "chatgpt meta-analysis"], {
      deps: {
        crossrefSearch: async (q) => ({ data: q.startsWith("ai") ? [bastani] : [bastani, wang], receipt: rcpt(q, 2) }),
        openalexSearch: async (q) => ({ data: [], receipt: { ...rcpt(q, 0), registry: "openalex" } }),
        lookupDoi: lookup,
        crossrefMatchReference: async (t) => ({ data: [], receipt: rcpt(t, 0) }),
        arxivSearch: async (t) => ({ data: [], receipt: rcpt(t, 0) }),
        crossrefByAuthors: async () => ({ data: [], receipt: rcpt("a", 0) }),
      },
    });
    expect(r.candidates.map((c) => [c.record.doi, c.hits, c.verification.status])).toEqual([
      ["10.1073/pnas.2422633122", 2, "verified"],
      ["10.1057/s41599-025-04787-y", 1, "retracted"],
    ]);
    expect(r.searched).toHaveLength(4);
  });
});
