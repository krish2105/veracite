/**
 * arXiv API client (K03). Docs: https://info.arxiv.org/help/api/user-manual.html
 * - arXiv asks for no more than one request every 3 seconds, so this limiter is strict.
 * - Returns Atom XML; parsed with small, tested regexes (no XML dependency).
 * - Every arXiv paper has a DataCite DOI 10.48550/arXiv.<id>. When the paper was later published, the feed
 *   carries the journal DOI too (`publishedDoi`).
 */
import type { Author, RegistryRecord } from "../types";
import { createLimiter, getText, receipt, type RegistryResult } from "./http";
import { arxivDoi, arxivIdFromString, normalizeDoi, splitName, stripMarkup } from "./normalize";

const BASE = "https://export.arxiv.org/api/query";
const limiter = createLimiter(1, 3000);

const tag = (xml: string, name: string): string | undefined => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? stripMarkup(m[1]) : undefined;
};

/** Pure: arXiv Atom feed → RegistryRecords. Error entries ("…/api/errors") are skipped. */
export function parseArxivFeed(xml: string, fetchedAt = new Date().toISOString()): RegistryRecord[] {
  const out: RegistryRecord[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const idUrl = tag(e, "id") ?? "";
    if (/api\/errors/.test(idUrl)) continue;
    const id = arxivIdFromString(idUrl);
    if (!id) continue;
    const authors: Author[] = [...e.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((a) => splitName(a[1])).filter((a) => a.family);
    const published = tag(e, "published");
    out.push({
      registry: "arxiv",
      id,
      doi: arxivDoi(id),
      title: tag(e, "title") ?? "",
      authors,
      year: published ? Number(published.slice(0, 4)) : undefined,
      venue: "arXiv",
      type: "preprint",
      abstract: tag(e, "summary"),
      url: `https://arxiv.org/abs/${id}`,
      openAccess: true,
      oaUrl: `https://arxiv.org/pdf/${id}`,
      updates: [],
      publishedDoi: normalizeDoi(tag(e, "arxiv:doi")),
      fetchedAt,
    });
  }
  return out;
}

/** Look up one arXiv paper by ID, arXiv URL or 10.48550 DOI. `data` is null when arXiv has no such paper. */
export async function arxivById(input: string): Promise<RegistryResult<RegistryRecord | null>> {
  const id = arxivIdFromString(input);
  if (!id) return { data: null, receipt: receipt("arxiv", `id:${input}`, 0) };
  const xml = await getText("arxiv", `${BASE}?${new URLSearchParams({ id_list: id })}`, limiter, "application/atom+xml");
  const rec = xml ? (parseArxivFeed(xml)[0] ?? null) : null;
  return { data: rec, receipt: receipt("arxiv", `id:${id}`, rec ? 1 : 0) };
}

/** Title search (used when a pasted reference looks like a preprint but has no arXiv ID). */
export async function arxivSearch(title: string, max = 3): Promise<RegistryResult<RegistryRecord[]>> {
  const q = title.replace(/["()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  const params = new URLSearchParams({ search_query: `ti:"${q}"`, max_results: String(max) });
  const xml = await getText("arxiv", `${BASE}?${params}`, limiter, "application/atom+xml");
  const items = xml ? parseArxivFeed(xml) : [];
  return { data: items, receipt: receipt("arxiv", `title:${q}`, items.length) };
}
