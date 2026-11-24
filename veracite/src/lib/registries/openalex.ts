/**
 * OpenAlex API client (K03). Docs: https://developers.openalex.org
 * - Needs a free API key since 13 Feb 2026 (OPENALEX_API_KEY). Without one, a tiny daily budget still works for
 *   development. DOI lookups are the cheapest call, searches cost more, so the Verifier prefers DOI lookups.
 * - Abstracts come as an inverted index; we rebuild the text (the Reader quote-checks against it).
 * - Covers arXiv preprints (DataCite DOIs) that Crossref does not have.
 */
import type { RegistryRecord, Update, WorkType } from "../types";
import { createLimiter, getJson, receipt, type RegistryResult } from "./http";
import { abstractFromInvertedIndex, noticeKindFromTitle, normalizeDoi, orcidFromUrl, splitName, stripMarkup } from "./normalize";

const BASE = "https://api.openalex.org";
const limiter = createLimiter(4, 120); // well under OpenAlex's 10 req/s
const SELECT = "id,doi,title,display_name,publication_year,type,authorships,primary_location,abstract_inverted_index,open_access,cited_by_count,is_retracted,language,biblio,relevance_score";

/* ---------- raw OpenAlex shapes (only what we read) ---------- */
export interface OpenAlexWork {
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  type?: string | null;
  authorships?: {
    author?: { display_name?: string | null; orcid?: string | null };
    countries?: string[];
    institutions?: { country_code?: string | null }[];
  }[];
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null; host_organization_name?: string | null } | null;
  } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  cited_by_count?: number;
  is_retracted?: boolean;
  language?: string | null;
  biblio?: { volume?: string | null; issue?: string | null; first_page?: string | null; last_page?: string | null } | null;
  relevance_score?: number | null;
}

function mapType(t: string | null | undefined): WorkType {
  switch (t) {
    case "article":
      return "article";
    case "preprint":
      return "preprint";
    case "review":
      return "review";
    case "book":
      return "book";
    case "book-chapter":
      return "chapter";
    case "report":
      return "report";
    default:
      return "other";
  }
}

/** Pure: OpenAlex work JSON → RegistryRecord. */
export function parseOpenAlexWork(w: OpenAlexWork, fetchedAt = new Date().toISOString()): RegistryRecord {
  const title = stripMarkup(w.title ?? w.display_name ?? "");
  const doi = normalizeDoi(w.doi);
  const countries = new Set<string>();
  for (const a of w.authorships ?? []) {
    for (const c of a.countries ?? []) countries.add(c.toUpperCase());
    for (const i of a.institutions ?? []) if (i.country_code) countries.add(i.country_code.toUpperCase());
  }
  const updates: Update[] = w.is_retracted ? [{ kind: "retraction", source: "openalex" }] : [];
  const noticeType = w.type === "erratum" ? "correction" : w.type === "retraction" ? "retraction" : noticeKindFromTitle(title);
  const b = w.biblio;
  return {
    registry: "openalex",
    id: w.id.replace(/^https?:\/\/openalex\.org\//, ""),
    doi,
    title,
    authors: (w.authorships ?? [])
      .map((a) => ({ ...splitName(a.author?.display_name), orcid: orcidFromUrl(a.author?.orcid) }))
      .filter((a) => a.family),
    year: w.publication_year ?? undefined,
    venue: stripMarkup(w.primary_location?.source?.display_name ?? "") || undefined,
    type: mapType(w.type),
    abstract: abstractFromInvertedIndex(w.abstract_inverted_index),
    url: w.primary_location?.landing_page_url ?? (doi ? `https://doi.org/${doi}` : undefined),
    citedBy: w.cited_by_count,
    openAccess: w.open_access?.is_oa,
    oaUrl: w.open_access?.oa_url ?? undefined,
    updates,
    countries: countries.size ? [...countries] : undefined,
    publisher: w.primary_location?.source?.host_organization_name ?? undefined,
    language: w.language ?? undefined,
    volume: b?.volume ?? undefined,
    issue: b?.issue ?? undefined,
    pages: b?.first_page ? (b.last_page && b.last_page !== b.first_page ? `${b.first_page}-${b.last_page}` : b.first_page) : undefined,
    noticeFor: noticeType ? { kind: noticeType } : undefined,
    score: w.relevance_score ?? undefined,
    fetchedAt,
  };
}

function auth(params: URLSearchParams): URLSearchParams {
  const key = process.env.OPENALEX_API_KEY;
  if (key) params.set("api_key", key);
  return params;
}

/** Look up one DOI (works for Crossref and DataCite/arXiv DOIs). `data` is null when OpenAlex has no record. */
export async function openalexByDoi(doiInput: string): Promise<RegistryResult<RegistryRecord | null>> {
  const doi = normalizeDoi(doiInput);
  if (!doi) return { data: null, receipt: receipt("openalex", `doi:${doiInput}`, 0) };
  const url = `${BASE}/works/doi:${encodeURIComponent(doi)}?${auth(new URLSearchParams({ select: SELECT }))}`;
  const w = await getJson<OpenAlexWork>("openalex", url, limiter);
  const rec = w ? parseOpenAlexWork(w) : null;
  return { data: rec, receipt: receipt("openalex", `doi:${doi}`, rec ? 1 : 0) };
}

export interface OpenAlexSearchOptions {
  perPage?: number;
  fromYear?: number;
  toYear?: number;
  openAccessOnly?: boolean;
  /** Restrict the search to titles (used by the Verifier to match a pasted reference without a DOI). */
  titleOnly?: boolean;
}

/** Topic or title search. Notices (errata, retraction notices) are dropped: they are never candidates. */
export async function openalexSearch(query: string, opts: OpenAlexSearchOptions = {}): Promise<RegistryResult<RegistryRecord[]>> {
  const q = query.replace(/[,|:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  const filters: string[] = [];
  if (opts.titleOnly) filters.push(`title.search:${q}`);
  if (opts.fromYear) filters.push(`from_publication_date:${opts.fromYear}-01-01`);
  if (opts.toYear) filters.push(`to_publication_date:${opts.toYear}-12-31`);
  if (opts.openAccessOnly) filters.push("is_oa:true");
  const params = new URLSearchParams({ per_page: String(opts.perPage ?? 25), select: SELECT });
  if (!opts.titleOnly) params.set("search", q);
  if (filters.length) params.set("filter", filters.join(","));
  const json = await getJson<{ results: OpenAlexWork[] }>("openalex", `${BASE}/works?${auth(params)}`, limiter);
  const items = (json?.results ?? []).map((w) => parseOpenAlexWork(w)).filter((r) => !r.noticeFor);
  return { data: items, receipt: receipt("openalex", opts.titleOnly ? `title:${q}` : q, items.length) };
}
