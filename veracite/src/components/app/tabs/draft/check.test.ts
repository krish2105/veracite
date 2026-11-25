import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCrossrefWork, type CrossrefWork } from "@/lib/registries/crossref";
import type { SourceRecord } from "@/lib/types";
import { checkDraft, claimsForSkeptic, lower, matchCitation, quotesIn } from "./check";
import { findCitations, splitSentences } from "./citations";

const rec = parseCrossrefWork((JSON.parse(readFileSync(new URL("../../../../lib/registries/__fixtures__/crossref-bastani-correction.json", import.meta.url), "utf8")) as { message: CrossrefWork }).message);
const source = (over: Partial<SourceRecord>) => ({ id: "S1", title: rec.title, authors: rec.authors, year: 2025, type: "article", abstract: rec.abstract, verification: { status: "verified" }, ...over }) as unknown as SourceRecord;
const bastani = source({});
const wang = source({ id: "S2", authors: [{ family: "Wang" }, { family: "Fan" }], year: 2025, abstract: undefined });
const firstSentence = rec.abstract!.split(". ")[0];

describe("citations", () => {
  it("reads parenthetical and narrative APA forms", () => {
    const c = findCitations("As (Bastani et al., 2025) and Wang and Fan (2025) show (see Kestin, 2025a, p. 4; Noy & Zhang, 2023), Al Suwaidi (n.d.) differs.");
    expect(c.map((x) => [x.families.join("+"), x.etAl, x.year])).toEqual([
      ["Bastani", true, 2025],
      ["Wang+Fan", false, 2025],
      ["Kestin", false, 2025],
      ["Noy+Zhang", false, 2023],
      ["Al Suwaidi", false, undefined],
    ]);
  });

  it("ignores brackets that are not citations", () => {
    expect(findCitations("The trial (with 1000 students) ran in 2023 (see Figure 2).")).toEqual([]);
  });

  it("splits sentences without breaking on et al., page numbers or quotes", () => {
    const s = splitSentences("Bastani et al. (2025) ran a trial. It said “AI helps. It also harms” (Kestin, 2025, p. 4). J. Smith disagreed!");
    expect(s.map((x) => x.text)).toEqual(["Bastani et al. (2025) ran a trial.", "It said “AI helps. It also harms” (Kestin, 2025, p. 4).", "J. Smith disagreed!"]);
    expect(s.map((x) => x.citations.length)).toEqual([1, 1, 0]);
  });
});

describe("matching", () => {
  const cite = (t: string) => findCitations(t)[0];
  it("matches by author and year, and explains misses", () => {
    expect(matchCitation(cite("(Bastani et al., 2025)"), [bastani]).source?.id).toBe("S1");
    expect(matchCitation(cite("(Fakerson, 2031)"), [bastani]).problem).toMatch(/No source by Fakerson/);
    expect(matchCitation(cite("(Bastani et al., 2019)"), [bastani]).problem).toMatch(/from 2025, not 2019/);
    expect(matchCitation(cite("(Wang & Lee, 2025)"), [wang]).problem).toMatch(/co-author/);
  });
  it("points out APA 7 author forms", () => {
    expect(matchCitation(cite("(Bastani, 2025)"), [bastani]).problem).toMatch(/et al/);
    expect(matchCitation(cite("(Wang et al., 2025)"), [wang]).problem).toMatch(/name both authors/);
  });
});

describe("checkDraft", () => {
  const draft = `They note that “${firstSentence}” (Bastani et al., 2025). AI always helps every student (Bastani et al., 2025). They wrote “this exact sentence appears nowhere in that paper” (Bastani et al., 2025). Scores rose 40% (Fakerson, 2031). About 90% of students use it. I think design matters.`;
  const r = checkDraft(draft, [bastani, wang]);

  it("labels each sentence by code, never calling an unconfirmed claim Verified", () => {
    expect(r.sentences.map((s) => s.label)).toEqual(["verified", "reported", "reported", "notfound", undefined, undefined]);
    expect(r.sentences[2].notes.join(" ")).toMatch(/not in the abstract/);
    expect(r.sentences[4].notes[0]).toMatch(/needs a citation/);
    expect(r.sentences[5].notes).toEqual([]);
    expect(r.uncited.map((s) => s.id)).toEqual(["S2"]);
  });

  it("flags close copying without quotation marks", () => {
    const copied = checkDraft(`${firstSentence} (Bastani et al., 2025).`, [bastani]);
    expect(copied.sentences[0].label).toBe("reported");
    expect(copied.sentences[0].notes.join(" ")).toMatch(/quotation marks/);
  });

  it("sends only fully matched sentences to the Skeptic, which can only lower labels", () => {
    expect(claimsForSkeptic(r).map((c) => c.id)).toEqual(["C1", "C2", "C3"]);
    const ch = (verdict: "supported" | "partial" | "unsupported") => ({ claimId: "C1", verdict, rules: [], reasons: [], counterSourceIds: [], round: 1 as const });
    expect(lower("reported", ch("supported"))).toBe("reported");
    expect(lower("verified", ch("partial"))).toBe("reported");
    expect(lower("verified", ch("unsupported"))).toBe("notfound");
  });

  it("ignores short quoted terms", () => {
    expect(quotesIn('The "flipped classroom" idea.')).toEqual([]);
  });
});
