/**
 * PDF drop (K37): turn the text of a PDF into something the X-ray can check. Pure, unit-tested.
 * The PDF is read in the student's browser by pdf.js (see readPdfText in pdfread.ts); nothing is uploaded.
 * Extraction is imperfect (two columns, scanned pages), so the result is always shown for the student to
 * edit before anything is checked.
 */
import { normalizeDoi } from "@/lib/registries/normalize";
import { splitBibliography } from "@/lib/verify/split";

export interface TextItem {
  str: string;
  x: number;
  y: number;
}

/** pdf.js text items back into lines: same baseline (±2 pt) = same line; top to bottom, left to right. */
export function linesFromItems(items: TextItem[]): string[] {
  const sorted = items.filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; parts: TextItem[] }[] = [];
  for (const it of sorted) {
    const line = lines.find((l) => Math.abs(l.y - it.y) <= 2);
    if (line) line.parts.push(it);
    else lines.push({ y: it.y, parts: [it] });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((l) => l.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const HEADING = /^[ \t]*(?:\d+\.?[ \t]*)?(references|reference list|bibliography|works cited|literature cited|sources cited)[ \t]*:?[ \t]*$/gim;
const AFTER = /^[ \t]*(?:[A-Z]\.?[ \t]+)?(appendix|appendices|supplementary|supplemental|acknowledg(?:e)?ments?|about the authors?|author contributions)\b/im;

/** The text after the LAST references heading, up to an appendix or acknowledgements. */
export function referenceSection(text: string): string | undefined {
  const all = [...text.matchAll(HEADING)];
  const last = all.at(-1);
  if (!last || last.index === undefined) return undefined;
  let body = text.slice(last.index + last[0].length).replace(/^\s+/, "");
  const stop = AFTER.exec(body);
  if (stop) body = body.slice(0, stop.index);
  body = body.trim();
  return body || undefined;
}

/** Every DOI in the text, once, normalised, in order of appearance. */
export function extractDois(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/10\.\d{4,9}\/[^\s"'<>]+/g)) {
    let d: string | undefined;
    try {
      d = normalizeDoi(m[0]);
    } catch {
      d = undefined;
    }
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
}

/** A DOI link that wrapped onto its own line belongs to the reference above it (when that one has no DOI yet). */
function joinWrappedDois(input: string): string {
  // A DOI cut at a line end ("…/s41598-025-" + "97652-6", or "https://doi.org/" + "10.1038/…") is one DOI.
  const text = input
    .replace(/(10\.\d{4,9}\/\S*[-./_])\n(?=\S)/g, "$1")
    .replace(/((?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*))\n(?=10\.)/gi, "$1");
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const prev = out.length - 1;
    if (prev >= 0 && /^\s*(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)10\./i.test(line) && !/10\.\d{4,9}\//.test(out[prev])) out[prev] += ` ${line.trim()}`;
    else out.push(line);
  }
  return out.join("\n");
}

export interface PdfXrayInput {
  source: "references" | "dois" | "none";
  /** One reference (or DOI) per paragraph, ready for the X-ray box. */
  text: string;
  count: number;
}

export function pdfToXrayInput(text: string): PdfXrayInput {
  const section = referenceSection(text);
  if (section) {
    // Re-join words hyphenated across a line break, then split into references the X-ray's way.
    const refs = splitBibliography(joinWrappedDois(section.replace(/(\p{Ll})-\n(\p{Ll})/gu, "$1$2")), 200);
    if (refs.length) return { source: "references", text: refs.join("\n\n"), count: refs.length };
  }
  const dois = extractDois(text);
  if (dois.length) return { source: "dois", text: dois.join("\n"), count: dois.length };
  return { source: "none", text: "", count: 0 };
}
