/**
 * Write & cite helpers (A14). Pure code: formats APA 7 in-text citations from verified SourceRecords,
 * inserts them at the cursor position without spacing glitches, and extracts cited sources from draft text.
 */
import { checkDraft } from "@/components/app/tabs/draft/check";
import { findCitations } from "@/components/app/tabs/draft/citations";
import type { SourceRecord } from "@/lib/types";

/** Format an APA 7 parenthetical in-text citation from a verified registry record. */
export function inText(source: SourceRecord): string {
  const [first, second] = source.authors;
  const who = !first
    ? source.title
    : source.authors.length === 1
      ? first.family
      : source.authors.length === 2
        ? `${first.family} & ${second.family}`
        : `${first.family} et al.`;
  return `(${who}, ${source.year ?? "n.d."})`;
}

export interface InsertResult {
  text: string;
  cursor: number;
}

/**
 * Insert a formatted citation into `text` at `[selectionStart, selectionEnd]`.
 * Adds a leading space when preceded by non-whitespace (except opening brackets/quotes)
 * and a trailing space when followed immediately by a word character.
 */
export function insertAtCursor(
  text: string,
  selectionStart: number | undefined,
  selectionEnd: number | undefined,
  citation: string,
): InsertResult {
  const rawStart = selectionStart ?? text.length;
  const rawEnd = selectionEnd ?? rawStart;
  const clampedA = Math.max(0, Math.min(text.length, rawStart));
  const clampedB = Math.max(0, Math.min(text.length, rawEnd));
  const start = Math.min(clampedA, clampedB);
  const end = Math.max(clampedA, clampedB);

  const before = text.slice(0, start);
  const after = text.slice(end);
  const leading = before.length > 0 && !/[\s(\[“"‘']$/.test(before) ? " " : "";
  const trailing = after.length > 0 && /^[\p{L}\p{N}]/u.test(after) ? " " : "";
  const inserted = `${leading}${citation}`;

  return {
    text: `${before}${inserted}${trailing}${after}`,
    cursor: start + inserted.length,
  };
}

/** Return unique sources from `sources` that are currently cited in `text`. */
export function citedSources(text: string, sources: SourceRecord[]): SourceRecord[] {
  if (!text.trim() || !sources.length) return [];
  const citedIds = new Set<string>();

  // Primary match via Draft Checker's APA citation matcher.
  const checked = checkDraft(text, sources);
  for (const s of checked.sentences) {
    for (const m of s.matches) {
      if (m.source) citedIds.add(m.source.id);
    }
  }

  // Fallback for exact inserted strings (e.g. authorless works or mid-line fragments).
  const parsed = findCitations(text);
  for (const src of sources) {
    if (citedIds.has(src.id)) continue;
    const tag = inText(src);
    if (text.includes(tag)) {
      citedIds.add(src.id);
      continue;
    }
    if (parsed.length && src.authors.length === 0 && text.toLowerCase().includes(tag.toLowerCase())) {
      citedIds.add(src.id);
    }
  }

  return sources.filter((s) => citedIds.has(s.id));
}
