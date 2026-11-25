/**
 * The Verifier (K04): gathers registry evidence for one reference, then hands it to the pure rules.
 * Code only: no model, no prompt. Registry functions are injectable so every flow is testable offline.
 *
 * Calls per reference (cheapest first):
 *   1. a DOI in the reference → lookupDoi (Crossref + OpenAlex, or arXiv + OpenAlex). Usually enough.
 *   2. no DOI, or the DOI points at another title → Crossref query.bibliographic on the raw text,
 *      then OpenAlex/arXiv title search only if Crossref has nothing close (preprints, books).
 *   3. confirm the best search match in a second registry (lookupDoi on its DOI).
 *   4. still nothing: one Crossref author search, to say "these authors are real, this paper is not".
 *   5. a web link and no DOI, and no registry agreement: is the page live or archived? (web.ts, K21)
 */
import {
  arxivSearch,
  crossrefByAuthors,
  crossrefMatchReference,
  lookupDoi,
  openalexSearch,
  RegistryError,
  type DoiLookup,
  type RegistryResult,
} from "../registries";
import { checkWebSource, type WebCheck } from "../../app/api/sources/wayback/check";
import type { ReferenceInput, RegistryRecord, Verification } from "../types";
import { parseReference } from "./parse";
import { decide, rankCandidates, titleScoreFor, type Evidence } from "./rules";
import { T } from "./text";
import { applyWebCheck, withDeadline } from "./web";

export interface RegistryDeps {
  lookupDoi: (doi: string) => Promise<DoiLookup>;
  crossrefMatchReference: (text: string, rows?: number) => Promise<RegistryResult<RegistryRecord[]>>;
  openalexSearch: (q: string, opts?: { titleOnly?: boolean; perPage?: number }) => Promise<RegistryResult<RegistryRecord[]>>;
  arxivSearch: (title: string, max?: number) => Promise<RegistryResult<RegistryRecord[]>>;
  crossrefByAuthors: (surnames: string[], rows?: number) => Promise<RegistryResult<RegistryRecord[]>>;
  /** Live + Wayback check for a web reference. Optional, so offline tests need no network. */
  webCheck?: (url: string) => Promise<WebCheck>;
}

const LIVE: RegistryDeps = { lookupDoi, crossrefMatchReference, openalexSearch, arxivSearch, crossrefByAuthors, webCheck: checkWebSource };

/** The web check must never stall a whole bibliography. */
const WEB_DEADLINE_MS = 8_000;

/** Accepts raw text, or a ReferenceInput whose missing fields are filled in by parsing its raw text. */
export function toInput(input: ReferenceInput | string): ReferenceInput {
  if (typeof input === "string") return parseReference(input);
  const parsed = parseReference(input.raw);
  const given = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== ""));
  return { ...parsed, ...given } as ReferenceInput;
}

export async function verifyReference(input: ReferenceInput | string, deps: RegistryDeps = LIVE): Promise<Verification> {
  const ev: Evidence = { input: toInput(input), candidates: [], confirmations: {}, receipts: [], errors: [], startedAt: Date.now() };
  const ref = ev.input;
  const take = (l: DoiLookup) => {
    ev.receipts.push(...l.receipts);
    ev.errors.push(...l.errors);
    return l;
  };
  const safe = async <X>(p: Promise<RegistryResult<X>>, fallback: X, registry: RegistryError["registry"]): Promise<X> => {
    try {
      const r = await p;
      ev.receipts.push(r.receipt);
      return r.data;
    } catch (e) {
      ev.errors.push(e instanceof RegistryError ? e : new RegistryError(registry, "upstream_down", String(e)));
      return fallback;
    }
  };

  // 1. The DOI written in the reference.
  if (ref.doi) ev.claimedDoi = take(await deps.lookupDoi(ref.doi));
  const doiRec = ev.claimedDoi && (ev.claimedDoi.records.crossref ?? ev.claimedDoi.records.arxiv ?? ev.claimedDoi.records.openalex);
  const settledByDoi = !!doiRec && !doiRec.noticeFor && (!ref.title || titleScoreFor(ref, doiRec) >= T.titleSimilar);
  if (settledByDoi) return decide(ev);

  // 2. Text search: Crossref first, then OpenAlex / arXiv if nothing close.
  const cands = (await safe(deps.crossrefMatchReference(ref.raw, 5), [], "crossref")).filter((r) => !r.noticeFor);
  const bestCrossref = Math.max(0, ...cands.map((c) => titleScoreFor(ref, c)));
  if (bestCrossref < T.titleClose && ref.title) {
    cands.push(...(await safe(deps.openalexSearch(ref.title, { titleOnly: true, perPage: 5 }), [], "openalex")));
    if (/arxiv|preprint/i.test(ref.raw)) cands.push(...(await safe(deps.arxivSearch(ref.title, 3), [], "arxiv")));
  }
  ev.candidates = rankCandidates(ref, cands);

  // 3. Confirm the best match in a second registry.
  const best = ev.candidates[0];
  if (best?.doi && titleScoreFor(ref, best) >= T.titleSimilar) ev.confirmations[best.doi] = take(await deps.lookupDoi(best.doi));
  // 4. Nothing matched and no real DOI: are the cited authors real people who wrote a different paper?
  else if (!doiRec && (ref.authors?.length ?? 0) >= 2) ev.authorWorks = await safe(deps.crossrefByAuthors(ref.authors!.map((a) => a.family), 5), [], "crossref");

  const verdict = decide(ev);
  // 5. A web page: the registries do not index it, so look at the link itself.
  if (!deps.webCheck || !ref.url || ref.doi || verdict.status === "verified" || verdict.status === "retracted") return verdict;
  const check = await withDeadline(deps.webCheck(ref.url), WEB_DEADLINE_MS);
  if (!check) return verdict;
  return { ...applyWebCheck(verdict, ref.title, check), ms: Date.now() - ev.startedAt };
}
