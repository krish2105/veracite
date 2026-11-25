/**
 * Public verify API (K13): the request parser and the small, stable answer shape. Pure, unit-tested.
 * Meant for other tools and AI assistants: "check before you cite". Code only, no AI.
 */
import { normalizeDoi } from "@/lib/registries/normalize";
import type { RefStatus, Verification } from "@/lib/types";

const MAX_REF = 2000;
const LABEL: Record<RefStatus, string> = { verified: "Verified", partial: "Partial", mismatch: "Mismatch", chimera: "Chimera", retracted: "Retracted", notfound: "Not found" };

export type Echo = { doi?: string; ref?: string };
export type Parsed = { ok: true; input: string; echo: Echo } | { ok: false; error: string };

export function parseQuery(q: URLSearchParams): Parsed {
  const doiRaw = q.get("doi")?.trim();
  const ref = q.get("ref")?.trim();
  if (doiRaw) {
    let doi: string | undefined;
    try {
      doi = normalizeDoi(doiRaw);
    } catch {
      doi = undefined;
    }
    return doi ? { ok: true, input: `https://doi.org/${doi}`, echo: { doi } } : { ok: false, error: "That is not a DOI. Example: ?doi=10.1038/nature14539" };
  }
  if (ref) {
    if (ref.length > MAX_REF) return { ok: false, error: `A reference can be at most ${MAX_REF} characters.` };
    if (ref.length < 6) return { ok: false, error: "Send a full reference in ?ref= or a DOI in ?doi=." };
    return { ok: true, input: ref, echo: { ref } };
  }
  return { ok: false, error: "Add ?doi=10.xxxx/… or ?ref=<a full reference>." };
}

export interface PublicVerdict {
  ok: true;
  api: "veracite/v1";
  input: Echo;
  status: RefStatus;
  label: string;
  /** A real registry record matches what was cited (not retracted, not stitched together). */
  exists: boolean;
  /** Two registries agree on title, first author and year: safe to cite as written. */
  verified: boolean;
  retracted: boolean;
  retraction: { noticeDoi?: string; date?: string } | null;
  /** The registry's own record, never the cited text. Null when nothing real matches. */
  record: { title: string; authors: string[]; year?: number; venue?: string; doi?: string; url?: string } | null;
  registries: string[];
  reasons: string[];
  checkedAt: string;
  ms: number;
  note: string;
}

export function publicVerdict(input: Echo, v: Verification): PublicVerdict {
  const retraction = v.updates.find((u) => u.kind === "retraction" || u.kind === "withdrawal");
  const real = !!v.matched && (v.status === "verified" || v.status === "partial" || v.status === "mismatch");
  const m = v.matched;
  return {
    ok: true,
    api: "veracite/v1",
    input,
    status: v.status,
    label: LABEL[v.status],
    exists: real,
    verified: v.status === "verified",
    retracted: v.status === "retracted",
    retraction: v.status === "retracted" ? { noticeDoi: retraction?.noticeDoi, date: retraction?.date } : null,
    record: real && m ? { title: m.title, authors: m.authors.map((a) => (a.given ? `${a.family}, ${a.given}` : a.family)), year: m.year, venue: m.venue, doi: m.doi, url: m.url } : null,
    registries: v.registries,
    reasons: v.reasons,
    checkedAt: v.checkedAt,
    ms: v.ms,
    note: "Checked by code against Crossref, OpenAlex and arXiv. No AI was used. A web page is never Verified.",
  };
}
