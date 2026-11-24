import { describe, expect, it } from "vitest";
import { parseAuthors, parseReference } from "./parse";
import { checkAuthors, checkYear, sameSurname, titleSimilarity, venueMatch, venueSimilarity } from "./text";

const BASTANI_APA =
  "Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26), e2422633122. https://doi.org/10.1073/pnas.2422633122";
const KESTIN_APA =
  "Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports, 15, 17458. https://doi.org/10.1038/s41598-025-97652-6";

describe("parseReference", () => {
  it("APA 7 journal article", () => {
    const r = parseReference(BASTANI_APA);
    expect(r.doi).toBe("10.1073/pnas.2422633122");
    expect(r.year).toBe(2025);
    expect(r.title).toBe("Generative AI without guardrails can harm learning: Evidence from high school mathematics");
    expect(r.venue).toBe("Proceedings of the National Academy of Sciences");
    expect(r.authors?.map((a) => a.family)).toEqual(["Bastani", "Bastani", "Sungu", "Ge", "Kabakcı", "Mariman"]);
    expect(r.etAl).toBe(false);
  });

  it("APA with an article number instead of pages", () => {
    const r = parseReference(KESTIN_APA);
    expect(r.venue).toBe("Scientific Reports");
    expect(r.authors?.map((a) => a.family)).toEqual(["Kestin", "Miller", "Klales", "Milbourne", "Ponti"]);
    expect(r.title?.startsWith("AI tutoring outperforms in-class active learning: An RCT")).toBe(true);
  });

  it("APA with an arXiv DOI and an ellipsis author list", () => {
    const r = parseReference(
      "Kosmyna, N., Hauptmann, E., Yuan, Y. T., ... Maes, P. (2025). Your brain on ChatGPT: Accumulation of cognitive debt when using an AI assistant for essay writing task. arXiv. https://doi.org/10.48550/arXiv.2506.08872",
    );
    expect(r.doi).toBe("10.48550/arxiv.2506.08872");
    expect(r.authors?.map((a) => a.family)).toEqual(["Kosmyna", "Hauptmann", "Yuan", "Maes"]);
    expect(r.title?.startsWith("Your brain on ChatGPT")).toBe(true);
  });

  it("numbered ChatGPT list item with a fake DOI", () => {
    const r = parseReference(
      "3. Smith, J. A., & Lee, K. (2023). The impact of ChatGPT on undergraduate academic performance: A meta-analysis. Journal of Educational Technology & Society, 26(3), 45–62. https://doi.org/10.1234/jets.2023.0456",
    );
    expect(r.doi).toBe("10.1234/jets.2023.0456");
    expect(r.authors?.map((a) => a.family)).toEqual(["Smith", "Lee"]);
    expect(r.year).toBe(2023);
    expect(r.venue).toBe("Journal of Educational Technology & Society");
  });

  it("MLA 9", () => {
    const r = parseReference(
      'Noy, Shakked, and Whitney Zhang. "Experimental Evidence on the Productivity Effects of Generative Artificial Intelligence." Science, vol. 381, no. 6654, 2023, pp. 187–92.',
    );
    expect(r.authors?.map((a) => a.family)).toEqual(["Noy", "Zhang"]);
    expect(r.title).toBe("Experimental Evidence on the Productivity Effects of Generative Artificial Intelligence");
    expect(r.venue).toBe("Science");
    expect(r.year).toBe(2023);
  });

  it("IEEE with et al. and an abbreviated venue", () => {
    const r = parseReference(
      '[1] H. Bastani et al., "Generative AI without guardrails can harm learning: Evidence from high school mathematics," Proc. Natl. Acad. Sci. U.S.A., vol. 122, no. 26, 2025.',
    );
    expect(r.authors?.[0].family).toBe("Bastani");
    expect(r.etAl).toBe(true);
    expect(r.title?.endsWith("high school mathematics")).toBe(true);
    expect(r.venue).toBe("Proc. Natl. Acad. Sci. U.S.A");
    expect(r.year).toBe(2025);
  });

  it("Harvard with a single-quoted title containing an apostrophe", () => {
    const r = parseReference(
      "Wang, J. and Fan, W. (2025) ‘The effect of ChatGPT on students’ learning performance, learning perception, and higher-order thinking: insights from a meta-analysis’, Humanities and Social Sciences Communications, 12, 621.",
    );
    expect(r.authors?.map((a) => a.family)).toEqual(["Wang", "Fan"]);
    expect(r.title?.startsWith("The effect of ChatGPT on students’ learning performance")).toBe(true);
    expect(r.venue).toBe("Humanities and Social Sciences Communications");
  });

  it("a '?' inside the title does not end it (golden real-015, real-029)", () => {
    const a = parseReference("Godard, R., & Holtzman, S. (2024). Are active and passive social media use related to mental health, wellbeing, and social support outcomes? A meta-analysis of 141 studies. Journal of Computer-Mediated Communication, 29(1), zmad055. https://doi.org/10.1093/jcmc/zmad055");
    expect(a.title).toBe("Are active and passive social media use related to mental health, wellbeing, and social support outcomes? A meta-analysis of 141 studies");
    expect(a.venue).toBe("Journal of Computer-Mediated Communication");
    const b = parseReference("Kasneci, E., Seßler, K., … Kasneci, G. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences, 103, 102274.");
    expect(b.title).toBe("ChatGPT for good? On opportunities and challenges of large language models for education");
    expect(b.authors?.map((x) => x.family)).toEqual(["Kasneci", "Seßler", "Kasneci"]);
    const c = parseReference("Lee, K. (2024). Is ChatGPT a good recommender? Journal of Things, 12(3), 1–10.");
    expect(c.title).toBe("Is ChatGPT a good recommender?");
    expect(c.venue).toBe("Journal of Things");
  });

  it("organisation author", () => {
    expect(parseAuthors("World Health Organization")).toEqual([{ family: "World Health Organization" }]);
  });
});

describe("text checks", () => {
  it("title similarity: identical, subtitle dropped, different papers", () => {
    const real = "Generative AI without guardrails can harm learning: Evidence from high school mathematics";
    expect(titleSimilarity(real, real)).toBe(1);
    expect(titleSimilarity("Generative AI without guardrails can harm learning", real)).toBeGreaterThanOrEqual(0.9);
    expect(titleSimilarity("Generative AI without guardrails can harm learning", real)).toBeLessThan(0.97);
    expect(titleSimilarity("RETRACTED ARTICLE: The effect of ChatGPT", "The effect of ChatGPT")).toBe(1);
    expect(titleSimilarity("AI tutoring outperforms in-class active learning", real)).toBeLessThan(0.5);
  });

  it("a different paper on the same topic is not a title match", () => {
    expect(titleSimilarity("Generative AI can harm learning", "Generative AI without guardrails can harm learning: Evidence from high school mathematics")).toBeLessThan(0.9);
  });

  it("surnames: accents, particles, compound names", () => {
    expect(sameSurname("Kabakcı", "Kabakci")).toBe(true);
    expect(sameSurname("Seßler", "Sessler")).toBe(true);
    expect(sameSurname("Al Suwaidi", "Suwaidi")).toBe(true);
    expect(sameSurname("García-Pérez", "Garcia Perez")).toBe(true);
    expect(sameSurname("Kestin", "Bastani")).toBe(false);
    expect(sameSurname("A", "B")).toBe(false);
  });

  it("authors: first author, overlap, strangers, et al.", () => {
    const found = [{ family: "Bastani" }, { family: "Bastani" }, { family: "Sungu" }];
    expect(checkAuthors([{ family: "Bastani" }], found, true)).toMatchObject({ match: "exact", firstOk: true, overlap: 1 });
    expect(checkAuthors([{ family: "Bastani" }], found, false)).toMatchObject({ match: "close", firstOk: true });
    expect(checkAuthors([{ family: "Kestin" }, { family: "Miller" }], found)).toMatchObject({ match: "different", overlap: 0, strangers: ["Kestin", "Miller"] });
    expect(checkAuthors(undefined, found).match).toBe("missing");
  });

  it("years: ±1 is close (online-first vs print)", () => {
    expect(checkYear(2025, 2025)).toBe("exact");
    expect(checkYear(2024, 2025)).toBe("close");
    expect(checkYear(2021, 2025)).toBe("different");
    expect(checkYear(undefined, 2025)).toBe("missing");
  });

  it("venues: acronyms and ISO-4 abbreviations count as the same journal", () => {
    const pnas = "Proceedings of the National Academy of Sciences";
    expect(venueSimilarity("PNAS", pnas)).toBe(1);
    expect(venueMatch(venueSimilarity("Proc. Natl. Acad. Sci. U.S.A", pnas), true)).not.toBe("different");
    expect(venueMatch(venueSimilarity("Sci. Rep.", "Scientific Reports"), true)).not.toBe("different");
    expect(venueMatch(venueSimilarity("Journal of Educational Psychology", "Scientific Reports"), true)).toBe("different");
  });
});
