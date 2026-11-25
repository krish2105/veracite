import { describe, expect, it } from "vitest";
import type { Verification } from "@/lib/types";
import { parseQuery, publicVerdict } from "./shape";

const base = (p: Partial<Verification>): Verification => ({ status: "notfound", checks: [], registries: [], updates: [], reasons: [], searched: [], checkedAt: "2026-11-26T08:00:00.000Z", ms: 120, ...p });
const record = { registry: "crossref" as const, id: "10.1038/nature14539", doi: "10.1038/nature14539", title: "Deep learning", authors: [{ family: "LeCun", given: "Yann" }, { family: "Bengio", given: "Yoshua" }], year: 2015, venue: "Nature", type: "article" as const, updates: [], url: "https://www.nature.com/articles/nature14539", fetchedAt: "2026-11-26T08:00:00.000Z" };

describe("parseQuery: GET /api/v1/verify?doi= or ?ref=", () => {
  it("reads a DOI (bare, doi: or doi.org link)", () => {
    expect(parseQuery(new URLSearchParams("doi=https://doi.org/10.1038/NATURE14539"))).toEqual({ ok: true, input: "https://doi.org/10.1038/nature14539", echo: { doi: "10.1038/nature14539" } });
  });
  it("reads a full reference", () => {
    const r = parseQuery(new URLSearchParams({ ref: "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521, 436–444." }));
    expect(r.ok && r.echo.ref).toMatch(/^LeCun/);
  });
  it("refuses empty, malformed and oversized input", () => {
    expect(parseQuery(new URLSearchParams("")).ok).toBe(false);
    expect(parseQuery(new URLSearchParams("doi=hello")).ok).toBe(false);
    expect(parseQuery(new URLSearchParams({ ref: "x".repeat(2001) })).ok).toBe(false);
  });
});

describe("publicVerdict: a small, stable answer for other tools and AI assistants", () => {
  it("a verified record can be cited, and the record comes from the registry", () => {
    const v = publicVerdict({ doi: "10.1038/nature14539" }, base({ status: "verified", matched: record, registries: ["crossref", "openalex"], reasons: ["Crossref and OpenAlex both have this paper."] }));
    expect(v).toMatchObject({ ok: true, api: "veracite/v1", status: "verified", label: "Verified", exists: true, verified: true, retracted: false, registries: ["crossref", "openalex"] });
    expect(v.record).toEqual({ title: "Deep learning", authors: ["LeCun, Yann", "Bengio, Yoshua"], year: 2015, venue: "Nature", doi: "10.1038/nature14539", url: "https://www.nature.com/articles/nature14539" });
    expect(v.note).toMatch(/No AI was used/);
  });

  it("a DOI-only check exists but is not verified", () => {
    const v = publicVerdict({ doi: "10.1038/nature14539" }, base({ status: "partial", matched: record }));
    expect(v).toMatchObject({ exists: true, verified: false, label: "Partial" });
  });

  it("a retraction says so, with the notice", () => {
    const v = publicVerdict({ doi: "10.1056/nejmoa2007621" }, base({ status: "retracted", matched: { ...record, doi: "10.1056/nejmoa2007621" }, updates: [{ kind: "retraction", noticeDoi: "10.1056/nejmc2021225", date: "2020-06-04", source: "retraction-watch" }] }));
    expect(v).toMatchObject({ exists: false, verified: false, retracted: true, retraction: { noticeDoi: "10.1056/nejmc2021225", date: "2020-06-04" } });
  });

  it("a chimera or a not-found reference does not exist as cited, and carries no record", () => {
    expect(publicVerdict({ ref: "x" }, base({ status: "chimera", matched: record }))).toMatchObject({ exists: false, verified: false, record: null });
    expect(publicVerdict({ ref: "x" }, base({ status: "notfound" }))).toMatchObject({ exists: false, verified: false, record: null });
  });
});
