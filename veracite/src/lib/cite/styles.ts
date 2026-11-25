/**
 * Citation styles (K29): APA 7 (default, our own tested formatter), MLA 9, Harvard (Cite Them Right),
 * IEEE and Chicago author-date (official CSL styles via citation-js, loaded on demand).
 * Everything here formats REGISTRY records. The AI never writes a reference.
 */
import { apaReference, apaSorted } from "@/components/app/tabs/xray/apa";
import type { SourceRecord, WorkType } from "@/lib/types";
import { inText } from "./insert";

export type CiteStyle = "apa" | "mla" | "harvard" | "ieee" | "chicago";

export const STYLES: Record<CiteStyle, { label: string; heading: string; file: string }> = {
  apa: { label: "APA 7", heading: "References", file: "references-apa7.txt" },
  mla: { label: "MLA 9", heading: "Works Cited", file: "works-cited-mla9.txt" },
  harvard: { label: "Harvard", heading: "Reference list", file: "references-harvard.txt" },
  ieee: { label: "IEEE", heading: "References", file: "references-ieee.txt" },
  chicago: { label: "Chicago", heading: "References", file: "references-chicago.txt" },
};
export const STYLE_ORDER: CiteStyle[] = ["apa", "mla", "harvard", "ieee", "chicago"];
export const isCiteStyle = (s: unknown): s is CiteStyle => typeof s === "string" && s in STYLES;

type Name = { family: string; given: string } | { literal: string };
type DateParts = { "date-parts": number[][] };
export interface CslItem {
  id: string;
  type: string;
  title: string;
  author: Name[];
  issued?: DateParts;
  accessed?: DateParts;
  "container-title"?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
  URL?: string;
}

export interface StyledEntry {
  id: string;
  text: string;
  html: string;
}

const CSL_TYPE: Record<WorkType, string> = { article: "article-journal", review: "article-journal", book: "book", chapter: "chapter", report: "report", preprint: "article", web: "webpage", other: "document" };

/** The retrieval date as the student saw it, in Dubai time. */
function dubaiDate(iso: string): number[] {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return [get("year"), get("month"), get("day")];
}

/** A registry record as CSL-JSON. Organisations stay one literal name; web pages carry the retrieval date. */
export function toCslItem(r: SourceRecord): CslItem {
  const item: CslItem = {
    id: r.id,
    type: CSL_TYPE[r.type] ?? "document",
    title: r.title,
    author: r.authors.map((a) => (a.given ? { family: a.family, given: a.given } : { literal: a.family })),
  };
  if (r.year) item.issued = { "date-parts": [[r.year]] };
  if (r.type === "preprint") {
    const server = r.venue ?? (r.doi && /^10\.48550\/arxiv\./i.test(r.doi) ? "arXiv" : undefined);
    if (server) item.publisher = server;
  } else if (r.venue) {
    if (r.type === "book" || r.type === "report") item.publisher = r.venue;
    else item["container-title"] = r.venue;
  }
  if (r.volume) item.volume = r.volume;
  if (r.issue) item.issue = r.issue;
  // Records keep APA 7's "Article e2422633122" for article numbers; CSL styles add their own page label.
  if (r.pages) item.page = r.pages.replace(/^article\s+/i, "");
  if (r.doi) item.DOI = r.doi;
  else if (r.url) item.URL = r.url;
  if (r.type === "web") item.accessed = { "date-parts": [dubaiDate(r.accessedAt ?? r.addedAt)] };
  return item;
}

/** One formatted entry per record, in the style's own order (alphabetical, or as given for IEEE). */
export async function formatEntries(style: CiteStyle, records: SourceRecord[]): Promise<StyledEntry[]> {
  if (!records.length) return [];
  if (style === "apa") return apaSorted(records).map((r) => ({ id: r.id, ...apaReference(r) }));
  const engine = await import("./engine");
  return engine.bibliography(style, records.map(toCslItem));
}

/** The in-text citation for `record`. IEEE numbers it by its place in `list` (or the next number). */
export async function formatInText(style: CiteStyle, record: SourceRecord, list: SourceRecord[]): Promise<string> {
  if (style === "apa") return inText(record);
  if (style === "ieee") {
    const i = list.findIndex((s) => s.id === record.id);
    return `[${(i < 0 ? list.length : i) + 1}]`;
  }
  const engine = await import("./engine");
  return engine.citation(style, [toCslItem(record)], record.id);
}

/** The whole list with the style's heading, for copy and download. */
export function listOutput(style: CiteStyle, entries: StyledEntry[]): { text: string; html: string } {
  const { heading } = STYLES[style];
  return {
    text: [heading, ...entries.map((e) => e.text)].join("\n\n"),
    html: `<p style="margin:0 0 12px;font-weight:600">${heading}</p>${entries.map((e) => `<p style="margin:0 0 12px;padding-left:36px;text-indent:-36px;line-height:2">${e.html}</p>`).join("")}`,
  };
}
