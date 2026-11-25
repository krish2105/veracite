/**
 * Import an existing library (K28): BibTeX (.bib) and RIS (.ris) files as Zotero, Mendeley, EndNote,
 * Google Scholar and publishers export them. Hand-written, pure, unit-tested in bibfile.test.ts.
 *
 * Parsing only reads what the student's file CLAIMS. Every entry is then turned into one reference line
 * and checked by the code-only Verifier (the X-ray); only records found in the registries can be added,
 * and the saved record comes from the registry, never from the file.
 */
import type { Author } from "@/lib/types";
import { normalizeDoi } from "@/lib/registries/normalize";

export interface ImportedEntry {
  key?: string;
  /** BibTeX entry type (lower case, e.g. "article") or RIS TY code (e.g. "JOUR"). */
  type?: string;
  title?: string;
  authors: Author[];
  year?: number;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
}

export interface ParsedLibrary {
  format: "bibtex" | "ris" | "unknown";
  /** Entries with a title or a DOI: something the Verifier can check. */
  entries: ImportedEntry[];
  /** Entries found but left out because they had neither a title nor a DOI. */
  skipped: number;
}

// ---------------------------------------------------------------- shared helpers

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const dashes = (s: string) => s.replace(/\s*-{1,3}\s*/g, "–");
const yearOf = (s: string | undefined) => {
  const m = s?.match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : undefined;
};
function doiOf(s: string | undefined): string | undefined {
  if (!s) return undefined;
  try {
    return normalizeDoi(s.replace(/\\_/g, "_").replace(/[{}]/g, ""));
  } catch {
    return undefined; // a malformed %-escape in a pasted DOI
  }
}
const urlOf = (s: string | undefined) => (s ? squash(s.replace(/\\([_%&#$])/g, "$1").replace(/[{}]/g, "")) || undefined : undefined);

/** "Family, Given" · "Given Family" · one word. */
function nameFromText(raw: string): Author | undefined {
  const s = squash(raw);
  if (!s || /^others$/i.test(s)) return undefined;
  if (s.includes(",")) {
    const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
    const family = parts[0];
    const given = parts.length > 1 ? parts[parts.length - 1] : undefined; // "von Last, Jr, First": Jr is dropped
    return given ? { family, given } : { family };
  }
  const words = s.split(" ");
  return words.length === 1 ? { family: s } : { family: words[words.length - 1], given: words.slice(0, -1).join(" ") };
}

// ---------------------------------------------------------------- LaTeX → plain text

const ACCENT: Record<string, string> = {
  '"': "̈", "'": "́", "`": "̀", "^": "̂", "~": "̃", "=": "̄", ".": "̇",
  u: "̆", v: "̌", H: "̋", c: "̧", k: "̨", r: "̊", d: "̣", b: "̱",
};
const LETTER: Record<string, string> = { ss: "ß", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", aa: "å", AA: "Å", o: "ø", O: "Ø", l: "ł", L: "Ł", i: "ı", j: "ȷ" };
const base = (b: string) => (b === "\\i" ? "i" : b === "\\j" ? "j" : b);

/** Turns BibTeX/LaTeX markup into plain Unicode text: accents, escapes, dashes, braces. */
export function cleanLatex(input: string): string {
  let s = input;
  // \"o  \"{o}  {\"o}  \'{\i}  — symbol accents
  s = s.replace(/\\(["'`^~=.])\s*(?:\{\s*(\\[ij](?![A-Za-z])|[A-Za-z])\s*\}|(\\[ij](?![A-Za-z])|[A-Za-z]))/g, (_, a: string, b1?: string, b2?: string) => base((b1 ?? b2)!) + ACCENT[a]);
  // \c{c}  \v s  \H{o}  — letter accents need braces or a space
  s = s.replace(/\\([uvHckrdb])(?:\s*\{\s*(\\[ij](?![A-Za-z])|[A-Za-z])\s*\}|\s+(\\[ij](?![A-Za-z])|[A-Za-z]))/g, (_, a: string, b1?: string, b2?: string) => base((b1 ?? b2)!) + ACCENT[a]);
  // \ss  \o  \i  \ae — letters
  s = s.replace(/\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)(?![A-Za-z])(?:\{\}| (?=[A-Za-z]))?/g, (_, l: string) => LETTER[l]);
  // \& \% \$ \# \_ and escaped braces (kept through the brace removal below)
  s = s.replace(/\\([&%$#_])/g, "$1").replace(/\\\{/g, "\u0001").replace(/\\\}/g, "\u0002");
  // \textit{x}, \emph{x}, \url{x}…: keep the content, drop the command
  s = s.replace(/\\[A-Za-z]+\*?\s*/g, "");
  s = s.replace(/---/g, "—").replace(/--/g, "–").replace(/~/g, " ").replace(/[{}]/g, "");
  return squash(s.replace(/\u0001/g, "{").replace(/\u0002/g, "}").normalize("NFC"));
}

// ---------------------------------------------------------------- BibTeX

const SKIP = new Set(["comment", "string", "preamble"]);

/** Index of the brace that closes the one opened just before `from`, or -1 when it never closes. */
function closingBrace(s: string, from: number, close: string): number {
  let depth = 1;
  for (let i = from; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") { i++; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0 && close === "}") return i; }
    else if (ch === ")" && close === ")" && depth === 1) return i;
  }
  return -1;
}

/** Field values: {braced}, "quoted" or bare (numbers, month macros), joined with #. */
function readFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  const ws = () => { while (i < body.length && /[\s,]/.test(body[i])) i++; };
  while (i < body.length) {
    ws();
    const name = /^[A-Za-z][\w:.+-]*/.exec(body.slice(i))?.[0];
    if (!name) break;
    i += name.length;
    while (/\s/.test(body[i] ?? "")) i++;
    if (body[i] !== "=") break;
    i++;
    const parts: string[] = [];
    for (;;) {
      while (/\s/.test(body[i] ?? "")) i++;
      if (body[i] === "{") {
        const end = closingBrace(body, i + 1, "}");
        if (end < 0) return fields;
        parts.push(body.slice(i + 1, end));
        i = end + 1;
      } else if (body[i] === '"') {
        let depth = 0;
        let j = i + 1;
        for (; j < body.length; j++) {
          if (body[j] === "\\") { j++; continue; }
          if (body[j] === "{") depth++;
          else if (body[j] === "}") depth--;
          else if (body[j] === '"' && depth === 0) break;
        }
        parts.push(body.slice(i + 1, j));
        i = j + 1;
      } else {
        const bare = /^[^,#}\s]+/.exec(body.slice(i))?.[0] ?? "";
        parts.push(bare);
        i += bare.length;
      }
      while (/\s/.test(body[i] ?? "")) i++;
      if (body[i] === "#") { i++; continue; }
      break;
    }
    fields[name.toLowerCase()] = parts.join("");
  }
  return fields;
}

/** Splits "A and B and {C and D}" at top-level " and ", leaving braced groups whole. */
function splitAuthors(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && /\s/.test(ch)) {
      const m = /^\s+and\s+/i.exec(raw.slice(i));
      if (m) { out.push(raw.slice(start, i)); i += m[0].length - 1; start = i + 1; }
    }
  }
  out.push(raw.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

function bibAuthor(raw: string): Author | undefined {
  // {World Health Organization}: one braced group is a corporate author, kept whole.
  if (raw.startsWith("{") && closingBrace(raw, 1, "}") === raw.length - 1) return { family: cleanLatex(raw.slice(1, -1)) };
  // Split on top-level commas before cleaning, so "Garc\'{i}a, Mar{\'\i}a" keeps its parts.
  let depth = 0;
  const parts: string[] = [""];
  for (const ch of raw) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) parts.push("");
    else parts[parts.length - 1] += ch;
  }
  return nameFromText(parts.map(cleanLatex).join(", "));
}

export function parseBibtex(text: string): ImportedEntry[] {
  const out: ImportedEntry[] = [];
  let i = 0;
  while ((i = text.indexOf("@", i)) !== -1) {
    const head = /^@\s*([A-Za-z]+)\s*([{(])/.exec(text.slice(i, i + 80));
    if (!head) { i++; continue; }
    const type = head[1].toLowerCase();
    const bodyStart = i + head[0].length;
    const end = closingBrace(text, bodyStart, head[2] === "{" ? "}" : ")");
    if (end < 0) { i = bodyStart; continue; } // never closes: look for the next entry inside it
    i = end + 1;
    if (SKIP.has(type)) continue;
    const body = text.slice(bodyStart, end);
    const comma = body.indexOf(",");
    const key = (comma < 0 ? body : body.slice(0, comma)).trim();
    const f = readFields(comma < 0 ? "" : body.slice(comma + 1));
    const eprint = f.eprint && /arxiv/i.test(`${f.archiveprefix ?? ""} ${f.eprinttype ?? ""}`) ? `10.48550/arXiv.${f.eprint.trim()}` : undefined;
    const authors = splitAuthors(f.author ?? f.editor ?? "").map(bibAuthor).filter((a): a is Author => !!a && !!a.family);
    const venue = f.journal ?? f.journaltitle ?? f.booktitle ?? (type === "book" ? f.publisher : undefined);
    const entry: ImportedEntry = { key: key || undefined, type, authors };
    if (f.title) entry.title = cleanLatex(f.title);
    const year = yearOf(f.year) ?? yearOf(f.date);
    if (year) entry.year = year;
    if (venue) entry.venue = cleanLatex(venue);
    if (f.volume) entry.volume = cleanLatex(f.volume);
    if (f.number ?? f.issue) entry.issue = cleanLatex((f.number ?? f.issue)!);
    if (f.pages) entry.pages = dashes(cleanLatex(f.pages.replace(/--/g, "-")));
    const doi = doiOf(f.doi) ?? doiOf(eprint);
    if (doi) entry.doi = doi;
    const url = urlOf(f.url);
    if (url) entry.url = url;
    out.push(entry);
  }
  return out;
}

// ---------------------------------------------------------------- RIS

const RIS_LINE = /^([A-Z][A-Z0-9])\s+-\s?(.*)$/;
const VENUE_TAGS = ["JF", "T2", "JO", "JA", "J2", "BT"];

export function parseRis(text: string): ImportedEntry[] {
  const out: ImportedEntry[] = [];
  let rec: Record<string, string[]> | undefined;
  let last = "";
  const finish = () => {
    if (!rec) return;
    const one = (...tags: string[]) => tags.map((t) => rec![t]?.[0]?.trim()).find(Boolean);
    const entry: ImportedEntry = {
      type: one("TY"),
      authors: [...(rec.AU ?? []), ...(rec.A1 ?? [])].map(nameFromText).filter((a): a is Author => !!a),
    };
    const title = one("TI", "T1");
    if (title) entry.title = squash(title);
    const year = yearOf(one("PY")) ?? yearOf(one("Y1")) ?? yearOf(one("DA"));
    if (year) entry.year = year;
    const venue = one(...VENUE_TAGS);
    if (venue) entry.venue = squash(venue);
    const vol = one("VL");
    if (vol) entry.volume = vol;
    const iss = one("IS");
    if (iss) entry.issue = iss;
    const sp = one("SP");
    const ep = one("EP");
    if (sp) entry.pages = ep && ep !== sp ? `${sp}–${ep}` : dashes(sp);
    const doi = doiOf(one("DO"));
    if (doi) entry.doi = doi;
    const url = urlOf(one("UR"));
    if (url) entry.url = url;
    out.push(entry);
    rec = undefined;
  };
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const m = RIS_LINE.exec(line);
    if (!m) {
      // A wrapped long value continues the previous tag.
      if (rec && last && line.trim()) { const arr = rec[last]; arr[arr.length - 1] += ` ${line.trim()}`; }
      continue;
    }
    const [, tag, value] = m;
    if (tag === "TY") { finish(); rec = {}; }
    if (tag === "ER") { finish(); last = ""; continue; }
    if (!rec) continue;
    (rec[tag] ??= []).push(value.trim());
    last = tag;
  }
  finish(); // a file that ends without ER
  return out;
}

// ---------------------------------------------------------------- detection + output

export function parseLibraryFile(text: string): ParsedLibrary {
  const format = /^\s*TY\s+-/m.test(text) ? "ris" : /@\s*[A-Za-z]+\s*[{(]/.test(text) ? "bibtex" : "unknown";
  if (format === "unknown") return { format, entries: [], skipped: 0 };
  const all = format === "ris" ? parseRis(text) : parseBibtex(text);
  const entries = all.filter((e) => e.title || e.doi);
  return { format, entries, skipped: all.length - entries.length };
}

function initials(given: string): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.split("-").map((p) => (/^\p{L}\.$/u.test(p) ? p : `${[...p][0]}.`)).join("-"))
    .join(" ");
}

function apaAuthors(authors: Author[]): string {
  const names = authors.map((a) => (a.given ? `${a.family}, ${initials(a.given)}` : a.family));
  if (names.length <= 1) return names[0] ?? "";
  if (names.length > 20) return `${names.slice(0, 19).join(", ")}, … ${names[names.length - 1]}`;
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

const endWith = (s: string, mark = ".") => (/[.?!]$/.test(s) ? s : `${s}${mark}`);

/**
 * One APA-style line per entry, so the Verifier's parser can read authors, year, title and DOI.
 * This is the student's own claim, rewritten in one format; it is checked, never trusted.
 */
export function toReferenceLine(e: Pick<ImportedEntry, "authors"> & Partial<ImportedEntry>): string {
  const year = `(${e.year ?? "n.d."}).`;
  const title = e.title ? endWith(squash(e.title)) : "";
  const parts: string[] = [];
  const authors = apaAuthors(e.authors);
  if (authors) parts.push(endWith(squash(authors)), year, title);
  else parts.push(title, year);
  if (e.venue) {
    let v = squash(e.venue);
    if (e.volume) v += `, ${e.volume}`;
    if (e.issue) v += `(${e.issue})`;
    if (e.pages) v += `, ${e.pages}`;
    parts.push(endWith(v));
  }
  const link = e.doi ? `https://doi.org/${e.doi}` : e.url;
  if (link) parts.push(link);
  return squash(parts.filter(Boolean).join(" "));
}
