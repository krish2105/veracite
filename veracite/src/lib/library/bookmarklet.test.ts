import { describe, expect, it } from "vitest";
import { bookmarkletCode, bookmarkletHref, parseSaveParams, verifyInputFor } from "./bookmarklet";

describe("parseSaveParams: what the /save page was asked to check", () => {
  it("reads a bare DOI", () => {
    expect(parseSaveParams({ doi: "10.1038/nature14539" })).toEqual({ kind: "doi", doi: "10.1038/nature14539" });
  });

  it("normalises a doi.org link and lowercases it", () => {
    expect(parseSaveParams({ doi: "https://doi.org/10.1073/PNAS.2422633122" })).toMatchObject({ kind: "doi", doi: "10.1073/pnas.2422633122" });
  });

  it("keeps the page title next to a DOI, as context only", () => {
    expect(parseSaveParams({ doi: "doi:10.1038/nature14539", title: "  Deep   learning " })).toEqual({ kind: "doi", doi: "10.1038/nature14539", title: "Deep learning" });
  });

  it("finds a DOI inside a publisher link and ignores its query string", () => {
    expect(parseSaveParams({ url: "https://dl.acm.org/doi/10.1145/3290605.3300233?role=tab#sec" })).toEqual({
      kind: "doi",
      doi: "10.1145/3290605.3300233",
      url: "https://dl.acm.org/doi/10.1145/3290605.3300233?role=tab#sec",
    });
  });

  it("treats a link without a DOI as a web page", () => {
    expect(parseSaveParams({ url: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", title: "REST API - Crossref" })).toEqual({
      kind: "url",
      url: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
      title: "REST API - Crossref",
    });
  });

  it("says when nothing was given", () => {
    expect(parseSaveParams({})).toEqual({ kind: "none" });
    expect(parseSaveParams({ doi: "  ", url: "" })).toEqual({ kind: "none" });
  });

  it("refuses text that is not a DOI", () => {
    expect(parseSaveParams({ doi: "not a doi" })).toMatchObject({ kind: "bad" });
  });

  it("refuses links that are not http or https", () => {
    expect(parseSaveParams({ url: "javascript:alert(1)" })).toMatchObject({ kind: "bad" });
    expect(parseSaveParams({ url: "ftp://example.org/paper.pdf" })).toMatchObject({ kind: "bad" });
    expect(parseSaveParams({ url: "not a link" })).toMatchObject({ kind: "bad" });
  });

  it("refuses links that are too long", () => {
    expect(parseSaveParams({ url: `https://example.org/${"a".repeat(2100)}` })).toMatchObject({ kind: "bad" });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseSaveParams({ doi: ["10.1038/nature14539", "10.1000/other"] })).toMatchObject({ kind: "doi", doi: "10.1038/nature14539" });
  });

  it("caps the title at 300 characters", () => {
    const t = parseSaveParams({ url: "https://example.org/page", title: "x".repeat(500) });
    expect(t.kind === "url" && t.title?.length).toBe(300);
  });
});

describe("verifyInputFor: what goes to /api/sources/verify", () => {
  it("sends only the DOI, so the registry record decides (never the page's own title)", () => {
    expect(verifyInputFor({ kind: "doi", doi: "10.1038/nature14539", title: "Deep learning | Nature" })).toBe("https://doi.org/10.1038/nature14539");
  });

  it("sends title and link for a web page, so the registries and the web check both run", () => {
    expect(verifyInputFor({ kind: "url", url: "https://example.org/report", title: "Annual report" })).toBe("Annual report. https://example.org/report");
  });

  it("returns nothing for a link without a title (the page uses the web check instead)", () => {
    expect(verifyInputFor({ kind: "url", url: "https://example.org/report" })).toBeUndefined();
  });
});

// A tiny stand-in for the browser page the bookmarklet runs on.
type Attrs = Record<string, string>;
function page({ metas = [], links = [], title = "", href = "https://publisher.example/article/1" }: { metas?: Attrs[]; links?: Attrs[]; title?: string; href?: string }) {
  const el = (a: Attrs) => ({ getAttribute: (n: string) => a[n] ?? null, href: a.href });
  const opened: string[] = [];
  const location = { href };
  const document = { title, getElementsByTagName: (t: string) => (t === "meta" ? metas : t === "link" ? links : []).map(el) };
  const window = { open: (u: string) => (opened.push(u), {}) };
  new Function("document", "location", "window", bookmarkletCode("https://veracite.vercel.app"))(document, location, window);
  return { opened, location };
}
const query = (u: string) => Object.fromEntries(new URL(u).searchParams);

describe("the bookmarklet (runs on any page the student is reading)", () => {
  it("opens /save with the page's citation_doi and title", () => {
    const { opened } = page({ metas: [{ name: "citation_doi", content: "10.1038/nature14539" }, { name: "citation_title", content: "Deep learning" }], title: "Deep learning | Nature" });
    expect(opened).toHaveLength(1);
    expect(opened[0].startsWith("https://veracite.vercel.app/save?")).toBe(true);
    expect(query(opened[0])).toEqual({ doi: "10.1038/nature14539", title: "Deep learning" });
  });

  it("reads a DOI from dc.identifier written as info:doi/…, matching names case-insensitively", () => {
    const { opened } = page({ metas: [{ name: "DC.Identifier", content: "ISSN 1234-5678" }, { name: "DC.identifier", content: "info:doi/10.1000/xyz123" }], title: "A paper" });
    expect(query(opened[0]).doi).toBe("10.1000/xyz123");
  });

  it("turns an arXiv page's citation_arxiv_id into its arXiv DOI", () => {
    const { opened } = page({ metas: [{ name: "citation_arxiv_id", content: "1706.03762" }, { name: "citation_title", content: "Attention Is All You Need" }], href: "https://arxiv.org/abs/1706.03762" });
    expect(query(opened[0])).toEqual({ doi: "10.48550/arXiv.1706.03762", title: "Attention Is All You Need" });
  });

  it("prefers a published DOI over the arXiv one", () => {
    const { opened } = page({ metas: [{ name: "citation_arxiv_id", content: "1706.03762" }, { name: "citation_doi", content: "10.5555/3295222.3295349" }] });
    expect(query(opened[0]).doi).toBe("10.5555/3295222.3295349");
  });

  it("falls back to og:url and og:title when the page has no DOI", () => {
    const { opened } = page({ metas: [{ property: "og:url", content: "https://news.example/story" }, { property: "og:title", content: "A story" }], title: "A story - News" });
    expect(query(opened[0])).toEqual({ url: "https://news.example/story", title: "A story" });
  });

  it("falls back to the canonical link, then the address bar, and the document title", () => {
    const withCanonical = page({ links: [{ rel: "canonical", href: "https://site.example/canonical" }], title: "Page" });
    expect(query(withCanonical.opened[0])).toEqual({ url: "https://site.example/canonical", title: "Page" });
    const bare = page({ title: "Bare page", href: "https://site.example/bare?x=1" });
    expect(query(bare.opened[0])).toEqual({ url: "https://site.example/bare?x=1", title: "Bare page" });
  });

  it("navigates in the same tab when a popup blocker stops the new window", () => {
    const location = { href: "https://site.example/page" };
    const document = { title: "Page", getElementsByTagName: () => [] };
    const window = { open: () => null };
    new Function("document", "location", "window", bookmarkletCode("https://veracite.vercel.app"))(document, location, window);
    expect(location.href.startsWith("https://veracite.vercel.app/save?url=")).toBe(true);
  });

  it("is a javascript: link whose body decodes to the same code", () => {
    const href = bookmarkletHref("https://veracite.vercel.app");
    expect(href.startsWith("javascript:")).toBe(true);
    expect(decodeURIComponent(href.slice("javascript:".length))).toBe(bookmarkletCode("https://veracite.vercel.app"));
  });

  it("embeds the origin safely, even with quotes in it", () => {
    expect(() => new Function(bookmarkletCode('https://x.example/"; alert(1); "'))).not.toThrow();
  });
});
