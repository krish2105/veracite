import { describe, expect, it } from "vitest";
import { apaReference } from "@/components/app/tabs/xray/apa";
import type { SourceRecord } from "@/lib/types";
import { formatEntries, formatInText, listOutput, STYLES, toCslItem } from "./styles";

// Registry records as they sit in a student's list (Crossref / OpenAlex / arXiv fields).
const rec = (p: Partial<SourceRecord> & Pick<SourceRecord, "id" | "title" | "type">): SourceRecord =>
  ({ authors: [], tags: [], collections: [], notes: "", opened: false, addedAt: "2026-11-25T10:00:00.000Z", addedVia: "xray", textAvailable: "none", quality: {}, verification: {} as SourceRecord["verification"], ...p }) as SourceRecord;

const LECUN = rec({
  id: "doi:10.1038/nature14539", doi: "10.1038/nature14539", type: "article", title: "Deep learning", year: 2015,
  authors: [{ family: "LeCun", given: "Yann" }, { family: "Bengio", given: "Yoshua" }, { family: "Hinton", given: "Geoffrey" }],
  venue: "Nature", volume: "521", issue: "7553", pages: "436-444",
});
const BASTANI = rec({
  id: "doi:10.1073/pnas.2422633122", doi: "10.1073/pnas.2422633122", type: "article", year: 2025,
  title: "Generative AI without guardrails can harm learning: Evidence from high school mathematics",
  authors: [{ family: "Bastani", given: "Hamsa" }, { family: "Bastani", given: "Osbert" }, { family: "Sungu", given: "Alp" }, { family: "Ge", given: "Haosen" }, { family: "Kabakcı", given: "Özge" }, { family: "Mariman", given: "Rei" }],
  venue: "Proceedings of the National Academy of Sciences", volume: "122", issue: "26", pages: "e2422633122",
});
const VASWANI = rec({
  id: "doi:10.48550/arxiv.1706.03762", doi: "10.48550/arxiv.1706.03762", type: "preprint", year: 2017, title: "Attention is all you need",
  authors: [{ family: "Vaswani", given: "Ashish" }, { family: "Shazeer", given: "Noam" }, { family: "Parmar", given: "Niki" }, { family: "Uszkoreit", given: "Jakob" }],
  venue: "arXiv",
});
const WHO = rec({
  id: "url:https://www.who.int/publications/i/item/9789240029200", type: "web", year: 2021,
  title: "Guidance on ethics and governance of artificial intelligence for health",
  authors: [{ family: "World Health Organization" }], url: "https://www.who.int/publications/i/item/9789240029200",
  accessedAt: "2026-11-25T08:30:00.000Z",
});

const one = async (style: Parameters<typeof formatEntries>[0], r: SourceRecord) => (await formatEntries(style, [r]))[0];

describe("toCslItem: the registry record in CSL-JSON (no AI, no guessing)", () => {
  it("maps a journal article", () => {
    expect(toCslItem(LECUN)).toMatchObject({
      id: "doi:10.1038/nature14539", type: "article-journal", title: "Deep learning",
      author: [{ family: "LeCun", given: "Yann" }, { family: "Bengio", given: "Yoshua" }, { family: "Hinton", given: "Geoffrey" }],
      issued: { "date-parts": [[2015]] }, "container-title": "Nature", volume: "521", issue: "7553", page: "436-444", DOI: "10.1038/nature14539",
    });
  });

  it("keeps an organisation as one literal name and uses the retrieval date for a web page", () => {
    expect(toCslItem(WHO)).toMatchObject({ type: "webpage", author: [{ literal: "World Health Organization" }], URL: WHO.url, accessed: { "date-parts": [[2026, 11, 25]] } });
  });

  it("drops APA's 'Article' label from an article number, so other styles don't print 'p. Article …'", () => {
    expect(toCslItem({ ...BASTANI, pages: "Article e2422633122" }).page).toBe("e2422633122");
  });

  it("treats a preprint as a posted article from its server, not a journal article", () => {
    const item = toCslItem(VASWANI);
    expect(item.type).toBe("article");
    expect(item.publisher).toBe("arXiv");
    expect(item["container-title"]).toBeUndefined();
  });
});

describe("reference lists in each style", () => {
  it("APA 7 is exactly the existing tested formatter", async () => {
    expect((await one("apa", LECUN)).text).toBe(apaReference(LECUN).text);
  });

  it("MLA 9", async () => {
    const e = await one("mla", LECUN);
    expect(e.text.startsWith("LeCun, Yann, et al. “Deep Learning.” Nature, vol. 521, no. 7553, 2015, pp. 436–44")).toBe(true);
    expect(e.html).toContain("<i>Nature</i>");
  });

  it("Harvard (Cite Them Right): British quotes, punctuation outside, 'Available at'", async () => {
    expect((await one("harvard", LECUN)).text).toContain("LeCun, Y., Bengio, Y. and Hinton, G. (2015) ‘Deep learning’, Nature, 521(7553), pp. 436–444. Available at: https://doi.org/10.1038/nature14539.");
  });

  it("IEEE: numbered in the order given", async () => {
    const [a, b] = await formatEntries("ieee", [LECUN, BASTANI]);
    expect(a.text).toMatch(/^\[1\] Y\. LeCun, Y\. Bengio, and G\. Hinton, “Deep learning,” Nature, vol\. 521, no\. 7553, pp\. 436–444, 2015/);
    expect(b.text).toMatch(/^\[2\] H\. Bastani/);
  });

  it("Chicago author-date", async () => {
    expect((await one("chicago", LECUN)).text.startsWith("LeCun, Yann, Yoshua Bengio, and Geoffrey Hinton. 2015. “Deep Learning.” Nature 521 (7553): 436–44.")).toBe(true);
  });

  it("author-date styles sort alphabetically; IEEE keeps the given order", async () => {
    expect((await formatEntries("harvard", [LECUN, BASTANI])).map((e) => e.id)).toEqual([BASTANI.id, LECUN.id]);
    expect((await formatEntries("ieee", [LECUN, BASTANI])).map((e) => e.id)).toEqual([LECUN.id, BASTANI.id]);
  });

  it("a web page carries its retrieval date in every style", async () => {
    expect((await one("harvard", WHO)).text).toContain("(Accessed: 25 November 2026)");
    // MLA 9 makes the access date optional and adds it only when the page has no date of its own.
    expect((await one("mla", WHO)).text).not.toContain("Accessed");
    expect((await one("mla", { ...WHO, year: undefined })).text).toContain("Accessed 25 Nov. 2026");
    expect((await one("ieee", WHO)).text).toContain("Accessed: Nov. 25, 2026");
    // Chicago 18th edition likewise: an access date only for pages without a date.
    expect((await one("chicago", WHO)).text).not.toContain("Accessed");
    expect((await one("chicago", { ...WHO, year: undefined })).text).toContain("Accessed November 25, 2026");
  });

  it("an arXiv preprint names arXiv and keeps its DOI", async () => {
    const t = (await one("ieee", VASWANI)).text;
    expect(t).toContain("arXiv");
    expect(t.toLowerCase()).toContain("10.48550/arxiv.1706.03762");
  });

  it("never lets markup from a record into the HTML", async () => {
    const evil = rec({ id: "doi:10.1/x", doi: "10.1/x", type: "article", title: "Hello <script>alert(1)</script> world", year: 2020, authors: [{ family: "Doe", given: "Jane" }], venue: "J" });
    for (const s of Object.keys(STYLES) as (keyof typeof STYLES)[]) expect((await one(s, evil)).html).not.toContain("<script");
  });
});

describe("in-text citations", () => {
  it("in each style", async () => {
    expect(await formatInText("apa", LECUN, [LECUN])).toBe("(LeCun et al., 2015)");
    expect(await formatInText("mla", LECUN, [LECUN])).toBe("(LeCun et al.)");
    expect(await formatInText("harvard", LECUN, [LECUN])).toBe("(LeCun, Bengio and Hinton, 2015)");
    // Chicago 18th edition: three or more authors are cited as "et al." in the text.
    expect(await formatInText("chicago", LECUN, [LECUN])).toBe("(LeCun et al. 2015)");
    expect(await formatInText("harvard", BASTANI, [BASTANI])).toBe("(Bastani et al., 2025)");
    expect(await formatInText("chicago", BASTANI, [BASTANI])).toBe("(Bastani et al. 2025)");
  });

  it("IEEE numbers a source by its place in the list", async () => {
    expect(await formatInText("ieee", BASTANI, [LECUN, BASTANI])).toBe("[2]");
    expect(await formatInText("ieee", VASWANI, [LECUN, BASTANI])).toBe("[3]");
  });
});

describe("listOutput: the whole list for copy and download", () => {
  it("adds the style's heading and joins entries", async () => {
    const out = listOutput("mla", await formatEntries("mla", [LECUN, BASTANI]));
    expect(out.text.startsWith("Works Cited\n\n")).toBe(true);
    expect(out.text.split("\n\n")).toHaveLength(3);
    expect(out.html).toContain("<i>Nature</i>");
  });
});
