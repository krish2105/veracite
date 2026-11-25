/**
 * One-click save (A15, built in K27): like Zotero's browser button, but nothing is saved before it is verified.
 *
 * 1. The bookmarklet runs on the page the student is reading. It reads the page's DOI meta tags
 *    (citation_doi, prism.doi, dc.identifier…) or, without a DOI, the page's own address and title,
 *    and opens Veracite's /save page with them. It sends nothing anywhere else.
 * 2. The /save page checks that DOI or link with the same code-only Verifier as the X-ray.
 * 3. "Add to my list" appears only when the verdict allows it, and the saved record comes from the
 *    registry, never from the page. Pure code, no AI.
 */
import { normalizeDoi } from "@/lib/registries/normalize";

export type SaveTarget =
  | { kind: "doi"; doi: string; title?: string; url?: string }
  | { kind: "url"; url: string; title?: string }
  | { kind: "none" }
  | { kind: "bad"; reason: string };

type Params = Record<string, string | string[] | undefined>;

const MAX_URL = 2000;
const MAX_TITLE = 300;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const cleanTitle = (t: string) => t.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE) || undefined;

/** Reads ?doi= or ?url= (plus an optional ?title=) into what the page should check. */
export function parseSaveParams(params: Params): SaveTarget {
  const rawDoi = first(params.doi);
  const rawUrl = first(params.url);
  const title = cleanTitle(first(params.title));
  const withTitle = <T extends object>(t: T) => (title ? { ...t, title } : t);

  if (rawDoi) {
    const doi = normalizeDoi(rawDoi);
    return doi ? withTitle({ kind: "doi" as const, doi }) : { kind: "bad", reason: "That does not look like a DOI. A DOI starts with 10., for example 10.1038/nature14539." };
  }
  if (!rawUrl) return { kind: "none" };
  if (rawUrl.length > MAX_URL) return { kind: "bad", reason: "That link is too long to check." };
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { kind: "bad", reason: "That is not a valid web address." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "bad", reason: "Only http and https links can be checked." };
  // Many publisher links carry the DOI in their path (…/doi/10.1145/…). Only the path counts, not ?query or #hash.
  const doi = normalizeDoi(url.pathname);
  return doi ? withTitle({ kind: "doi" as const, doi, url: rawUrl }) : withTitle({ kind: "url" as const, url: rawUrl });
}

/**
 * The text sent to /api/sources/verify, or undefined when only the web check (live + archived) can run.
 * A DOI goes alone, so the registry record decides; a page's own title ("Deep learning | Nature") is never
 * allowed to stand in for the registry's.
 */
export function verifyInputFor(t: Extract<SaveTarget, { kind: "doi" | "url" }>): string | undefined {
  if (t.kind === "doi") return `https://doi.org/${t.doi}`;
  return t.title ? `${t.title}. ${t.url}` : undefined;
}

/** The bookmarklet's source. Plain ES5 so it runs on any page; it only reads meta tags and opens /save. */
export function bookmarkletCode(origin: string): string {
  return [
    "(function(){",
    "var M=document.getElementsByTagName('meta'),L=document.getElementsByTagName('link');",
    "function k(e){return (e.getAttribute('name')||e.getAttribute('property')||'').toLowerCase()}",
    "function q(n){for(var i=0;i<M.length;i++){if(k(M[i])===n){var v=(M[i].getAttribute('content')||'').trim();if(v)return v}}return ''}",
    "var D={'citation_doi':1,'prism.doi':1,'dc.identifier':1,'dcterms.identifier':1,'bepress_citation_doi':1},doi='';",
    "for(var i=0;i<M.length&&!doi;i++){if(D[k(M[i])]){var m=(M[i].getAttribute('content')||'').match(/10\\.\\d{4,9}\\/[^\\s\"'<>]+/);if(m)doi=m[0]}}",
    // arXiv abstract pages give an arXiv ID, not a DOI; arXiv DOIs are 10.48550/arXiv.<id>.
    "var ax=q('citation_arxiv_id');if(!doi&&/^[\\w.\\/-]+$/.test(ax))doi='10.48550/arXiv.'+ax;",
    "var c='';for(var j=0;j<L.length;j++){if((L[j].getAttribute('rel')||'').toLowerCase()==='canonical'){c=L[j].href||L[j].getAttribute('href')||'';break}}",
    "var t=(q('citation_title')||q('dc.title')||q('og:title')||document.title||'').replace(/\\s+/g,' ').trim().slice(0,300);",
    "var u=q('og:url')||c||location.href;",
    `var s=${JSON.stringify(origin)}+'/save?'+(doi?'doi='+encodeURIComponent(doi):'url='+encodeURIComponent(u))+(t?'&title='+encodeURIComponent(t):'');`,
    "var w=window.open(s,'_blank');if(w){try{w.opener=null}catch(x){}}else{location.href=s}",
    "})();",
  ].join("");
}

/** The href for the drag-to-bookmarks link. React 19 blocks javascript: hrefs, so set it on the DOM node directly. */
export function bookmarkletHref(origin: string): string {
  return `javascript:${encodeURIComponent(bookmarkletCode(origin))}`;
}
