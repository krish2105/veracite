/**
 * K03 unit tests. Offline: parsers run on real registry responses saved in __fixtures__ (24 Nov 2026).
 * Run: npm test (from veracite/). Live network checks are in registries.live.test.ts (LIVE=1).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseArxivFeed } from "./arxiv";
import { parseCrossrefWork, type CrossrefWork } from "./crossref";
import { createLimiter } from "./http";
import {
  abstractFromInvertedIndex,
  arxivIdFromString,
  isArxivDoi,
  noticeKindFromTitle,
  normalizeDoi,
  splitName,
  stripMarkup,
  titleSaysRetracted,
  updateKind,
} from "./normalize";
import { parseOpenAlexWork, type OpenAlexWork } from "./openalex";

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const json = <T>(name: string) => JSON.parse(fixture(name)) as T;

describe("normalize", () => {
  it("extracts and lower-cases DOIs from any form", () => {
    expect(normalizeDoi("https://doi.org/10.1073/PNAS.2422633122")).toBe("10.1073/pnas.2422633122");
    expect(normalizeDoi("doi:10.1057/s41599-025-04787-y.")).toBe("10.1057/s41599-025-04787-y");
    expect(normalizeDoi("Retrieved from https://doi.org/10.1038/s41598-025-97652-6)")).toBe("10.1038/s41598-025-97652-6");
    expect(normalizeDoi("no doi here")).toBeUndefined();
    expect(normalizeDoi(undefined)).toBeUndefined();
  });

  it("recognises arXiv DOIs and IDs", () => {
    expect(isArxivDoi("10.48550/arxiv.2506.08872")).toBe(true);
    expect(isArxivDoi("10.1073/pnas.2422633122")).toBe(false);
    expect(arxivIdFromString("10.48550/arXiv.2506.08872")).toBe("2506.08872");
    expect(arxivIdFromString("http://arxiv.org/abs/2506.08872v2")).toBe("2506.08872");
    expect(arxivIdFromString("arXiv:2302.06590")).toBe("2302.06590");
  });

  it("strips JATS/HTML and decodes entities", () => {
    expect(stripMarkup("<jats:p>AI &amp; <i>learning</i> &#8211; a&nbsp;test</jats:p>")).toBe("AI & learning – a test");
  });

  it("rebuilds an OpenAlex inverted-index abstract in order", () => {
    expect(abstractFromInvertedIndex({ AI: [0], helps: [1, 3], it: [2] })).toBe("AI helps it helps");
    expect(abstractFromInvertedIndex(null)).toBeUndefined();
  });

  it("splits display names into family/given", () => {
    expect(splitName("Hamsa Bastani")).toEqual({ family: "Bastani", given: "Hamsa" });
    expect(splitName("Bastani, Hamsa")).toEqual({ family: "Bastani", given: "Hamsa" });
    expect(splitName("Martin Luther King Jr.")).toEqual({ family: "King", given: "Martin Luther" });
    expect(splitName("OECD")).toEqual({ family: "OECD" });
  });

  it("spots notices and retracted titles", () => {
    expect(noticeKindFromTitle("Correction for Bastani et al., Generative AI without guardrails can harm learning")).toBe("correction");
    expect(noticeKindFromTitle("Retraction Note: The effect of ChatGPT on students")).toBe("retraction");
    expect(noticeKindFromTitle("Generative AI without guardrails can harm learning")).toBeUndefined();
    expect(titleSaysRetracted("RETRACTED ARTICLE: The effect of ChatGPT on students’ learning")).toBe(true);
    expect(updateKind("expression_of_concern")).toBe("concern");
    expect(updateKind("new_version")).toBeUndefined();
  });
});

describe("Crossref parser", () => {
  it("flags the retracted Wang & Fan (2025) meta-analysis from both sources", () => {
    const rec = parseCrossrefWork(json<{ message: CrossrefWork }>("crossref-wang-fan-retracted.json").message);
    expect(rec.doi).toBe("10.1057/s41599-025-04787-y");
    expect(rec.year).toBe(2025);
    expect(rec.type).toBe("article");
    expect(rec.authors.map((a) => a.family)).toEqual(["Wang", "Fan"]);
    expect(rec.venue).toBe("Humanities and Social Sciences Communications");
    expect(rec.pages).toBe("Article 621");
    const retractions = rec.updates.filter((u) => u.kind === "retraction");
    expect(retractions.map((u) => u.source).sort()).toEqual(["publisher", "retraction-watch"]);
    expect(retractions[0].noticeDoi).toBe("10.1057/s41599-026-07310-z");
    expect(retractions[0].date).toBe("2026-04-22");
    expect(rec.noticeFor).toBeUndefined();
  });

  it("reads the Bastani et al. correction and cleans the JATS abstract", () => {
    const rec = parseCrossrefWork(json<{ message: CrossrefWork }>("crossref-bastani-correction.json").message);
    expect(rec.updates).toEqual([expect.objectContaining({ kind: "correction", noticeDoi: "10.1073/pnas.2518204122", source: "publisher" })]);
    expect(rec.abstract?.startsWith("Generative AI is poised to revolutionize how humans work")).toBe(true);
    expect(rec.abstract).not.toContain("<");
    expect(rec.noticeFor).toBeUndefined();
  });

  it("marks the correction NOTICE that Crossref ranks above the real paper", () => {
    const items = json<{ message: { items: CrossrefWork[] } }>("crossref-bibliographic-bastani.json").message.items.map((w) => parseCrossrefWork(w));
    expect(items[0].doi).toBe("10.1073/pnas.2518204122");
    expect(items[0].noticeFor).toEqual({ kind: "correction", doi: "10.1073/pnas.2422633122" });
    expect(items[1].doi).toBe("10.1073/pnas.2422633122");
    expect(items[1].noticeFor).toBeUndefined();
    expect(items.filter((r) => !r.noticeFor)[0].doi).toBe("10.1073/pnas.2422633122");
  });
});

describe("OpenAlex parser", () => {
  it("rebuilds the Kestin et al. (2025) abstract that Crossref does not have", () => {
    const rec = parseOpenAlexWork(json<OpenAlexWork>("openalex-kestin.json"));
    expect(rec.id).toBe("W4411505840");
    expect(rec.doi).toBe("10.1038/s41598-025-97652-6");
    expect(rec.year).toBe(2025);
    expect(rec.type).toBe("article");
    expect(rec.venue).toBe("Scientific Reports");
    expect(rec.authors[0]).toMatchObject({ family: "Kestin", given: "Greg" });
    expect(rec.authors).toHaveLength(5);
    expect(rec.countries).toEqual(["US"]);
    expect(rec.abstract?.startsWith("Advances in generative artificial intelligence show great potential for improving education.")).toBe(true);
    expect(rec.updates).toEqual([]);
  });

  it("turns is_retracted into a retraction update", () => {
    const rec = parseOpenAlexWork({ ...json<OpenAlexWork>("openalex-kestin.json"), is_retracted: true });
    expect(rec.updates).toEqual([{ kind: "retraction", source: "openalex" }]);
  });
});

describe("arXiv parser", () => {
  it("parses the MIT 'Your Brain on ChatGPT' preprint with its DataCite DOI", () => {
    const [rec, ...rest] = parseArxivFeed(fixture("arxiv-kosmyna.xml"));
    expect(rest).toHaveLength(0);
    expect(rec.id).toBe("2506.08872");
    expect(rec.doi).toBe("10.48550/arxiv.2506.08872");
    expect(rec.title.startsWith("Your Brain on ChatGPT")).toBe(true);
    expect(rec.authors[0]).toEqual({ family: "Kosmyna", given: "Nataliya" });
    expect(rec.year).toBe(2025);
    expect(rec.type).toBe("preprint");
    expect(rec.abstract?.length).toBeGreaterThan(100);
  });

  it("skips arXiv error entries", () => {
    const err = `<feed><entry><id>http://arxiv.org/api/errors#incorrect_id_format_for_x</id><title>Error</title></entry></feed>`;
    expect(parseArxivFeed(err)).toEqual([]);
  });
});

describe("limiter", () => {
  it("never runs more than `concurrency` calls at once and spaces call starts", async () => {
    const run = createLimiter(2, 20);
    let active = 0;
    let maxActive = 0;
    const starts: number[] = [];
    const task = () =>
      run(async () => {
        starts.push(Date.now());
        maxActive = Math.max(maxActive, ++active);
        await new Promise((r) => setTimeout(r, 30));
        active--;
      });
    await Promise.all([task(), task(), task(), task(), task()]);
    expect(maxActive).toBe(2);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(18);
  });
});
