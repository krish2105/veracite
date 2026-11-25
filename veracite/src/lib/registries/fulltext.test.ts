import { describe, expect, it } from "vitest";
import { fullTextLink } from "./fulltext";

describe("fullTextLink: a free, legal full text when the registries know one", () => {
  it("arXiv preprints link to their PDF, even without an oaUrl", () => {
    expect(fullTextLink({ doi: "10.48550/arxiv.1706.03762" })).toEqual({ url: "https://arxiv.org/pdf/1706.03762", kind: "pdf", via: "arXiv" });
  });
  it("uses the open-access copy OpenAlex reports, and tells a PDF from a page", () => {
    expect(fullTextLink({ doi: "10.1038/s41598-025-97652-6", oaUrl: "https://www.nature.com/articles/s41598-025-97652-6.pdf" })).toEqual({ url: "https://www.nature.com/articles/s41598-025-97652-6.pdf", kind: "pdf", via: "open-access copy" });
    expect(fullTextLink({ oaUrl: "https://www.pnas.org/doi/10.1073/pnas.2422633122" })?.kind).toBe("page");
  });
  it("returns nothing when no free copy is known (never guesses a link)", () => {
    expect(fullTextLink({ doi: "10.1038/nature14539", openAccess: false })).toBeUndefined();
    expect(fullTextLink({ doi: "10.1038/nature14539", openAccess: true })).toBeUndefined();
  });
  it("ignores anything that is not an http(s) link", () => {
    expect(fullTextLink({ oaUrl: "javascript:alert(1)" })).toBeUndefined();
    expect(fullTextLink({ oaUrl: "ftp://x.example/paper.pdf" })).toBeUndefined();
  });
});
