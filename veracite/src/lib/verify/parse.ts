/**
 * Best-effort reference parser (K04). Pure, unit-tested in parse.test.ts.
 * Handles APA 7 / Harvard ("Surname, A. (2025). Title. Journal"), MLA / Chicago / IEEE (quoted titles),
 * and numbered ChatGPT lists. Parsing never decides a verdict on its own: Crossref's own matcher gets
 * the raw text, and these fields are only used to compare against what the registries return.
 */
import type { Author, ReferenceInput } from "../types";
import { arxivDoi, arxivIdFromString, normalizeDoi } from "../registries/normalize";

const U = "\\p{Lu}";
const L = "\\p{L}'’\\-";
const APA_AUTHOR = new RegExp(`([${U}][${L}]+(?:[\\s-][${U}][${L}]+)*),\\s*((?:[${U}]\\.(?:\\s?-?[${U}]\\.)*\\s*)+)`, "gu");
const IEEE_AUTHOR = new RegExp(`((?:[${U}]\\.\\s?-?)+)\\s?([${U}][${L}]+(?:\\s[${U}][${L}]+)?)`, "gu");

/** Corporate authors are kept whole ("World Health Organization", "OECD"). */
const ORG = /\b(organi[sz]ation|association|institute|university|department|ministry|council|agency|bank|fund|commission|society|foundation|office|cent(?:re|er)|board|authority|forum|government|OECD|UNESCO|UNICEF|WHO)\b/i;

/** Split an author segment into authors. Returns [] when nothing name-like is found. */
export function parseAuthors(seg: string): Author[] {
  const s = seg.replace(/\bet al\.?/gi, "").replace(/\.\.\./g, ",").trim();
  if (!s) return [];
  const apa = [...s.matchAll(APA_AUTHOR)];
  if (apa.length) return apa.map((m) => ({ family: m[1].trim(), given: m[2].trim() }));
  const ieee = [...s.matchAll(IEEE_AUTHOR)];
  if (ieee.length) return ieee.map((m) => ({ family: m[2].trim(), given: m[1].trim() }));
  // MLA / Chicago: "Surname, First, and First Surname" · organisations: "World Health Organization"
  const chunks = s.split(/,?\s+and\s+|\s*&\s*|;\s*/).map((c) => c.trim().replace(/[.,]$/, "")).filter(Boolean);
  const out: Author[] = [];
  chunks.forEach((c, i) => {
    if (i === 0 && c.includes(",")) {
      const [family, given] = c.split(",", 2).map((x) => x.trim());
      out.push(given ? { family, given } : { family });
    } else {
      const words = c.split(/\s+/);
      if (ORG.test(c)) return void out.push({ family: c });
      if (words.length > 4) return;
      out.push(words.length === 1 || words.length > 3 ? { family: c } : { family: words[words.length - 1], given: words.slice(0, -1).join(" ") });
    }
  });
  return out;
}

const cleanTitle = (t: string) => t.replace(/^[\s“"'‘]+|[\s”"'’.,]+$/g, "").trim();

/** Find where an APA title ends: the first ". " / "? " / "! " followed by a capital or digit, after ≥ 8 chars. */
function titleEnd(s: string): number {
  const re = /([.?!])\s+(?=[\p{Lu}\d])/gu;
  for (const m of s.matchAll(re)) if (m.index! >= 8) return m.index! + (m[1] === "." ? 0 : 1);
  return -1;
}

/** "Journal Name, 12(3), 44–59." → "Journal Name". Drops "In …" book editors, volume, pages and trailing links. */
function venueFrom(rest: string, stopAtPeriod = true): string | undefined {
  // Quoted-title styles (IEEE, MLA) abbreviate venues with periods ("Proc. Natl. Acad. Sci."), so only APA stops at ". ".
  const stops = stopAtPeriod ? /,\s*(?=\d|vol\b|pp\b|Article\b)|\s*\(\d|\.\s|\bhttps?:|\bdoi:/i : /,\s*(?=\d|vol\b|no\b|pp\b|Article\b)|\s*\(\d|\bhttps?:|\bdoi:/i;
  const v = rest
    .replace(/^\s*[.,]\s*/, "")
    .replace(/^In\s+/i, "")
    .split(stops)[0]
    .replace(/[.,\s]+$/, "")
    .trim();
  return v && v.length > 2 ? v : undefined;
}

export function parseReference(rawInput: string): ReferenceInput {
  const raw = rawInput.replace(/\s+/g, " ").trim();
  const text = raw.replace(/^(?:\[\d+\]|\d{1,3}[.)])\s+/, ""); // "1. " / "[3] " list numbering
  const doi = normalizeDoi(text);
  const arxivId = /arxiv/i.test(text) ? arxivIdFromString(text.match(/arxiv[^\s,;]*\s*[:/.]?\s*\d{4}\.\d{4,5}/i)?.[0]) : undefined;
  const url = text.match(/https?:\/\/(?!(?:dx\.)?doi\.org)[^\s,;]+/i)?.[0]?.replace(/[.)]+$/, "");
  const body = text.replace(/https?:\/\/\S+/gi, " ").replace(/\bdoi:\s*\S+/gi, " ").replace(/\s+/g, " ").trim();

  const out: ReferenceInput = { raw: rawInput, doi: doi ?? (arxivId ? arxivDoi(arxivId) : undefined), url };
  out.etAl = /\bet al\b/i.test(body);

  const quoted = body.match(/[“"]([^”"]{8,})[”"]/);
  const apaYear = body.match(/\((\d{4})[a-z]?(?:,[^)]*)?\)/);
  const nd = /\(n\.\s?d\.\)/i.test(body);

  if (apaYear && apaYear.index! > 0) {
    // APA / Harvard: Authors (Year). Title. Venue, vol(issue), pages.
    out.year = Number(apaYear[1]);
    out.authors = parseAuthors(body.slice(0, apaYear.index));
    const after = body.slice(apaYear.index! + apaYear[0].length).replace(/^[\s.,:]+/, "");
    const harvard = after.match(/^[‘']([\s\S]{8,}?)[’']\s*[,.]\s/); // Harvard: 'Title', Venue
    if (quoted && after.includes(quoted[0])) {
      out.title = cleanTitle(quoted[1]);
      out.venue = venueFrom(after.slice(after.indexOf(quoted[0]) + quoted[0].length), false);
    } else if (harvard) {
      out.title = cleanTitle(harvard[1]);
      out.venue = venueFrom(after.slice(harvard[0].length), false);
    } else {
      const end = titleEnd(after);
      out.title = cleanTitle(end > 0 ? after.slice(0, end) : after);
      if (end > 0) out.venue = venueFrom(after.slice(end + 1));
    }
  } else if (quoted) {
    // MLA / Chicago / IEEE: Authors. "Title." Venue, …, Year.
    out.title = cleanTitle(quoted[1]);
    out.authors = parseAuthors(body.slice(0, quoted.index).replace(/[.,\s]+$/, ""));
    const after = body.slice(quoted.index! + quoted[0].length);
    out.venue = venueFrom(after, false);
    const years = [...after.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
    out.year = years.find((y) => y <= new Date().getFullYear() + 1);
  } else {
    // Unknown format: first segment = authors, longest remaining sentence = title.
    const parts = body.split(/\.\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      out.authors = parseAuthors(parts[0]);
      out.title = cleanTitle(parts.slice(1).sort((a, b) => b.length - a.length)[0]);
    }
    if (!nd) out.year = [...body.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0])).find((y) => y <= new Date().getFullYear() + 1);
  }
  if (out.authors && !out.authors.length) delete out.authors;
  if (!out.title) delete out.title;
  return out;
}
