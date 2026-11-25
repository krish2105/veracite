import { describe, expect, it } from "vitest";
import { parseBibtex, parseLibraryFile, parseRis, toReferenceLine } from "./bibfile";

// Real records, written the way Zotero / Google Scholar / publishers export them.
const LECUN_BIB = `@article{lecun_deep_2015,
	title = {Deep learning},
	volume = {521},
	issn = {1476-4687},
	url = {https://www.nature.com/articles/nature14539},
	doi = {10.1038/nature14539},
	number = {7553},
	journal = {Nature},
	author = {LeCun, Yann and Bengio, Yoshua and Hinton, Geoffrey},
	month = may,
	year = {2015},
	pages = {436--444},
}`;

const ARXIV_BIB = `@misc{vaswani2017attention,
  title={Attention Is All You Need},
  author={Ashish Vaswani and Noam Shazeer and Niki Parmar and Jakob Uszkoreit and Llion Jones and Aidan N. Gomez and Lukasz Kaiser and Illia Polosukhin},
  year={2017},
  eprint={1706.03762},
  archivePrefix={arXiv},
  primaryClass={cs.CL}
}`;

const WEB_BIB = `@online{who_2023,
  author = {{World Health Organization}},
  title = "Guidance on ethics and governance of artificial intelligence for health",
  date = {2021-06-28},
  url = {https://www.who.int/publications/i/item/9789240029200},
  urldate = {2026-11-25}
}`;

const BASTANI_RIS = `TY  - JOUR
TI  - Generative AI without guardrails can harm learning: Evidence from high school mathematics
AU  - Bastani, Hamsa
AU  - Bastani, Osbert
AU  - Sungu, Alp
AU  - Ge, Haosen
AU  - Kabakcı, Özge
AU  - Mariman, Rei
T2  - Proceedings of the National Academy of Sciences
VL  - 122
IS  - 26
SP  - e2422633122
PY  - 2025
DA  - 2025/07/01/
DO  - 10.1073/pnas.2422633122
UR  - https://www.pnas.org/doi/10.1073/pnas.2422633122
ER  -
`;

describe("parseBibtex", () => {
  it("reads a Zotero BibTeX entry (LeCun 2015, Nature)", () => {
    const [e] = parseBibtex(LECUN_BIB);
    expect(e).toMatchObject({
      key: "lecun_deep_2015",
      type: "article",
      title: "Deep learning",
      year: 2015,
      venue: "Nature",
      volume: "521",
      issue: "7553",
      pages: "436–444",
      doi: "10.1038/nature14539",
      url: "https://www.nature.com/articles/nature14539",
    });
    expect(e.authors).toEqual([
      { family: "LeCun", given: "Yann" },
      { family: "Bengio", given: "Yoshua" },
      { family: "Hinton", given: "Geoffrey" },
    ]);
  });

  it("reads 'Given Family' names and turns an arXiv eprint into its arXiv DOI", () => {
    const [e] = parseBibtex(ARXIV_BIB);
    expect(e.authors[0]).toEqual({ family: "Vaswani", given: "Ashish" });
    expect(e.authors[5]).toEqual({ family: "Gomez", given: "Aidan N." });
    expect(e.authors).toHaveLength(8);
    expect(e.doi).toBe("10.48550/arxiv.1706.03762");
    expect(e.year).toBe(2017);
  });

  it("keeps a braced organisation author whole, reads quoted values and biblatex dates", () => {
    const [e] = parseBibtex(WEB_BIB);
    expect(e.authors).toEqual([{ family: "World Health Organization" }]);
    expect(e.title).toBe("Guidance on ethics and governance of artificial intelligence for health");
    expect(e.year).toBe(2021);
    expect(e.url).toBe("https://www.who.int/publications/i/item/9789240029200");
    expect(e.doi).toBeUndefined();
  });

  it("turns LaTeX accents and escapes into plain text", () => {
    const [e] = parseBibtex(`@article{x, title={{\\"U}ber {Kabakc{\\i}} \\& the {\\'e}l{\\\`e}ve -- a test}, author={M{\\"u}ller, J{\\"o}rg and Garc\\'{i}a, Mar{\\'\\i}a}, year=2020}`);
    expect(e.title).toBe("Über Kabakcı & the élève – a test");
    expect(e.authors).toEqual([{ family: "Müller", given: "Jörg" }, { family: "García", given: "María" }]);
  });

  it("skips @comment, @string and @preamble, and reads several entries", () => {
    const entries = parseBibtex(`@comment{jabref-meta: databaseType:bibtex;}\n@string{nat = "Nature"}\n@preamble{"x"}\n${LECUN_BIB}\n\n${ARXIV_BIB}`);
    expect(entries.map((e) => e.key)).toEqual(["lecun_deep_2015", "vaswani2017attention"]);
  });

  it("strips a doi.org prefix from the doi field", () => {
    const [e] = parseBibtex(`@article{y, title={T}, doi={https://doi.org/10.1038/NATURE14539}, year={2015}}`);
    expect(e.doi).toBe("10.1038/nature14539");
  });

  it("does not crash on a broken entry and keeps the good ones", () => {
    const entries = parseBibtex(`@article{broken, title={Unclosed\n\n${LECUN_BIB}`);
    expect(entries.some((e) => e.key === "lecun_deep_2015")).toBe(true);
  });
});

describe("parseRis", () => {
  it("reads an RIS record (Bastani 2025, PNAS)", () => {
    const [e] = parseRis(BASTANI_RIS);
    expect(e).toMatchObject({
      type: "JOUR",
      title: "Generative AI without guardrails can harm learning: Evidence from high school mathematics",
      year: 2025,
      venue: "Proceedings of the National Academy of Sciences",
      volume: "122",
      issue: "26",
      pages: "e2422633122",
      doi: "10.1073/pnas.2422633122",
      url: "https://www.pnas.org/doi/10.1073/pnas.2422633122",
    });
    expect(e.authors).toHaveLength(6);
    expect(e.authors[4]).toEqual({ family: "Kabakcı", given: "Özge" });
  });

  it("reads several records, Windows line endings and the T1 / A1 / Y1 / JO variants", () => {
    const ris = `TY  - JOUR\r\nT1  - First paper\r\nA1  - Doe, J.\r\nY1  - 2019/03/02/\r\nJO  - Some Journal\r\nSP  - 1\r\nEP  - 9\r\nER  - \r\nTY  - BOOK\r\nTI  - Second book\r\nAU  - Roe, Richard\r\nPY  - 2001\r\nER  -\r\n`;
    const entries = parseRis(ris);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ title: "First paper", year: 2019, venue: "Some Journal", pages: "1–9", authors: [{ family: "Doe", given: "J." }] });
    expect(entries[1]).toMatchObject({ type: "BOOK", title: "Second book", year: 2001 });
  });
});

describe("parseLibraryFile", () => {
  it("detects BibTeX and RIS by their content, whatever the file name", () => {
    expect(parseLibraryFile(LECUN_BIB).format).toBe("bibtex");
    expect(parseLibraryFile(BASTANI_RIS).format).toBe("ris");
  });

  it("counts entries with neither a title nor a DOI as skipped", () => {
    const r = parseLibraryFile(`${LECUN_BIB}\n@misc{empty, note={nothing here}}`);
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it("says when the text is neither format", () => {
    expect(parseLibraryFile("just some words").format).toBe("unknown");
    expect(parseLibraryFile("just some words").entries).toEqual([]);
  });
});

describe("toReferenceLine: one APA-style line per entry, for the Verifier", () => {
  it("writes authors, year, title, journal, volume(issue), pages and the DOI link", () => {
    const [e] = parseBibtex(LECUN_BIB);
    expect(toReferenceLine(e)).toBe("LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436–444. https://doi.org/10.1038/nature14539");
  });

  it("puts an organisation first and uses the link when there is no DOI", () => {
    const [e] = parseBibtex(WEB_BIB);
    expect(toReferenceLine(e)).toBe("World Health Organization. (2021). Guidance on ethics and governance of artificial intelligence for health. https://www.who.int/publications/i/item/9789240029200");
  });

  it("writes initials for hyphenated and middle names", () => {
    expect(toReferenceLine({ authors: [{ family: "Sartre", given: "Jean-Paul" }, { family: "Gomez", given: "Aidan N." }], title: "T", year: 2000 })).toBe("Sartre, J.-P., & Gomez, A. N. (2000). T.");
  });

  it("uses (n.d.) without a year, and no extra full stop after a question mark", () => {
    expect(toReferenceLine({ authors: [{ family: "Doe", given: "Jane" }], title: "Does it work?" })).toBe("Doe, J. (n.d.). Does it work?");
  });

  it("starts with the title when there are no authors", () => {
    expect(toReferenceLine({ authors: [], title: "Untitled report", year: 2024, url: "https://example.org/r" })).toBe("Untitled report. (2024). https://example.org/r");
  });

  it("always returns a single line", () => {
    expect(toReferenceLine({ authors: [{ family: "A" }], title: "Line\nbreak", year: 2020 })).not.toMatch(/\n/);
  });
});

describe("the SAMPLE library file shown on the Library page", () => {
  it("parses into six checkable entries, every one a single reference line", async () => {
    const { SAMPLE_BIB } = await import("./sample");
    const r = parseLibraryFile(SAMPLE_BIB);
    expect(r.format).toBe("bibtex");
    expect(r.entries).toHaveLength(6);
    expect(r.skipped).toBe(0);
    for (const e of r.entries) expect(toReferenceLine(e)).toMatch(/^\S.*\(\d{4}\)\. .+/);
  });
});
