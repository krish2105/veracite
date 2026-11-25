import { describe, expect, it } from "vitest";
import type { WebCheck } from "../../app/api/sources/wayback/check";
import type { Verification } from "../types";
import { canAddWeb, toWebSource, webVerification } from "./websource";

const url = "https://www.who.int/publications/i/item/9789240029200";
const web = { url, pageTitle: "Ethics and governance of artificial intelligence for health", live: true, archiveUrl: `https://web.archive.org/web/2026/${url}`, accessedAt: "2026-11-25T20:00:00Z", retrieval: `Retrieved November 26, 2026, from ${url}` };
const partial = (over: Partial<Verification> = {}): Verification => ({ status: "partial", checks: [], registries: [], updates: [], reasons: ["The page at this link has a matching title."], searched: [], checkedAt: "2026-11-25T20:00:00Z", ms: 900, web, ...over });

describe("canAddWeb (K45): only a checked, existing web page", () => {
  it("a Partial verdict with web evidence can be added as a web page", () => expect(canAddWeb(partial())).toBe(true));
  it("anything else cannot", () => {
    expect(canAddWeb(partial({ web: undefined }))).toBe(false);
    expect(canAddWeb(partial({ status: "notfound" }))).toBe(false);
    expect(canAddWeb(partial({ status: "verified" }))).toBe(false);
    expect(canAddWeb(partial({ web: { ...web, live: false, archiveUrl: undefined } }))).toBe(false);
  });
});

describe("toWebSource: the saved record comes from the page check, plus what the student typed", () => {
  it("uses the student's author, year and title, the checked link, retrieval date and archive copy", () => {
    const s = toWebSource(partial(), "World Health Organization. (2021). Ethics and governance of artificial intelligence for health. https://www.who.int/publications/i/item/9789240029200");
    expect(s).toMatchObject({ id: `url:${url}`, type: "web", url, archivedUrl: web.archiveUrl, accessedAt: web.accessedAt, year: 2021, addedVia: "xray", textAvailable: "none" });
    expect(s.title).toBe("Ethics and governance of artificial intelligence for health");
    expect(s.authors[0].family).toMatch(/World Health Organization/);
    expect(s.doi).toBeUndefined();
    expect(s.verification.status).toBe("partial");
  });
  it("falls back to the page's own title when nothing was typed", () => {
    const s = toWebSource(partial(), undefined, "save");
    expect(s.title).toBe(web.pageTitle);
    expect(s.authors).toEqual([]);
    expect(s.addedVia).toBe("save");
  });
  it("refuses anything that is not a checked web page", () => {
    expect(() => toWebSource(partial({ status: "notfound" }))).toThrow();
  });
});

describe("webVerification: a bare link checked on the save page", () => {
  const check: WebCheck = { url, status: "partial", live: { status: 200, ok: true, title: "WHO guidance" }, archive: { available: true, url: web.archiveUrl }, accessedAt: web.accessedAt, retrieval: web.retrieval, saveUrl: "", reasons: ["The page is live (HTTP 200)."] };
  it("becomes a Partial verdict with web evidence, never Verified", () => {
    const v = webVerification(check);
    expect(v.status).toBe("partial");
    expect(v.web?.pageTitle).toBe("WHO guidance");
    expect(canAddWeb(v)).toBe(true);
  });
  it("a dead link with no archive copy is Not found and cannot be added", () => {
    const v = webVerification({ ...check, status: "notfound", live: { status: 404, ok: false }, archive: { available: false } });
    expect(v.status).toBe("notfound");
    expect(canAddWeb(v)).toBe(false);
  });
});
