/**
 * Save a web page (K45). The problem brief asks for "papers and web sources" in the library. A web page has
 * no registry record, so it can never be Verified: it is saved as Partial, from what the live check and the
 * Wayback Machine found (link, page title, retrieval date, archive copy) plus the author and date the student
 * typed. Nothing here comes from an AI. Pure, unit-tested.
 */
import type { WebCheck } from "../../app/api/sources/wayback/check";
import type { SourceRecord, Verification } from "../types";
import { parseReference } from "./parse";

/** Only a Partial verdict made by a web check, for a page that is live or archived. */
export const canAddWeb = (v: Verification) => v.status === "partial" && !v.matched && !!v.web && (v.web.live || !!v.web.archiveUrl);

export function toWebSource(v: Verification, raw?: string, via: SourceRecord["addedVia"] = "xray"): SourceRecord {
  if (!canAddWeb(v) || !v.web) throw new Error("Only a checked web page can be saved this way.");
  const typed = raw ? parseReference(raw) : undefined;
  const w = v.web;
  return {
    id: `url:${w.url}`,
    title: typed?.title || w.pageTitle || w.url,
    authors: typed?.authors ?? [],
    year: typed?.year,
    type: "web",
    textAvailable: "none",
    url: w.url,
    archivedUrl: w.archiveUrl,
    accessedAt: w.accessedAt,
    verification: v,
    quality: {},
    tags: [],
    collections: [],
    notes: "",
    opened: false,
    addedAt: new Date().toISOString(),
    addedVia: via,
  };
}

/** A bare link checked on the save page: Partial if the page is live or archived, otherwise Not found. */
export function webVerification(check: WebCheck): Verification {
  const ok = check.status === "partial";
  return {
    status: ok ? "partial" : "notfound",
    checks: [],
    registries: [],
    updates: [],
    reasons: [...check.reasons, ...(check.archive.url ? [`Archived copy: ${check.archive.url}`] : []), ...(ok ? [`APA 7 retrieval line: ${check.retrieval}`] : [])],
    searched: [],
    checkedAt: check.accessedAt,
    ms: 0,
    web: ok ? { url: check.url, pageTitle: check.live.ok ? check.live.title : undefined, live: check.live.ok, archiveUrl: check.archive.url, accessedAt: check.accessedAt, retrieval: check.retrieval } : undefined,
  };
}
