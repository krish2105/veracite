import { describe, expect, it } from "vitest";
import { statusFrom } from "@/components/app/tabs/certificate/reverify";
import type { SourceRecord, Verification } from "@/lib/types";
import { citeKeys, toBibTeX, toCslJson, toRIS } from "./exports";

const rec = (over: Partial<SourceRecord> = {}) =>
  ({ type: "article", title: "AI & learning: 100% {tested}", authors: [{ family: "Kabakcı", given: "Özge" }, { family: "OECD" }], year: 2025, venue: "Journal of Tests", volume: "12", issue: "3", pages: "10-19", doi: "10.1000/abc", tags: ["rct"], notes: "line one\nline two", ...over }) as unknown as SourceRecord;

describe("library exports", () => {
  it("BibTeX escapes special characters and gives unique keys", () => {
    expect(citeKeys([rec(), rec()])).toEqual(["kabakc2025", "kabakc2025a"]);
    const b = toBibTeX([rec()]);
    expect(b).toContain("@article{kabakc2025,");
    expect(b).toContain("title = {{AI \\& learning: 100\\% tested}}");
    expect(b).toContain("author = {Kabakcı, Özge and {OECD}}");
    expect(b).toContain("pages = {10--19}");
  });

  it("RIS has one tag per line and ends each record", () => {
    const r = toRIS([rec()]);
    expect(r.split("\r\n")).toEqual(expect.arrayContaining(["TY  - JOUR", "AU  - Kabakcı, Özge", "SP  - 10", "EP  - 19", "DO  - 10.1000/abc", "N1  - line one line two", "ER  - "]));
  });

  it("CSL-JSON is valid JSON with the DOI", () => {
    const [c] = JSON.parse(toCslJson([rec({ type: "preprint" })]));
    expect(c).toMatchObject({ type: "article", DOI: "10.1000/abc", issued: { "date-parts": [[2025]] } });
  });
});

describe("certificate re-check", () => {
  const v = { status: "partial", registries: ["crossref", "openalex"], matched: { authors: [{ family: "Wang" }], year: 2025 } } as unknown as Verification;
  const ref = { doi: "10.1000/abc", firstAuthor: "Wang", year: 2025, status: "verified" as const };
  it("a title-less certificate reference compares author and year with the DOI record", () => {
    expect(statusFrom(ref, v)).toBe("verified");
    expect(statusFrom({ ...ref, firstAuthor: "Smith" }, v)).toBe("mismatch");
    expect(statusFrom(ref, { ...v, status: "retracted" })).toBe("retracted");
    expect(statusFrom(ref, { ...v, registries: ["crossref"] })).toBe("partial");
  });
});
