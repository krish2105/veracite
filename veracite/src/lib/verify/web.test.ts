/** K21: web pages without a DOI. Offline: the web check (Z16) is faked; only the combining rules are tested. */
import { describe, expect, it } from "vitest";
import type { WebCheck } from "../../app/api/sources/wayback/check";
import type { Verification } from "../types";
import { verifyReference, type RegistryDeps } from "./verify";
import { applyWebCheck, pageSupportsTitle } from "./web";

const base = (status: Verification["status"], over: Partial<Verification> = {}): Verification => ({
  status, checks: [], registries: [], updates: [], reasons: ["registry reason"], searched: [], checkedAt: "2026-11-25T00:00:00Z", ms: 1, ...over,
});
const matched = { registry: "crossref" as const, id: "10.1/x", doi: "10.1/x", title: "Other", authors: [], type: "other" as const, updates: [], fetchedAt: "2026-11-25T00:00:00Z" };

function page(url: string, o: { live?: boolean; title?: string; archived?: boolean } = {}): WebCheck {
  const { live = true, title, archived = false } = o;
  return {
    url,
    status: live || archived ? "partial" : "notfound",
    live: { status: live ? 200 : 404, ok: live, title },
    archive: archived ? { available: true, url: `https://web.archive.org/web/2026/${url}`, capturedAt: "2026-05-13T00:00:00Z" } : { available: false },
    accessedAt: "2026-11-25T00:00:00Z",
    retrieval: `Retrieved November 25, 2026, from ${url}`,
    saveUrl: `https://web.archive.org/save/${url}`,
    reasons: [live ? "The page is live (HTTP 200)." : "The page did not load (HTTP 404)."],
  };
}

describe("pageSupportsTitle", () => {
  it("matches the page title, ignoring a site name after a separator", () => {
    expect(pageSupportsTitle("REST API", page("https://x.org/docs/a", { title: "REST API - Crossref" }))).toBe("title");
  });
  it("matches the words of the web address when the page has no title", () => {
    expect(pageSupportsTitle("How to cite ChatGPT", page("https://apastyle.apa.org/blog/how-to-cite-chatgpt"))).toBe("address");
  });
  it("does not match a home page or an unrelated page", () => {
    expect(pageSupportsTitle("Generative AI harms student learning in schools", page("https://www.google.com/", { title: "Google" }))).toBeUndefined();
  });
});

describe("applyWebCheck", () => {
  const url = "https://u.ae/en/uae-strategy-for-artificial-intelligence";
  const title = "UAE strategy for artificial intelligence";

  it("turns Not found into Partial when an archived copy matches the title, never Verified", () => {
    const v = applyWebCheck(base("notfound"), title, page(url, { live: false, archived: true }));
    expect(v.status).toBe("partial");
    expect(v.matched).toBeUndefined();
    expect(v.reasons.join(" ")).toContain("Retrieved November 25, 2026");
    expect(v.reasons.join(" ")).toContain("web.archive.org");
  });

  it("keeps the web evidence on a Partial verdict, so the page can be saved (K45)", () => {
    const v = applyWebCheck(base("notfound"), title, page(url, { live: true, title: "UAE Strategy for Artificial Intelligence | u.ae", archived: true }));
    expect(v.web).toEqual({ url, pageTitle: "UAE Strategy for Artificial Intelligence | u.ae", live: true, archiveUrl: `https://web.archive.org/web/2026/${url}`, accessedAt: "2026-11-25T00:00:00Z", retrieval: `Retrieved November 25, 2026, from ${url}` });
  });

  it("adds no web evidence when the link does not replace the verdict", () => {
    expect(applyWebCheck(base("notfound"), title, page(url, { live: false, archived: false })).web).toBeUndefined();
  });

  it("replaces a Mismatch against another registry record, and drops that record", () => {
    const v = applyWebCheck(base("mismatch", { matched, registries: ["crossref"] }), title, page(url));
    expect(v.status).toBe("partial");
    expect(v.matched).toBeUndefined();
    expect(v.registries).toEqual([]);
    expect(v.reasons).not.toContain("registry reason");
  });

  it("clears a Chimera only when the page's own title matches, not just the address", () => {
    expect(applyWebCheck(base("chimera"), title, page(url)).status).toBe("chimera");
    expect(applyWebCheck(base("chimera"), title, page(url, { title })).status).toBe("partial");
  });

  it("keeps the registry verdict when the link is dead, and says so", () => {
    const v = applyWebCheck(base("mismatch", { matched }), title, page(url, { live: false }));
    expect(v.status).toBe("mismatch");
    expect(v.reasons.join(" ")).toContain("did not load");
  });

  it("keeps Not found when the page exists but is about something else", () => {
    expect(applyWebCheck(base("notfound"), title, page("https://www.google.com/", { title: "Google" })).status).toBe("notfound");
  });

  it("never changes a Verified or Retracted verdict", () => {
    for (const s of ["verified", "retracted"] as const) expect(applyWebCheck(base(s), title, page(url, { title })).status).toBe(s);
  });
});

describe("verifyReference with a web page", () => {
  const empty = async () => ({ data: [], receipt: { registry: "crossref" as const, query: "q", hits: 0, at: "2026-11-25T00:00:00Z" } });
  const deps = (webCheck: RegistryDeps["webCheck"]): RegistryDeps => ({
    lookupDoi: async (doi) => ({ doi, records: {}, receipts: [], errors: [] }),
    crossrefMatchReference: empty, openalexSearch: empty, arxivSearch: empty, crossrefByAuthors: empty, webCheck,
  });
  const ref = "Crossref. (n.d.). Metadata retrieval guide. https://www.crossref.org/metadata-retrieval-guide/";

  it("checks the link when there is no DOI", async () => {
    const asked: string[] = [];
    const v = await verifyReference(ref, deps(async (u) => (asked.push(u), page(u))));
    expect(asked).toEqual(["https://www.crossref.org/metadata-retrieval-guide/"]);
    expect(v.status).toBe("partial");
  });

  it("does not fetch a link when the reference has a DOI", async () => {
    let calls = 0;
    await verifyReference(`${ref} https://doi.org/10.5555/12345678`, deps(async (u) => (calls++, page(u))));
    expect(calls).toBe(0);
  });

  it("keeps the registry verdict if the web check fails", async () => {
    const v = await verifyReference(ref, deps(async () => { throw new Error("down"); }));
    expect(v.status).toBe("notfound");
  });
});
