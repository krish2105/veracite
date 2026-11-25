/**
 * BibTeX, RIS and CSL-JSON export (K20). Pure code from registry records; opens in Zotero and Mendeley.
 */
import type { SourceRecord, WorkType } from "@/lib/types";

const bibType: Partial<Record<WorkType, string>> = { article: "article", review: "article", book: "book", chapter: "incollection", report: "techreport" };
const risType: Partial<Record<WorkType, string>> = { article: "JOUR", review: "JOUR", book: "BOOK", chapter: "CHAP", report: "RPRT", preprint: "UNPB", web: "ELEC" };
const cslType: Partial<Record<WorkType, string>> = { article: "article-journal", review: "article-journal", book: "book", chapter: "chapter", report: "report", preprint: "article", web: "webpage" };

const texEscape = (s: string) => s.replace(/[\\{}]/g, "").replace(/([&%$#_])/g, "\\$1");

/** Unique keys such as "bastani2025", "bastani2025a". */
export function citeKeys(records: SourceRecord[]): string[] {
  const seen = new Map<string, number>();
  return records.map((r) => {
    const base = `${(r.authors[0]?.family ?? "unknown").normalize("NFKD").replace(/[^A-Za-z]/g, "").toLowerCase() || "unknown"}${r.year ?? "nd"}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}${String.fromCharCode(96 + n)}` : base;
  });
}

export function toBibTeX(records: SourceRecord[]): string {
  const keys = citeKeys(records);
  return records
    .map((r, i) => {
      const type = bibType[r.type] ?? "misc";
      const fields: [string, string | undefined][] = [
        ["author", r.authors.map((a) => (a.given ? `${a.family}, ${a.given}` : `{${a.family}}`)).join(" and ") || undefined],
        ["title", `{${texEscape(r.title)}}`],
        [type === "article" ? "journal" : type === "incollection" ? "booktitle" : "howpublished", r.venue && texEscape(r.venue)],
        ["year", r.year?.toString()],
        ["volume", r.volume],
        ["number", r.issue],
        ["pages", r.pages?.replace(/(\d)\s*[-–]\s*(\d)/, "$1--$2")],
        ["doi", r.doi],
        ["url", r.doi ? `https://doi.org/${r.doi}` : r.url],
      ];
      return `@${type}{${keys[i]},\n${fields.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
    })
    .join("\n\n");
}

export function toRIS(records: SourceRecord[]): string {
  const line = (tag: string, v: string | number | undefined) => (v === undefined || v === "" ? [] : [`${tag}  - ${String(v).replace(/[\r\n]+/g, " ")}`]);
  return records
    .map((r) => {
      const [sp, ep] = (r.pages ?? "").split(/[-–]/);
      return [
        ...line("TY", risType[r.type] ?? "GEN"),
        ...r.authors.flatMap((a) => line("AU", a.given ? `${a.family}, ${a.given}` : a.family)),
        ...line("TI", r.title),
        ...line("T2", r.venue),
        ...line("PY", r.year),
        ...line("VL", r.volume),
        ...line("IS", r.issue),
        ...line("SP", sp),
        ...line("EP", ep),
        ...line("DO", r.doi),
        ...line("UR", r.doi ? `https://doi.org/${r.doi}` : r.url),
        ...r.tags.flatMap((t) => line("KW", t)),
        ...line("N1", r.notes),
        "ER  - ",
      ].join("\r\n");
    })
    .join("\r\n\r\n");
}

export function toCslJson(records: SourceRecord[]): string {
  const keys = citeKeys(records);
  return JSON.stringify(
    records.map((r, i) => ({
      id: keys[i],
      type: cslType[r.type] ?? "document",
      title: r.title,
      author: r.authors.map((a) => (a.given ? { family: a.family, given: a.given } : { literal: a.family })),
      issued: r.year ? { "date-parts": [[r.year]] } : undefined,
      "container-title": r.venue,
      volume: r.volume,
      issue: r.issue,
      page: r.pages,
      DOI: r.doi,
      URL: r.doi ? `https://doi.org/${r.doi}` : r.url,
    })),
    null,
    2,
  );
}
