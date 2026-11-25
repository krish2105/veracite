/**
 * Registry clients (K03): the ONLY place references come from. Server-side use (route handlers).
 * Keys come from non-NEXT_PUBLIC env vars, so they can never reach the browser bundle.
 *
 *   crossrefByDoi · crossrefMatchReference · crossrefSearch · crossrefByAuthors
 *   openalexByDoi · openalexSearch
 *   arxivById · arxivSearch
 *   lookupDoi: one DOI checked in every registry where it can live, in parallel
 */
import type { RegistryName, RegistryRecord, SearchReceipt } from "../types";
import { arxivById } from "./arxiv";
import { crossrefByDoi } from "./crossref";
import { RegistryError, type RegistryResult } from "./http";
import { isArxivDoi, normalizeDoi } from "./normalize";
import { openalexByDoi } from "./openalex";

export { crossrefByAuthors, crossrefByDoi, crossrefMatchReference, crossrefSearch, parseCrossrefWork } from "./crossref";
export { openalexByDoi, openalexRelated, openalexSearch, parseOpenAlexWork, type CitationDirection } from "./openalex";
export { arxivById, arxivSearch, parseArxivFeed } from "./arxiv";
export { RegistryError, type RegistryResult } from "./http";
export { normalizeDoi, isArxivDoi, arxivIdFromString, stripMarkup } from "./normalize";

export interface DoiLookup {
  doi: string;
  /** null = the registry answered "no such DOI"; missing key = that registry was not asked or failed. */
  records: Partial<Record<RegistryName, RegistryRecord | null>>;
  receipts: SearchReceipt[];
  /** Registries that failed (rate limit, outage). The Verifier must not treat these as "not found". */
  errors: RegistryError[];
}

/**
 * Check a DOI everywhere it can live: Crossref + OpenAlex, or arXiv + OpenAlex for arXiv DOIs.
 * Never throws for a registry failure: failures are reported in `errors` so the caller can say so honestly.
 */
export async function lookupDoi(doiInput: string): Promise<DoiLookup> {
  const doi = normalizeDoi(doiInput) ?? doiInput;
  const calls: [RegistryName, Promise<RegistryResult<RegistryRecord | null>>][] = [
    isArxivDoi(doi) ? ["arxiv", arxivById(doi)] : ["crossref", crossrefByDoi(doi)],
    ["openalex", openalexByDoi(doi)],
  ];
  const settled = await Promise.allSettled(calls.map(([, p]) => p));
  const out: DoiLookup = { doi, records: {}, receipts: [], errors: [] };
  settled.forEach((s, i) => {
    const name = calls[i][0];
    if (s.status === "fulfilled") {
      out.records[name] = s.value.data;
      out.receipts.push(s.value.receipt);
    } else {
      out.errors.push(s.reason instanceof RegistryError ? s.reason : new RegistryError(name, "upstream_down", String(s.reason)));
    }
  });
  return out;
}
