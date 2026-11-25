import { describe, expect, it } from "vitest";
import { extractDois, linesFromItems, pdfToXrayInput, referenceSection } from "./pdftext";

const PAPER = `Generative AI and learning
Abstract
We review how students use chatbots (Bastani et al., 2025). See doi:10.1073/pnas.2422633122 for the trial.
1 Introduction
Students increasingly rely on AI tools.
References
Bastani, H., Bastani, O., & Sungu, A. (2025). Generative AI without guardrails can harm learning. Proceedings of the
National Academy of Sciences, 122(26). https://doi.org/10.1073/pnas.2422633122
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521, 436–444. https://doi.org/10.1038/nature14539
Kosmyna, N., & Maes, P. (2025). Your brain on ChatGPT. arXiv. https://doi.org/10.48550/arXiv.2506.08872
Appendix A
Survey items used in the study.`;

describe("linesFromItems: PDF text items back into lines", () => {
  it("groups items by baseline, top to bottom, left to right", () => {
    const items = [
      { str: "world", x: 60, y: 700 },
      { str: "Hello", x: 10, y: 700.4 },
      { str: "Second line", x: 10, y: 686 },
    ];
    expect(linesFromItems(items)).toEqual(["Hello world", "Second line"]);
  });
  it("re-joins a word hyphenated across a line break", () => {
    expect(linesFromItems([{ str: "genera-", x: 10, y: 700 }, { str: "tive AI", x: 10, y: 688 }]).join("\n")).toBe("genera-\ntive AI");
  });
});

describe("referenceSection: the list after the last References heading", () => {
  it("returns only the references, stopping at an appendix", () => {
    const r = referenceSection(PAPER)!;
    expect(r.startsWith("Bastani, H.")).toBe(true);
    expect(r).toContain("Kosmyna");
    expect(r).not.toContain("Survey items");
  });
  it("accepts Bibliography, Works Cited and numbered headings", () => {
    expect(referenceSection("Text\n7. Bibliography\nDoe, J. (2020). A title. J.")).toBe("Doe, J. (2020). A title. J.");
    expect(referenceSection("Text\nWORKS CITED\nDoe, Jane. A Title. 2020.")).toBe("Doe, Jane. A Title. 2020.");
  });
  it("returns nothing when there is no heading", () => {
    expect(referenceSection("Just a paragraph about references in general.")).toBeUndefined();
  });
});

describe("extractDois and pdfToXrayInput", () => {
  it("finds each DOI once, normalised", () => {
    expect(extractDois(PAPER)).toEqual(["10.1073/pnas.2422633122", "10.1038/nature14539", "10.48550/arxiv.2506.08872"]);
  });
  it("prefers the reference section, joining hyphen breaks, one reference per line", () => {
    const r = pdfToXrayInput(PAPER);
    expect(r.source).toBe("references");
    expect(r.text.split("\n").filter(Boolean)).toHaveLength(3);
    expect(r.text).toContain("Proceedings of the National Academy of Sciences");
  });
  it("keeps a DOI that wrapped onto its own line with its reference", () => {
    const r = pdfToXrayInput("References\nLeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521, 436–444.\nhttps://doi.org/10.1038/nature14539\nDoe, J. (2020). Another paper. Journal, 1, 2–3.\nhttps://doi.org/10.1000/xyz");
    expect(r.count).toBe(2);
    expect(r.text.split("\n\n")[0]).toMatch(/Deep learning\. Nature, 521, 436–444\. https:\/\/doi\.org\/10\.1038\/nature14539$/);
  });

  it("re-joins a DOI broken across lines (after a hyphen, or right after doi.org/)", () => {
    const r = pdfToXrayInput("References\nKestin, G. (2025). AI tutoring. Scientific Reports, 15. https://doi.org/10.1038/s41598-025-\n97652-6\nLeCun, Y. (2015). Deep learning. Nature. https://doi.org/\n10.1038/nature14539");
    expect(r.count).toBe(2);
    expect(r.text).toContain("https://doi.org/10.1038/s41598-025-97652-6");
    expect(r.text).toContain("https://doi.org/10.1038/nature14539");
  });

  it("falls back to the DOIs when there is no reference heading", () => {
    const r = pdfToXrayInput("A memo citing doi:10.1038/nature14539 and https://doi.org/10.1073/pnas.2422633122 only.");
    expect(r).toEqual({ source: "dois", text: "10.1038/nature14539\n10.1073/pnas.2422633122", count: 2 });
  });
  it("says when it found nothing", () => {
    expect(pdfToXrayInput("No references here.")).toEqual({ source: "none", text: "", count: 0 });
  });
});
