/**
 * Split a pasted bibliography into one string per reference (K05). Pure, unit-tested in split.test.ts.
 * Handles numbered lists ("1." / "[1]"), blank-line separated lists, and references that wrap across lines.
 */
export const MAX_REFERENCES = 30;

const NUMBERED = /^\s*(?:\[\d{1,3}\]|\d{1,3}[.)])\s+/;
// A line that starts a new APA/Harvard/MLA reference: "Surname, A." / "Surname, First," / "Organisation. (2024)"
const STARTS_DOI = /^\s*(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?10\.\d{4,9}\//i;
const HEADING = /^(references?|reference list|bibliography|works cited)\s*[:.]?$/i;
const STARTS_REFERENCE = /^\s*(?:[\p{Lu}][\p{L}'’\-]+(?:\s[\p{Lu}][\p{L}'’\-]+)*,\s*(?:[\p{Lu}]\.|[\p{Lu}][\p{L}]+[,.])|[\p{Lu}][\p{L}\s&]{2,60}\.\s*\(\d{4})/u;

export function splitBibliography(text: string, max = MAX_REFERENCES): string[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  let refs: string[];

  if (lines.filter((l) => NUMBERED.test(l)).length >= 2) {
    refs = [];
    for (const l of lines) {
      if (NUMBERED.test(l) || refs.length === 0) refs.push(l);
      else refs[refs.length - 1] += ` ${l}`;
    }
  } else if (/\n\s*\n/.test(text.trim())) {
    refs = text.split(/\n\s*\n/);
  } else {
    refs = [];
    for (const l of lines) {
      if (!l.trim()) continue;
      if (refs.length === 0 || STARTS_REFERENCE.test(l) || STARTS_DOI.test(l)) refs.push(l);
      else refs[refs.length - 1] += ` ${l}`;
    }
  }
  return refs
    .map(clean)
    // A single made-up title or a bare DOI must still be checked, however short.
    .filter((r) => r.length >= 6 && !HEADING.test(r) && (/[\p{L}]{3}/u.test(r) || STARTS_DOI.test(r)))
    .slice(0, max);
}
