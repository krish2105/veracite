/**
 * Crossref REST API client (K03). Docs: https://api.crossref.org/swagger-ui/index.html
 * - Retractions/corrections live on the ORIGINAL record under `updated-by` (sources: publisher,
 *   retraction-watch). A notice record carries `update-to` instead, and we flag it with `noticeFor`.
 * - Polite pool when CROSSREF_MAILTO is set (faster limits). Without it we use the public pool's limits.
 * - arXiv DOIs (10.48550/…) are DataCite DOIs and are NOT in Crossref: use arxiv.ts / openalex.ts.
 */
import type { Author, RegistryRecord, Update, WorkType } from "../types";
import { createLimiter, getJson, receipt, type RegistryResult } from "./http";
import { cleanAbstract, noticeKindFromTitle, normalizeDoi, orcidFromUrl, stripMarkup, titleSaysRetracted, updateKind, yearFromDateParts } from "./normalize";

const BASE = "https://api.crossref.org";
const polite = () => !!process.env.CROSSREF_MAILTO;
// Single-record lookups: polite 10/s, public 5/s. List/search queries are much tighter (public ≈ 1/s).
const singleLimiter = createLimiter(polite() ? 3 : 2, polite() ? 110 : 220);
const listLimiter = createLimiter(polite() ? 2 : 1, polite() ? 350 : 1000);

/** Fields we ask for on searches (keeps responses small; `language` is not selectable on /works). */
const SELECT = "DOI,title,subtitle,author,issued,published,type,container-title,group-title,score,update-to,updated-by,abstract,is-referenced-by-count,publisher,URL,volume,issue,page,article-number";

/* ---------- raw Crossref shapes (only what we read) ---------- */
interface CrUpdate {
  type?: string;
  DOI?: string;
  source?: string;
  updated?: { "date-time"?: string; "date-parts"?: (number | null)[][] };
}
interface CrAuthor {
  family?: string;
  given?: string;
  name?: string;
  ORCID?: string;
}
export interface CrossrefWork {
  DOI: string;
  title?: string[];
  subtitle?: string[];
  author?: CrAuthor[];
  issued?: { "date-parts"?: (number | null)[][] };
  published?: { "date-parts"?: (number | null)[][] };
  "published-print"?: { "date-parts"?: (number | null)[][] };
  "published-online"?: { "date-parts"?: (number | null)[][] };
  created?: { "date-parts"?: (number | null)[][] };
  type?: string;
  "container-title"?: string[];
  "group-title"?: string;
  score?: number;
  "update-to"?: CrUpdate[];
  "updated-by"?: CrUpdate[];
  abstract?: string;
  "is-referenced-by-count"?: number;
  publisher?: string;
  URL?: string;
  language?: string;
  volume?: string;
  issue?: string;
  page?: string;
  "article-number"?: string;
}

function mapType(t: string | undefined): WorkType {
  switch (t) {
    case "journal-article":
    case "proceedings-article":
      return "article";
    case "posted-content":
      return "preprint";
    case "book":
    case "monograph":
    case "edited-book":
    case "reference-book":
      return "book";
    case "book-chapter":
    case "book-section":
    case "book-part":
    case "reference-entry":
      return "chapter";
    case "report":
    case "report-component":
    case "report-series":
      return "report";
    default:
      return "other";
  }
}

function mapUpdates(list: CrUpdate[] | undefined): Update[] {
  const out: Update[] = [];
  for (const u of list ?? []) {
    const kind = updateKind(u.type);
    if (!kind) continue;
    const dt = u.updated?.["date-time"]?.slice(0, 10) ?? (yearFromDateParts(u.updated) ? String(yearFromDateParts(u.updated)) : undefined);
    out.push({ kind, noticeDoi: normalizeDoi(u.DOI), date: dt, source: u.source === "retraction-watch" ? "retraction-watch" : "publisher" });
  }
  return out;
}

function mapAuthor(a: CrAuthor): Author {
  if (!a.family && a.name) return { family: stripMarkup(a.name) };
  return { family: stripMarkup(a.family ?? ""), given: a.given ? stripMarkup(a.given) : undefined, orcid: orcidFromUrl(a.ORCID) };
}

/** Pure: Crossref work JSON → RegistryRecord. */
export function parseCrossrefWork(w: CrossrefWork, fetchedAt = new Date().toISOString()): RegistryRecord {
  const title = stripMarkup(w.title?.[0] ?? "");
  const subtitle = stripMarkup(w.subtitle?.[0] ?? "");
  const fullTitle = subtitle && !title.toLowerCase().includes(subtitle.toLowerCase()) ? `${title}: ${subtitle}` : title;
  const doi = normalizeDoi(w.DOI);
  // Some publishers (Elsevier) mark a retracted article with an `update-to` that points at ITSELF. That is a
  // retraction marker on the work, not a notice about another work (e.g. 10.1016/j.fct.2012.08.005).
  const selfMarks = (w["update-to"] ?? []).filter((u) => normalizeDoi(u.DOI) === doi);
  const updates = mapUpdates([...(w["updated-by"] ?? []), ...selfMarks]).filter(
    (u, i, all) => all.findIndex((o) => o.kind === u.kind && o.source === u.source && o.noticeDoi === u.noticeDoi) === i,
  );
  if (titleSaysRetracted(fullTitle) && !updates.some((u) => u.kind === "retraction")) updates.push({ kind: "retraction", source: "publisher" });

  // A record whose own title says "RETRACTED: …" is the retracted paper itself, whatever its `update-to` lists
  // (The Lancet points a retracted article at its notices). It must never be mistaken for a notice and skipped.
  const isRetractedPaper = titleSaysRetracted(fullTitle);
  const target = isRetractedPaper ? undefined : w["update-to"]?.find((u) => updateKind(u.type) && normalizeDoi(u.DOI) !== doi);
  const titleNotice = isRetractedPaper ? undefined : noticeKindFromTitle(fullTitle);
  const noticeFor = target ? { kind: updateKind(target.type)!, doi: normalizeDoi(target.DOI) } : titleNotice ? { kind: titleNotice } : undefined;

  return {
    registry: "crossref",
    id: doi ?? w.DOI,
    doi,
    title: fullTitle,
    authors: (w.author ?? []).map(mapAuthor).filter((a) => a.family),
    year: yearFromDateParts(w.issued) ?? yearFromDateParts(w.published) ?? yearFromDateParts(w["published-print"]) ?? yearFromDateParts(w["published-online"]) ?? yearFromDateParts(w.created),
    venue: stripMarkup(w["container-title"]?.[0] ?? w["group-title"] ?? "") || undefined,
    type: mapType(w.type),
    abstract: cleanAbstract(w.abstract),
    url: w.URL ?? (doi ? `https://doi.org/${doi}` : undefined),
    citedBy: w["is-referenced-by-count"],
    updates,
    publisher: w.publisher,
    language: w.language,
    volume: w.volume,
    issue: w.issue,
    pages: w.page ?? (w["article-number"] ? `Article ${w["article-number"]}` : undefined),
    noticeFor,
    score: w.score,
    fetchedAt,
  };
}

function withMailto(params: URLSearchParams): URLSearchParams {
  const mail = process.env.CROSSREF_MAILTO;
  if (mail) params.set("mailto", mail);
  return params;
}

/** Look up one DOI. `data` is null when Crossref has no such DOI (an honest "not found"). */
export async function crossrefByDoi(doiInput: string): Promise<RegistryResult<RegistryRecord | null>> {
  const doi = normalizeDoi(doiInput);
  if (!doi) return { data: null, receipt: receipt("crossref", `doi:${doiInput}`, 0) };
  const url = `${BASE}/works/${encodeURIComponent(doi)}?${withMailto(new URLSearchParams())}`;
  const json = await getJson<{ message: CrossrefWork }>("crossref", url, singleLimiter);
  const rec = json ? parseCrossrefWork(json.message) : null;
  return { data: rec, receipt: receipt("crossref", `doi:${doi}`, rec ? 1 : 0) };
}

/**
 * Match a messy, pasted reference string (Crossref's recommended way: `query.bibliographic`).
 * Returns candidates in Crossref's score order, notices INCLUDED but flagged with `noticeFor`:
 * the Verifier decides, never this client.
 */
export async function crossrefMatchReference(text: string, rows = 5): Promise<RegistryResult<RegistryRecord[]>> {
  const q = text.replace(/\s+/g, " ").trim().slice(0, 600);
  const params = withMailto(new URLSearchParams({ "query.bibliographic": q, rows: String(rows), select: SELECT }));
  const json = await getJson<{ message: { items: CrossrefWork[] } }>("crossref", `${BASE}/works?${params}`, listLimiter);
  const items = (json?.message.items ?? []).map((w) => parseCrossrefWork(w));
  return { data: items, receipt: receipt("crossref", q, items.length) };
}

export interface CrossrefSearchOptions {
  rows?: number;
  fromYear?: number;
  untilYear?: number;
}

/** Topic search for the Scout (research sessions). Notices are dropped here: they are never candidates. */
export async function crossrefSearch(query: string, opts: CrossrefSearchOptions = {}): Promise<RegistryResult<RegistryRecord[]>> {
  const filters = ["type:journal-article,type:posted-content,type:book-chapter,type:proceedings-article"];
  if (opts.fromYear) filters.push(`from-pub-date:${opts.fromYear}-01-01`);
  if (opts.untilYear) filters.push(`until-pub-date:${opts.untilYear}-12-31`);
  const params = withMailto(new URLSearchParams({ query, rows: String(opts.rows ?? 20), select: SELECT, filter: filters.join(",") }));
  const json = await getJson<{ message: { items: CrossrefWork[] } }>("crossref", `${BASE}/works?${params}`, listLimiter);
  const items = (json?.message.items ?? []).map((w) => parseCrossrefWork(w)).filter((r) => !r.noticeFor);
  return { data: items, receipt: receipt("crossref", query, items.length) };
}

/**
 * Works by these authors (Crossref `query.author`). Used only when nothing matches a reference, to tell the
 * student "these researchers are real, but they never wrote this paper" (real authors on an invented paper).
 */
export async function crossrefByAuthors(surnames: string[], rows = 5): Promise<RegistryResult<RegistryRecord[]>> {
  const q = surnames.slice(0, 4).join(" ").trim();
  if (!q) return { data: [], receipt: receipt("crossref", "author:", 0) };
  const params = withMailto(new URLSearchParams({ "query.author": q, rows: String(rows), select: SELECT }));
  const json = await getJson<{ message: { items: CrossrefWork[] } }>("crossref", `${BASE}/works?${params}`, listLimiter);
  const items = (json?.message.items ?? []).map((w) => parseCrossrefWork(w)).filter((r) => !r.noticeFor);
  return { data: items, receipt: receipt("crossref", `author:${q}`, items.length) };
}
