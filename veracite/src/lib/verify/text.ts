/**
 * Deterministic text comparison for the Verifier (K04). Pure functions, unit-tested in text.test.ts.
 * Every number here is computed by code and is the same on every run. No model is involved.
 */
import type { Author, FieldMatch } from "../types";

/** Thresholds (docs/03 §3). Change only with a re-run of the golden set. */
export const T = {
  titleExact: 0.97,
  titleClose: 0.9, // ≥ this counts as the same title (Verified needs it)
  titleSimilar: 0.75, // ≥ this is "probably the same work, worded differently" (Mismatch, not Not found)
  venueClose: 0.6, // venues are abbreviated in many ways; below this they are clearly different journals
} as const;

const STOP = new Set(["a", "an", "the", "of", "in", "on", "for", "and", "to", "with", "from", "by", "at", "as", "is", "are", "its", "into", "via", "vs", "versus", "or", "do", "does"]);

/** Lower-case, strip accents and punctuation, collapse spaces. "Kabakcı" → "kabakci". */
export function normalizeText(s: string | undefined): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/ß/g, "ss") // "Seßler" = "Sessler"
    .replace(/[’'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Drops publisher prefixes such as "RETRACTED ARTICLE:" before comparing titles. */
export function normalizeTitle(t: string | undefined): string {
  return normalizeText((t ?? "").replace(/^\s*retracted( article)?\s*:\s*/i, ""));
}

const contentTokens = (s: string) => new Set(s.split(" ").filter((w) => w && !STOP.has(w)));

/** Sørensen–Dice over content-word sets. */
export function tokenDice(a: string, b: string): number {
  const A = contentTokens(a);
  const B = contentTokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return (2 * inter) / (A.size + B.size);
}

/** Sørensen–Dice over character bigrams (tolerates typos, hyphenation, British/US spelling). */
export function bigramDice(a: string, b: string): number {
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      if (!g.includes(" ")) m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = grams(a);
  const B = grams(b);
  let total = 0;
  let inter = 0;
  for (const n of A.values()) total += n;
  for (const n of B.values()) total += n;
  for (const [g, n] of A) inter += Math.min(n, B.get(g) ?? 0);
  return total ? (2 * inter) / total : 0;
}

/** The part before a subtitle separator, if it is a real title on its own (≥ 3 content words). */
function mainTitle(raw: string): string | undefined {
  const cut = raw.split(/\s*[:?]\s+|\s+[-–—]\s+/)[0];
  const n = normalizeTitle(cut);
  return contentTokens(n).size >= 3 && n !== normalizeTitle(raw) ? n : undefined;
}

/**
 * Title similarity, 0–1. The max of word-set and character similarity, with a subtitle allowance: a reference
 * that drops (or adds) a subtitle still scores up to 0.95 ("close"), never 1 ("exact").
 */
export function titleSimilarity(claimed: string | undefined, found: string | undefined): number {
  const a = normalizeTitle(claimed);
  const b = normalizeTitle(found);
  if (!a || !b) return 0;
  if (a === b) return 1;
  let s = Math.max(tokenDice(a, b), bigramDice(a, b));
  const ma = mainTitle(claimed ?? "");
  const mb = mainTitle(found ?? "");
  const pairs: [string, string][] = [];
  if (mb) pairs.push([a, mb]);
  if (ma) pairs.push([ma, b]);
  if (ma && mb) pairs.push([ma, mb]);
  for (const [x, y] of pairs) s = Math.max(s, Math.min(0.95, Math.max(tokenDice(x, y), bigramDice(x, y))));
  return Math.round(s * 1000) / 1000;
}

export function titleMatch(score: number, claimedPresent: boolean): FieldMatch {
  if (!claimedPresent) return "missing";
  if (score >= T.titleExact) return "exact";
  if (score >= T.titleClose) return "close";
  return "different";
}

/** Surnames compare by tokens, so "Al Suwaidi" matches "Suwaidi" and "García-Pérez" matches "Garcia Perez". */
export function sameSurname(a: string | undefined, b: string | undefined): boolean {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tx = x.split(" ").filter((t) => t.length > 1);
  const ty = y.split(" ").filter((t) => t.length > 1);
  if (!tx.length || !ty.length) return false;
  return tx[tx.length - 1] === ty[ty.length - 1] || (tx.length > 1 && ty.includes(tx[tx.length - 1])) || (ty.length > 1 && tx.includes(ty[ty.length - 1]));
}

export interface AuthorCheck {
  match: FieldMatch;
  /** Is the cited first author the paper's first author? */
  firstOk: boolean;
  /** Share of cited authors who really are authors of the paper (0–1). */
  overlap: number;
  /** Cited authors who are not on the paper. */
  strangers: string[];
}

export function checkAuthors(claimed: Author[] | undefined, found: Author[], etAl = false): AuthorCheck {
  if (!claimed?.length) return { match: "missing", firstOk: false, overlap: 0, strangers: [] };
  // Crossref sometimes swaps given and family names (family "Jing", given "Zhang"): a full given name counts too.
  const isAuthor = (surname: string, f: Author | undefined) => !!f && (sameSurname(surname, f.family) || (!!f.given && !f.given.includes(".") && sameSurname(surname, f.given)));
  const on = (c: Author) => found.some((f) => isAuthor(c.family, f));
  const strangers = claimed.filter((c) => !on(c)).map((c) => c.family);
  const overlap = (claimed.length - strangers.length) / claimed.length;
  const firstOk = isAuthor(claimed[0].family, found[0]);
  // APA lists up to 20 authors, so a full list should not be missing many. "et al." excuses the rest.
  const complete = etAl || claimed.length >= Math.min(found.length, 20);
  let match: FieldMatch = "different";
  if (firstOk && overlap === 1 && complete) match = "exact";
  else if (firstOk && overlap >= 0.5) match = "close";
  return { match, firstOk, overlap: Math.round(overlap * 100) / 100, strangers };
}

export function checkYear(claimed: number | undefined, found: number | undefined): FieldMatch {
  if (!claimed || !found) return "missing";
  if (claimed === found) return "exact";
  // Online-first vs print issue years commonly differ by one.
  if (Math.abs(claimed - found) === 1) return "close";
  return "different";
}

/** Venue similarity, allowing acronyms (PNAS) and abbreviations (Sci. Rep.). */
export function venueSimilarity(claimed: string | undefined, found: string | undefined): number {
  const a = normalizeText(claimed).replace(/^the /, "");
  const b = normalizeText(found).replace(/^the /, "");
  if (!a || !b) return 0;
  if (a === b) return 1;
  const words = b.split(" ").filter((w) => !STOP.has(w));
  if (a.replace(/ /g, "") === words.map((w) => w[0]).join("")) return 1; // acronym
  // ISO-4 style abbreviations: every abbreviated word is an in-order subsequence of a full word ("natl" → "national").
  const ca = a.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  if (ca.length && ca.every((t) => words.some((w) => w[0] === t[0] && isSubsequence(t, w)))) return 0.9;
  return Math.round(Math.max(tokenDice(a, b), bigramDice(a, b)) * 1000) / 1000;
}

function isSubsequence(short: string, long: string): boolean {
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
}

export function venueMatch(score: number, bothPresent: boolean): FieldMatch {
  if (!bothPresent) return "missing";
  if (score >= 0.95) return "exact";
  if (score >= T.venueClose) return "close";
  return "different";
}

export function authorsLabel(authors: Author[], max = 3): string {
  const names = authors.slice(0, max).map((a) => a.family);
  return authors.length > max ? `${names.join(", ")} et al.` : names.join(", ");
}
