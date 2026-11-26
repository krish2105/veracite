/**
 * Duplicates in a pasted list (Phase 2, case 5). Two lines are the same paper when the registries resolved them to
 * the same record: the same DOI, or, with no DOI, the same normalised title, first author and year. The format the
 * student typed (APA, Vancouver, with or without a DOI) does not matter, because the key comes from the record.
 * Pure code; nothing is merged until the student says so.
 */
import type { Verification } from "@/lib/types";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** A key for "which paper is this", or undefined when no registry record stands behind the line. */
export function dedupeKey(v: Verification | undefined): string | undefined {
  const m = v?.matched;
  if (!v || !m || v.status === "chimera" || v.status === "notfound") return undefined;
  if (m.doi) return `doi:${m.doi.toLowerCase()}`;
  return `rec:${norm(m.title)}|${norm(m.authors[0]?.family ?? "")}|${m.year ?? ""}`;
}

/** line number → the earlier line it duplicates. */
export function findDuplicates(lines: { n: number; key?: string }[]): Record<number, number> {
  const first = new Map<string, number>();
  const out: Record<number, number> = {};
  for (const l of [...lines].sort((a, b) => a.n - b.n)) {
    if (!l.key) continue;
    const seen = first.get(l.key);
    if (seen === undefined) first.set(l.key, l.n);
    else out[l.n] = seen;
  }
  return out;
}
