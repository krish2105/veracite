/**
 * Pure helpers shared by the registry clients (K03). No network, no state: unit-tested in registries.test.ts.
 */
import type { Author, Update } from "../types";

/** Pull a DOI out of any string ("https://doi.org/10.1/x.", "doi:10.1/X") → "10.1/x" (lower-case), or undefined. */
export function normalizeDoi(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  // Old SICI DOIs contain < > ; ( ) and colons, e.g. 10.1002/(SICI)1097-0266(199708)18:7<509::AID-SMJ882>3.0.CO;2-Z
  const m = decodeURIComponent(String(input)).match(/10\.\d{4,9}\/[^\s"']+/i);
  if (!m) return undefined;
  return m[0].replace(/[.,;:)\]}>]+$/, "").toLowerCase();
}

/** arXiv DOIs are DataCite DOIs (10.48550/arXiv.ID). Crossref returns 404 for them. */
export function isArxivDoi(doi: string | undefined): boolean {
  return !!doi && /^10\.48550\/arxiv\./i.test(doi);
}

/** "10.48550/arXiv.2506.08872" | "arXiv:2506.08872v2" | "2506.08872" → "2506.08872" (version dropped). */
export function arxivIdFromString(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const m = input.match(/(?:arxiv[.:/]\s*)?(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?/i);
  return m ? m[1] : undefined;
}

export function arxivDoi(id: string): string {
  return `10.48550/arxiv.${id}`.toLowerCase();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Strip JATS/HTML tags (<jats:p>, <i>, <sup>…) and decode entities. Collapses whitespace. */
export function stripMarkup(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : all;
      }
      return ENTITIES[e.toLowerCase()] ?? all;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Crossref abstracts often start with a JATS "Abstract" heading. */
export function cleanAbstract(s: string | null | undefined): string | undefined {
  const t = stripMarkup(s).replace(/^abstract[:.\s]+/i, "").trim();
  return t || undefined;
}

/** OpenAlex ships abstracts as an inverted index { word: [positions] }. Rebuild the text. */
export function abstractFromInvertedIndex(idx: Record<string, number[]> | null | undefined): string | undefined {
  if (!idx) return undefined;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx)) for (const p of positions) words[p] = word;
  const text = words.filter((w) => w !== undefined).join(" ").replace(/\s+/g, " ").trim();
  return text || undefined;
}

/** "Hamsa Bastani" → {given:"Hamsa", family:"Bastani"} · "Bastani, Hamsa" → same · "OECD" → {family:"OECD"}. */
export function splitName(display: string | null | undefined): Author {
  const name = stripMarkup(display);
  if (name.includes(",")) {
    const [family, given] = name.split(",", 2).map((s) => s.trim());
    return given ? { family, given } : { family };
  }
  const parts = name.split(" ").filter(Boolean);
  if (parts.length <= 1) return { family: name };
  const suffix = /^(jr\.?|sr\.?|ii|iii|iv)$/i;
  const last = suffix.test(parts[parts.length - 1]) && parts.length > 2 ? parts.length - 2 : parts.length - 1;
  return { family: parts[last], given: parts.slice(0, last).join(" ") };
}

export function orcidFromUrl(s: string | null | undefined): string | undefined {
  const m = s?.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return m ? m[0].toUpperCase() : undefined;
}

/** Crossref date-parts [[2025, 6, 25]] → 2025. */
export function yearFromDateParts(d: { "date-parts"?: (number | null)[][] } | undefined): number | undefined {
  const y = d?.["date-parts"]?.[0]?.[0];
  return typeof y === "number" && y > 1000 ? y : undefined;
}

/** Map a Crossref/Retraction Watch update type to ours. Unknown types (e.g. "new_version") → undefined. */
export function updateKind(type: string | undefined): Update["kind"] | undefined {
  const t = (type ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (["retraction", "partial_retraction", "removal"].includes(t)) return "retraction";
  if (["withdrawal", "withdrawn"].includes(t)) return "withdrawal";
  if (["correction", "erratum", "corrigendum", "addendum", "clarification"].includes(t)) return "correction";
  if (["expression_of_concern", "concern"].includes(t)) return "concern";
  return undefined;
}

/** Titles that announce a notice rather than a paper ("Correction for Bastani et al., …", "Retraction Note: …"). */
export function noticeKindFromTitle(title: string): Update["kind"] | undefined {
  const t = title.trim().toLowerCase();
  if (/^(retraction( note| notice)?|notice of retraction)\b[:\s]/.test(t) || /^retraction (of|for)\b/.test(t)) return "retraction";
  if (/^(correction|erratum|corrigendum)( (note|notice|to|for))?\b[:\s]/.test(t)) return "correction";
  if (/^expression of concern\b/.test(t)) return "concern";
  if (/^withdrawal( note)?\b[:\s]/.test(t)) return "withdrawal";
  return undefined;
}

/** "RETRACTED ARTICLE: …" / "RETRACTED: …" prefixes (Springer, Elsevier) mean the work itself is retracted. */
export function titleSaysRetracted(title: string): boolean {
  return /^\s*retracted( article)?\s*:/i.test(title);
}
