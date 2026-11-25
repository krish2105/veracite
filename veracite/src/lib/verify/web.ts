/**
 * K21: how a web check (Z16) changes a registry verdict. Pure code, no AI.
 *
 * Crossref and OpenAlex do not index web pages, so a cited web page often "matches" an unrelated record.
 * The link may replace that verdict with Partial only when the page exists (live or archived) AND it
 * supports the cited title. A web page is never Verified, and carries no registry record, so it cannot be
 * added to the reference list from here. Verified and Retracted verdicts are never touched.
 */
import type { WebCheck } from "../../app/api/sources/wayback/check";
import type { Verification } from "../types";
import { T, titleSimilarity } from "./text";

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was", "its", "into", "about"]);
const words = (s: string) => s.toLowerCase().normalize("NFKD").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w));

/** "title": the page's own title agrees. "address": only the words in the web address do. */
export function pageSupportsTitle(claimed: string | undefined, check: WebCheck): "title" | "address" | undefined {
  if (!claimed) return undefined;
  const title = check.live.ok ? check.live.title : undefined;
  if (title) {
    // "REST API - Crossref" → also try each part, since sites append their name to titles.
    const parts = [title, ...title.split(/\s+[|\-–—·]\s+/)];
    if (parts.some((p) => titleSimilarity(claimed, p) >= T.titleClose)) return "title";
  }
  let path: string;
  try {
    path = decodeURIComponent(new URL(check.url).pathname);
  } catch {
    return undefined;
  }
  const want = words(claimed);
  const have = new Set(words(path.split("/").filter(Boolean).slice(-2).join(" ")));
  return want.length >= 3 && want.filter((w) => have.has(w)).length / want.length >= 0.8 ? "address" : undefined;
}

export function applyWebCheck(verdict: Verification, claimedTitle: string | undefined, check: WebCheck): Verification {
  const { status } = verdict;
  if (status === "verified" || status === "retracted") return verdict;
  const exists = check.status === "partial";
  const support = exists ? pageSupportsTitle(claimedTitle, check) : undefined;
  // "Stitched together" is a strong finding: only the page's own title can overturn it, not its address.
  const replace = status === "partial" ? false : status === "chimera" ? support === "title" : !!support;
  const linkNotes = [...check.reasons];
  if (check.archive.url) linkNotes.push(`Archived copy: ${check.archive.url}`);
  if (!replace) return { ...verdict, reasons: [...verdict.reasons, "About the link:", ...linkNotes] };
  return {
    ...verdict,
    status: "partial",
    checks: [],
    registries: [],
    matched: undefined,
    parts: undefined,
    updates: [],
    reasons: [
      support === "title" ? "The page at this link has a matching title." : "The words in this web address match the title; the page's own title could not be confirmed.",
      ...linkNotes,
      `APA 7 retrieval line: ${check.retrieval}`,
    ],
    web: { url: check.url, pageTitle: check.live.ok ? check.live.title : undefined, live: check.live.ok, archiveUrl: check.archive.url, accessedAt: check.accessedAt, retrieval: check.retrieval },
  };
}

/** The promise's value, or undefined if it fails or takes longer than `ms`. */
export async function withDeadline<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: number | NodeJS.Timeout | undefined;
  try {
    return await Promise.race([p, new Promise<undefined>((r) => (timer = setTimeout(r, ms, undefined)))]);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
