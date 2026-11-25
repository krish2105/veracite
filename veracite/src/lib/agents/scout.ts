/**
 * Scout (K09, code only): runs the approved plan's queries against Crossref and OpenAlex, merges duplicates, and
 * sends every candidate through the Verifier. Candidates are registry records; nothing here is written by a model.
 */
import { crossrefSearch, openalexSearch, RegistryError } from "../registries";
import type { RegistryRecord, SearchReceipt, Verification } from "../types";
import { normalizeTitle } from "../verify/text";
import { verifyReference, type RegistryDeps } from "../verify/verify";

export interface Candidate {
  record: RegistryRecord;
  verification: Verification;
  /** How many of the plan's queries found it (a simple, explainable relevance signal). */
  hits: number;
}

export interface ScoutResult {
  candidates: Candidate[];
  searched: SearchReceipt[];
  /** Registries that failed, in plain words. */
  problems: string[];
}

export interface ScoutOptions {
  yearFrom?: number;
  perQuery?: number;
  max?: number;
  deps?: Partial<RegistryDeps> & { crossrefSearch?: typeof crossrefSearch; openalexSearch?: typeof openalexSearch };
}

const key = (r: RegistryRecord) => r.doi ?? `t:${normalizeTitle(r.title)}`;

/** Builds the reference text the Verifier checks, from the registry record itself. */
function asReference(r: RegistryRecord): string {
  const who = r.authors.slice(0, 6).map((a) => (a.given ? `${a.family}, ${a.given[0]}.` : a.family)).join(", ");
  return `${who} (${r.year ?? "n.d."}). ${r.title}. ${r.venue ?? ""}${r.doi ? ` https://doi.org/${r.doi}` : ""}`;
}

export async function scout(queries: string[], opts: ScoutOptions = {}): Promise<ScoutResult> {
  const cr = opts.deps?.crossrefSearch ?? crossrefSearch;
  const oa = opts.deps?.openalexSearch ?? openalexSearch;
  const perQuery = opts.perQuery ?? 6;
  const searched: SearchReceipt[] = [];
  const problems = new Set<string>();
  const pool = new Map<string, { record: RegistryRecord; hits: number }>();

  for (const q of queries.slice(0, 4)) {
    const results = await Promise.allSettled([cr(q, { rows: perQuery, fromYear: opts.yearFrom }), oa(q, { perPage: perQuery, fromYear: opts.yearFrom })]);
    for (const r of results) {
      if (r.status === "rejected") {
        const e = r.reason;
        problems.add(e instanceof RegistryError ? `${e.registry === "crossref" ? "Crossref" : "OpenAlex"} ${e.kind === "rate_limited" ? "is rate-limiting us" : "did not respond"}` : "A registry did not respond");
        continue;
      }
      searched.push(r.value.receipt);
      for (const rec of r.value.data) {
        if (!rec.title || rec.noticeFor) continue;
        const k = key(rec);
        const seen = pool.get(k);
        if (seen) seen.hits++;
        else pool.set(k, { record: rec, hits: 1 });
      }
    }
  }

  const ranked = [...pool.values()].sort((a, b) => b.hits - a.hits || (b.record.citedBy ?? 0) - (a.record.citedBy ?? 0)).slice(0, opts.max ?? 10);
  const candidates: Candidate[] = new Array(ranked.length);
  let next = 0;
  const worker = async () => {
    while (next < ranked.length) {
      const i = next++;
      const { record, hits } = ranked[i];
      const verification = await verifyReference(
        { raw: asReference(record), doi: record.doi, title: record.title, authors: record.authors, year: record.year, venue: record.venue },
        opts.deps as RegistryDeps | undefined,
      );
      candidates[i] = { record: verification.matched ?? record, verification, hits };
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, ranked.length) }, worker));
  return { candidates, searched, problems: [...problems] };
}
