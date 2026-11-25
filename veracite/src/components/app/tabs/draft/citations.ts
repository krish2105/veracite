/**
 * Find APA 7 in-text citations in a paragraph (K10). Pure code, unit-tested in check.test.ts.
 *   Parenthetical: (Bastani et al., 2025) · (Wang & Fan, 2025, p. 4) · (Kestin, 2025a; Noy & Zhang, 2023)
 *   Narrative:     Bastani et al. (2025) · Wang and Fan (2025) · Kestin (2025)
 */

export interface Citation {
  raw: string;
  /** Surnames written in the citation, in order. */
  families: string[];
  etAl: boolean;
  /** undefined for "n.d." */
  year?: number;
  start: number;
  end: number;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
  citations: Citation[];
}

const NAME = "(?:(?:[Aa]l|[Vv]an(?: der| den)?|[Dd]e(?: la)?|[Vv]on|[Ee]l)[ -])?\\p{Lu}[\\p{L}'’\\-]+";
const YEAR = "(?:\\d{4}[a-z]?|n\\.\\s?d\\.)";
const NARRATIVE = new RegExp(`(${NAME})(?:(\\s+et al\\.)|\\s+(?:and|&)\\s+(${NAME}))?\\s*\\((${YEAR})(?:,\\s*(?:pp?|para)\\.?[^()]*)?\\)`, "gu");
const PARENS = /\(([^()]*(?:\d{4}|n\.\s?d\.)[^()]*)\)/g;
const PART = new RegExp(`^(?:(?:see|see also|e\\.g\\.,?|cf\\.)\\s+)?(.+?),\\s*(${YEAR})(?:\\s*,.*)?$`, "u");

const yearOf = (y: string) => (/^\d/.test(y) ? Number(y.slice(0, 4)) : undefined);

function parseAuthorsPart(s: string): { families: string[]; etAl: boolean } {
  const etAl = /\bet al\.?/.test(s);
  const families = s
    .replace(/\bet al\.?/g, "")
    .split(/\s*(?:,|&|\band\b)\s*/)
    .map((f) => f.trim())
    .filter((f) => /^[\p{Lu}]|^(al|van|de|von|el)\b/u.test(f));
  return { families, etAl };
}

export function findCitations(text: string): Citation[] {
  const out: Citation[] = [];
  const taken: [number, number][] = [];
  for (const m of text.matchAll(NARRATIVE)) {
    // A name inside brackets belongs to a parenthetical citation, handled below.
    const before = text.slice(0, m.index);
    if (before.lastIndexOf("(") > before.lastIndexOf(")")) continue;
    const start = m.index!;
    const end = start + m[0].length;
    out.push({ raw: m[0], families: [m[1], m[3]].filter(Boolean) as string[], etAl: !!m[2], year: yearOf(m[4]), start, end });
    taken.push([start, end]);
  }
  for (const m of text.matchAll(PARENS)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (taken.some(([a, b]) => start < b && end > a)) continue;
    for (const part of m[1].split(";")) {
      const p = part.trim().match(PART);
      if (!p) continue;
      const { families, etAl } = parseAuthorsPart(p[1]);
      if (families.length) out.push({ raw: `(${part.trim()})`, families, etAl, year: yearOf(p[2]), start, end });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

const ABBREVIATION = /(?:\bet al|\be\.g|\bi\.e|\bvs|\bcf|\bp|\bpp|\bpara|\bn|\bd|\bDr|\bFig|\b\p{Lu})$/u;

/** Split into sentences without breaking on "et al.", "p. 4", initials, or anything inside brackets or quotes. */
export function splitSentences(text: string): Sentence[] {
  const cites = findCitations(text);
  const ranges: [number, number][] = [];
  let from = 0;
  let depth = 0;
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (c === "“") quoted = true;
    else if (c === "”") quoted = false;
    else if (c === '"') quoted = !quoted;
    const newline = c === "\n" && text[i + 1] === "\n";
    if (!newline && !(/[.!?]/.test(c) && depth === 0)) continue;
    let end = i + 1;
    if (/["”’]/.test(text[end] ?? "")) {
      quoted = false;
      end++;
    } else if (quoted && !newline) continue;
    if (!newline) {
      if (!/^(\s+(?=[\p{Lu}\d"“(])|\s*$)/u.test(text.slice(end))) continue;
      if (c === "." && ABBREVIATION.test(text.slice(from, i))) continue;
    }
    ranges.push([from, end]);
    from = end;
    quoted = false;
    i = end - 1;
  }
  if (from < text.length) ranges.push([from, text.length]);
  return ranges
    .map(([a, b]) => {
      const raw = text.slice(a, b);
      const start = a + (raw.length - raw.trimStart().length);
      const end = b - (raw.length - raw.trimEnd().length);
      return { text: text.slice(start, end), start, end, citations: cites.filter((c) => c.start >= start && c.start < end) };
    })
    .filter((s) => s.text.length > 1);
}
