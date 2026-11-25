/**
 * "How this was decided" (K34): the registry trace and the rule behind a verdict, in plain words.
 * Pure: it only reads the Verification the Verifier produced. It never changes a verdict. No AI.
 */
import type { FieldName, RegistryName, Verification } from "../types";

const NAME: Record<RegistryName, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };
const FIELD: Record<FieldName, string> = { doi: "DOI", title: "title", authors: "authors", year: "year", venue: "journal" };
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SOURCE = { publisher: "the publisher", "retraction-watch": "Retraction Watch", openalex: "OpenAlex" } as const;

export interface VerdictExplanation {
  trace: { registry: RegistryName; label: string; searches: number; hits: number; matched: boolean }[];
  rule: string;
  fields: string[];
  footer: string;
}

function ruleFor(v: Verification): string {
  const regs = v.registries.map((r) => NAME[r]);
  const searches = v.searched.length;
  switch (v.status) {
    case "verified":
      return `Verified because ${list(regs)} ${regs.length > 1 ? "both have" : "has"} this paper, and the title, first author and year match what you typed.`;
    case "partial":
      if (!v.matched) return "Partial because this is a web page: it has no registry record, so it can never be Verified. Check the author, date and content yourself.";
      if (!v.checks.some((c) => c.field === "title" && c.claimed !== undefined) && !v.checks.length) return "Partial because only a DOI was given: the record exists, but there was no title, author or year to compare.";
      if (regs.length === 1) return `Partial because only one registry (${regs[0]}) confirmed it; Verified needs two registries to agree.`;
      return "Partial because some details could not be confirmed in a second registry.";
    case "mismatch": {
      const diff = v.checks.filter((c) => c.match === "different");
      const vals = diff.filter((c) => c.claimed && c.found).map((c) => (diff.length === 1 ? `${c.claimed} vs ${c.found}` : `${FIELD[c.field]} ${c.claimed} vs ${c.found}`));
      return `Mismatch because the paper exists, but the ${list(diff.map((c) => FIELD[c.field]))} you typed differ${diff.length === 1 ? "s" : ""} from the registry${vals.length ? ` (${vals.join("; ")})` : ""}.`;
    }
    case "chimera": {
      const parts = (v.parts ?? []).map((p) => `the ${FIELD[p.field]}`);
      return `Chimera because ${parts.length ? `${list(parts)} come from different places` : "its parts come from different records"}: a reference stitched together from real pieces.`;
    }
    case "retracted": {
      const u = v.updates.find((x) => x.kind === "retraction" || x.kind === "withdrawal");
      const detail = [u?.noticeDoi, u?.date].filter(Boolean).join(", ");
      return `Retracted because a ${u?.kind ?? "retraction"} notice${detail ? ` (${detail})` : ""} is linked to this paper${u ? ` by ${SOURCE[u.source]}` : ""}.`;
    }
    case "notfound":
      return `Not found because no record in Crossref, OpenAlex or arXiv matches it, after ${searches} search${searches === 1 ? "" : "es"}.`;
  }
}

export function explainVerdict(v: Verification): VerdictExplanation {
  const trace = (["crossref", "openalex", "arxiv"] as RegistryName[]).map((r) => {
    const mine = v.searched.filter((s) => s.registry === r);
    return { registry: r, label: NAME[r], searches: mine.length, hits: mine.reduce((n, s) => n + s.hits, 0), matched: v.registries.includes(r) };
  });
  const fields = v.checks.map((c) => `${cap(FIELD[c.field])}: ${c.match}`);
  return { trace, rule: ruleFor(v), fields, footer: "Decided by code from what the registries returned. No AI was used." };
}
