/**
 * The Verifier's decision rules (K04). PURE: registry evidence in, Verification out. No network, no model,
 * no prompt to inject. Every branch is unit-tested in rules.test.ts.
 *
 *   retracted  a retraction/withdrawal exists for the work the reference points to (overrides everything)
 *   chimera    real parts from different places: the DOI belongs to another paper, or the title is real but
 *              none of the cited authors wrote it (SP Jain policy §h(ix))
 *   mismatch   the work is real, but a field is wrong (year, DOI, journal, part of the author list, title wording)
 *   partial    every field matches, but fewer than two registries confirm it (or a registry did not answer)
 *   verified   title, first author, year (and DOI, journal if given) match, confirmed by two registries
 *   notfound   nothing credible matches; the receipts show exactly what was searched
 */
import type { DoiLookup } from "../registries";
import type { RegistryError } from "../registries/http";
import type { ChimeraPart, FieldCheck, RefStatus, ReferenceInput, RegistryName, RegistryRecord, SearchReceipt, Update, Verification } from "../types";
import { authorsLabel, checkAuthors, checkYear, normalizeText, sameSurname, T, titleMatch, titleSimilarity, venueMatch, venueSimilarity, type AuthorCheck } from "./text";

export interface Evidence {
  input: ReferenceInput;
  /** Lookup of the DOI written in the reference (absent when it gave none). */
  claimedDoi?: DoiLookup;
  /** Text-search candidates, best first (notices are ignored here even if present). */
  candidates: RegistryRecord[];
  /** Second-registry lookups for search candidates, keyed by DOI. */
  confirmations: Record<string, DoiLookup>;
  /** Works by the cited authors (only fetched when nothing else matched), to spot real authors on an invented paper. */
  authorWorks?: RegistryRecord[];
  receipts: SearchReceipt[];
  errors: RegistryError[];
  startedAt: number;
}

const REGISTRY_NAME: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const sameDoi = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function recordsOf(l?: DoiLookup): RegistryRecord[] {
  return l ? (Object.values(l.records).filter(Boolean) as RegistryRecord[]) : [];
}
function primaryOf(l?: DoiLookup): RegistryRecord | undefined {
  return l?.records.crossref ?? l?.records.arxiv ?? l?.records.openalex ?? undefined;
}

/** Share of the record's title words that appear in a raw reference (used when the title could not be parsed). */
function containment(raw: string, title: string): number {
  const words = new Set(normalizeText(raw).split(" "));
  const t = normalizeText(title).split(" ").filter((w) => w.length > 2);
  if (t.length < 3) return 0;
  return Math.min(0.95, t.filter((w) => words.has(w)).length / t.length);
}

/** How well a record's title matches the reference (0–1). */
export function titleScoreFor(input: ReferenceInput, rec: RegistryRecord): number {
  return input.title ? titleSimilarity(input.title, rec.title) : containment(input.raw, rec.title);
}

function authorsFor(input: ReferenceInput, rec: RegistryRecord): AuthorCheck {
  if (input.authors?.length) return checkAuthors(input.authors, rec.authors, input.etAl);
  // Author list not parsed: accept the paper's first author only if their surname appears in the raw text.
  const first = rec.authors[0]?.family;
  const present = !!first && normalizeText(input.raw).split(" ").includes(normalizeText(first).split(" ").pop() ?? "");
  return { match: present ? "close" : "missing", firstOk: present, overlap: present ? 1 : 0, strangers: [] };
}

/** Best first: title similarity, then first author, then year. Notices never rank. */
export function rankCandidates(input: ReferenceInput, cands: RegistryRecord[]): RegistryRecord[] {
  const seen = new Set<string>();
  const score = (r: RegistryRecord) => titleScoreFor(input, r) + (authorsFor(input, r).firstOk ? 0.15 : 0) + (checkYear(input.year, r.year) !== "different" ? 0.05 : 0);
  return cands
    .filter((r) => !r.noticeFor)
    .filter((r) => {
      const k = r.doi ?? `${r.registry}:${r.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((r) => [r, score(r)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([r]) => r);
}

function mergeUpdates(records: RegistryRecord[]): Update[] {
  const out: Update[] = [];
  for (const u of records.flatMap((r) => r.updates)) {
    if (!out.some((o) => o.kind === u.kind && o.source === u.source && (o.noticeDoi ?? "") === (u.noticeDoi ?? ""))) out.push(u);
  }
  return out;
}

/** One canonical record for the UI: the primary record, filled in from the others (abstract, OA, countries). */
function merge(primary: RegistryRecord, others: RegistryRecord[], updates: Update[]): RegistryRecord {
  const m: RegistryRecord = { ...primary, updates };
  for (const o of others) {
    if (o === primary) continue;
    m.abstract ??= o.abstract;
    m.openAccess ??= o.openAccess;
    m.oaUrl ??= o.oaUrl;
    m.journal ??= o.journal;
    m.countries ??= o.countries;
    m.citedBy = Math.max(m.citedBy ?? 0, o.citedBy ?? 0) || undefined;
    m.volume ??= o.volume;
    m.issue ??= o.issue;
    m.pages ??= o.pages;
  }
  return m;
}

/**
 * A real paper written by at least two of the cited authors (surname AND first initial must agree, so common
 * surnames alone never count). Used to explain "real authors, invented paper".
 */
function paperByCitedAuthors(input: ReferenceInput, works: RegistryRecord[] | undefined): { work: RegistryRecord; names: string[] } | undefined {
  const cited = input.authors ?? [];
  if (cited.length < 2 || !works?.length) return undefined;
  const initial = (s?: string) => normalizeText(s).charAt(0);
  for (const w of works) {
    const names = cited
      .filter((c) => w.authors.some((a) => sameSurname(c.family, a.family) && (!c.given || !a.given || initial(c.given) === initial(a.given))))
      .map((c) => c.family);
    if (names.length >= 2) return { work: w, names };
  }
  return undefined;
}

const cite = (r: RegistryRecord) => `“${r.title}” (${authorsLabel(r.authors) || "unknown authors"}, ${r.year ?? "n.d."})`;
const belongs = (r: RegistryRecord) => ({ doi: r.doi, title: r.title, year: r.year, authors: authorsLabel(r.authors) });

export function decide(ev: Evidence, now = Date.now()): Verification {
  const input = ev.input;
  const base = { searched: ev.receipts, checkedAt: new Date(now).toISOString(), ms: now - ev.startedAt };
  // Say which happened: a rate limit (busy) is not an outage (no answer).
  const names = (kind: "limited" | "down") => [...new Set(ev.errors.filter((e) => (e.kind === "rate_limited") === (kind === "limited")).map((e) => REGISTRY_NAME[e.registry]))];
  const limited = names("limited");
  const down = names("down");
  const why = [...(limited.length ? [`${list(limited)} ${limited.length > 1 ? "are" : "is"} rate-limiting us right now`] : []), ...(down.length ? [`${list(down)} did not respond`] : [])];
  const incomplete = why.length ? `${why.join(" and ")}, so this check is incomplete. Try again in a minute.` : undefined;

  /* ---------- 1. What the written DOI points at ---------- */
  const doiRec = primaryOf(ev.claimedDoi);
  const doiNotice = doiRec?.noticeFor;
  const doiUnregistered = !!input.doi && !!ev.claimedDoi && !doiRec && ev.claimedDoi.errors.length === 0;

  /* ---------- 2. Which work the reference refers to ---------- */
  let work: RegistryRecord | undefined;
  let workLookup: DoiLookup | undefined;
  if (doiRec && !doiNotice && (!input.title || titleScoreFor(input, doiRec) >= T.titleSimilar)) {
    work = doiRec;
    workLookup = ev.claimedDoi;
  } else {
    const best = rankCandidates(input, ev.candidates)[0];
    if (best && titleScoreFor(input, best) >= T.titleSimilar) {
      work = best;
      workLookup = best.doi ? ev.confirmations[best.doi] : undefined;
    }
  }
  const hijacked = !!doiRec && !doiNotice && !!input.title && (!work || !sameDoi(work.doi, doiRec.doi));

  /* ---------- 3. No credible work: chimera (real DOI, other paper) or not found ---------- */
  if (!work) {
    if (hijacked && doiRec) {
      const parts: ChimeraPart[] = [
        { field: "doi", claimed: input.doi!, belongsTo: belongs(doiRec) },
        { field: "title", claimed: input.title!, note: "No paper with this title was found in Crossref, OpenAlex or arXiv" },
      ];
      return {
        ...base,
        status: "chimera",
        checks: [
          { field: "doi", claimed: input.doi, found: doiRec.doi, match: "different" },
          { field: "title", claimed: input.title, found: doiRec.title, match: "different", score: titleScoreFor(input, doiRec) },
        ],
        registries: recordsOf(ev.claimedDoi).map((r) => r.registry),
        matched: doiRec,
        parts,
        updates: [],
        reasons: [`The DOI is real but belongs to a different paper: ${cite(doiRec)}.`, "No paper with the cited title exists in the registries we searched."],
      };
    }
    const byAuthors = incomplete ? undefined : paperByCitedAuthors(input, ev.authorWorks);
    if (byAuthors) {
      const { work: real, names } = byAuthors;
      return {
        ...base,
        status: "chimera",
        checks: [
          { field: "title", claimed: input.title, match: "different", score: titleScoreFor(input, real) },
          { field: "authors", claimed: input.authors ? authorsLabel(input.authors, 6) : undefined, found: authorsLabel(real.authors, 6), match: "close" },
          ...(input.doi ? [{ field: "doi" as const, claimed: input.doi, found: doiUnregistered ? "not registered" : undefined, match: "different" as const }] : []),
        ],
        registries: [real.registry],
        matched: real,
        parts: [
          { field: "authors", claimed: authorsLabel(input.authors ?? [], 6), belongsTo: belongs(real) },
          { field: "title", claimed: input.title ?? input.raw.slice(0, 90), note: "No paper with this title exists in Crossref, OpenAlex or arXiv" },
          ...(input.doi && doiUnregistered ? [{ field: "doi" as const, claimed: input.doi, note: "This DOI is not registered" }] : []),
        ],
        updates: [],
        reasons: [
          `The authors are real: ${list(names)} wrote ${cite(real)}.`,
          "But no paper with the cited title exists in Crossref, OpenAlex or arXiv. Real authors attached to an invented paper is a stitched reference (SP Jain policy §h(ix)).",
          ...(doiUnregistered ? [`The DOI ${input.doi} is not registered anywhere.`] : []),
        ],
      };
    }
    const closest = rankCandidates(input, ev.candidates)[0];
    const reasons = ["No record in Crossref, OpenAlex or arXiv matches this reference."];
    if (doiUnregistered) reasons.push(`The DOI ${input.doi} is not registered anywhere.`);
    if (doiNotice && doiRec) reasons.push(`The DOI ${input.doi} is a ${doiNotice.kind} notice, not a paper.`);
    if (closest) reasons.push(`Closest record: ${cite(closest)}. It is too different to be the same work.`);
    if (incomplete) reasons.push(incomplete);
    return {
      ...base,
      status: incomplete ? "partial" : "notfound",
      checks: [
        { field: "title", claimed: input.title, match: input.title ? "different" : "missing", score: closest ? titleScoreFor(input, closest) : 0 },
        ...(input.doi ? [{ field: "doi" as const, claimed: input.doi, found: doiUnregistered ? "not registered" : undefined, match: "different" as const }] : []),
      ],
      registries: [],
      updates: [],
      reasons,
    };
  }

  /* ---------- 4. Compare every field with the work ---------- */
  const records = [...new Set([work, ...recordsOf(workLookup)])].filter((r) => !r.noticeFor);
  const confirming = [...new Set(records.filter((r) => titleSimilarity(work.title, r.title) >= T.titleClose).map((r) => r.registry))];
  const updates = mergeUpdates(records);
  const matched = merge(work, records, updates);

  const tScore = titleScoreFor(input, work);
  const tMatch = input.title ? titleMatch(tScore, true) : tScore >= T.titleClose ? "close" : "different";
  const au = authorsFor(input, work);
  const yMatch = checkYear(input.year, work.year);
  const doiMatch: FieldCheck["match"] = !input.doi ? "missing" : sameDoi(input.doi, work.doi) || sameDoi(input.doi, work.publishedDoi) ? "exact" : "different";
  const vScore = venueSimilarity(input.venue, work.venue);
  const vMatch = venueMatch(vScore, !!input.venue && !!work.venue);

  const checks: FieldCheck[] = [
    { field: "doi", claimed: input.doi, found: work.doi, match: doiMatch },
    { field: "title", claimed: input.title, found: work.title, match: tMatch, score: tScore },
    { field: "authors", claimed: input.authors ? authorsLabel(input.authors, 6) : undefined, found: authorsLabel(work.authors, 6), match: au.match, score: au.overlap },
    { field: "year", claimed: input.year?.toString(), found: work.year?.toString(), match: yMatch },
    { field: "venue", claimed: input.venue, found: work.venue, match: vMatch, score: vScore || undefined },
  ];
  const result = (status: RefStatus, reasons: string[], parts?: ChimeraPart[]): Verification => ({
    ...base,
    status,
    checks,
    registries: confirming,
    matched,
    parts,
    updates,
    reasons: incomplete && status !== "verified" ? [...reasons, incomplete] : reasons,
  });
  const titleIsReal = tMatch === "exact" || tMatch === "close";
  const correctionNotes = updates
    .filter((u) => u.kind === "correction" || u.kind === "concern")
    .slice(0, 1)
    .map((u) => `A ${u.kind === "concern" ? "expression of concern" : "correction"} was published${u.date ? ` on ${u.date}` : ""}${u.noticeDoi ? ` (${u.noticeDoi})` : ""}. Read it before citing.`);

  /* ---------- 5. Status rules, strongest first ---------- */
  const retraction = updates.find((u) => u.kind === "retraction" || u.kind === "withdrawal");
  if (retraction && (titleIsReal || doiMatch === "exact")) {
    const sources = [...new Set(updates.filter((u) => u.kind === retraction.kind).map((u) => (u.source === "retraction-watch" ? "Retraction Watch" : u.source === "openalex" ? "OpenAlex" : "the publisher")))];
    return result("retracted", [
      `This paper was ${retraction.kind === "withdrawal" ? "withdrawn" : "retracted"}${retraction.date ? ` on ${retraction.date}` : ""}${retraction.noticeDoi ? ` (notice ${retraction.noticeDoi})` : ""}, according to ${list(sources)}.`,
      "Do not cite it as evidence. If you discuss it, say that it was retracted.",
    ]);
  }

  if (hijacked && doiRec) {
    return result(
      "chimera",
      [`The DOI belongs to a different paper: ${cite(doiRec)}.`, `The title belongs to ${cite(work)}.`],
      [
        { field: "doi", claimed: input.doi!, belongsTo: belongs(doiRec) },
        { field: "title", claimed: input.title ?? "", belongsTo: belongs(work) },
      ],
    );
  }

  // Parts of the reference that do not belong to the paper whose title it carries.
  const foreign: { part: ChimeraPart; issue: string }[] = [];
  if (input.authors?.length && !au.firstOk) {
    foreign.push({
      part: { field: "authors", claimed: authorsLabel(input.authors, 6), note: au.overlap === 0 ? `None of these authors are on the real paper (its authors: ${authorsLabel(work.authors)})` : `Not the real author list (the real paper is by ${authorsLabel(work.authors)})` },
      issue: au.overlap === 0 ? "none of the cited authors wrote it" : `it is by ${authorsLabel(work.authors)}, not ${authorsLabel(input.authors)}`,
    });
  }
  if (yMatch === "different") foreign.push({ part: { field: "year", claimed: String(input.year), note: `The real paper is from ${work.year}` }, issue: `it is from ${work.year}, not ${input.year}` });
  if (vMatch === "different") foreign.push({ part: { field: "venue", claimed: input.venue ?? "", note: `The real paper is in ${work.venue}` }, issue: `it appeared in ${work.venue}, not ${input.venue}` });
  if (doiMatch === "different") foreign.push({ part: { field: "doi", claimed: input.doi ?? "", note: doiUnregistered ? "This DOI is not registered" : `The real DOI is ${work.doi}` }, issue: doiUnregistered ? `the DOI ${input.doi} is not registered` : `its DOI is ${work.doi}` });
  // Most cited authors are strangers (one overlapping name must not hide a swap), or two or more parts are foreign.
  const authorsForeign = !!input.authors?.length && (au.overlap === 0 || (!au.firstOk && au.overlap < 0.5));
  if (titleIsReal && (authorsForeign || foreign.length >= 2)) {
    return result(
      "chimera",
      [`The title is real: ${cite(work)}. But ${list(foreign.map((f) => f.issue))}.`, "This is a reference stitched together from real parts (SP Jain policy §h(ix))."],
      [{ field: "title", claimed: input.title ?? "", belongsTo: belongs(work) }, ...foreign.map((f) => f.part)],
    );
  }

  // Only a DOI was given: it exists, but there is nothing to compare it with.
  const typed = input.raw.replace(/https?:\/\/\S+|\bdoi:\s*\S+|10\.\d{4,9}\/\S+/gi, "");
  if (doiMatch === "exact" && !/\p{L}{3}/u.test(typed)) {
    return result("partial", [`This DOI exists: ${cite(work)}.`, "Only a DOI was given, so the title, authors and year could not be compared. Paste the full reference to verify it.", ...correctionNotes]);
  }

  const wrong: string[] = [];
  if (!titleIsReal) wrong.push(`The title is worded differently from the record (similarity ${tScore.toFixed(2)}): “${work.title}”.`);
  if (au.match === "different" || au.strangers.length) {
    if (!au.firstOk && input.authors?.length) wrong.push(`The first author should be ${work.authors[0]?.family ?? "different"}, not ${input.authors[0].family}.`);
    if (au.strangers.length) wrong.push(`Not authors of this paper: ${au.strangers.join(", ")}.`);
  }
  if (yMatch === "different") wrong.push(`The year is ${work.year}, not ${input.year}.`);
  if (doiMatch === "different") {
    if (doiNotice) wrong.push(`The DOI ${input.doi} is a ${doiNotice.kind} notice, not the paper. The paper's DOI is ${work.doi}.`);
    else if (doiUnregistered) wrong.push(`The DOI ${input.doi} is not registered. The real DOI is ${work.doi ?? "missing from the registry"}.`);
    else wrong.push(`The DOI should be ${work.doi}.`);
  }
  if (vMatch === "different") wrong.push(`The journal is ${work.venue}, not ${input.venue}.`);
  if (wrong.length) return result("mismatch", [`The paper exists: ${cite(work)}. But:`, ...wrong, ...correctionNotes]);

  const fieldsOk = titleIsReal && au.firstOk && (yMatch === "exact" || yMatch === "close");
  if (fieldsOk && confirming.length >= 2) {
    return result("verified", [`${list(confirming.map((r) => REGISTRY_NAME[r]))} both have this paper. The title, first author and year match.`, ...correctionNotes]);
  }

  const missing: string[] = [];
  if (yMatch === "missing") missing.push("No year was found in the reference, so it could not be checked.");
  if (!au.firstOk) missing.push("The authors could not be read from the reference, so they could not be checked.");
  if (confirming.length < 2) {
    const only = confirming.map((r) => REGISTRY_NAME[r]);
    missing.push(`Only ${list(only) || "one registry"} has this record. Veracite marks a reference Verified only when two registries agree.`);
  }
  return result("partial", [`Found: ${cite(work)}.`, ...missing, ...correctionNotes]);
}
