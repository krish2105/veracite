import { describe, expect, it } from "vitest";
import { splitBibliography } from "./split";

const A = "Bastani, H., Bastani, O., & Sungu, A. (2025). Generative AI without guardrails can harm learning. PNAS, 122(26).";
const B = "Kestin, G., & Miller, K. (2025). AI tutoring outperforms in-class active learning. Scientific Reports, 15, 17458.";

describe("splitBibliography", () => {
  it("numbered ChatGPT list, items wrapping onto a second line", () => {
    const text = `1. ${A}\n   https://doi.org/10.1073/pnas.2422633122\n2. ${B}\n[3] H. Bastani et al., "Generative AI without guardrails," Proc. Natl. Acad. Sci., 2025.`;
    const refs = splitBibliography(text);
    expect(refs).toHaveLength(3);
    expect(refs[0]).toContain("https://doi.org/10.1073/pnas.2422633122");
    expect(refs[2].startsWith("[3] H. Bastani")).toBe(true);
  });

  it("blank-line separated references", () => {
    expect(splitBibliography(`${A}\n\n${B}\n`)).toEqual([A, B]);
  });

  it("one reference per line, with a hanging-indent continuation line", () => {
    const cut = B.indexOf(" ", 55);
    const text = `${A}\n${B.slice(0, cut)}\n    ${B.slice(cut + 1)}\nWorld Health Organization. (2023). Guidance for generative AI in education and research.`;
    const refs = splitBibliography(text);
    expect(refs).toHaveLength(3);
    expect(refs[1]).toBe(B);
    expect(refs[2].startsWith("World Health Organization")).toBe(true);
  });

  it("drops junk and caps the count", () => {
    expect(splitBibliography("References\n\n---\n\n")).toEqual([]);
    expect(splitBibliography(Array.from({ length: 40 }, (_, i) => `${i + 1}. ${A}`).join("\n"))).toHaveLength(30);
  });

  it("Phase 2: a lettered list (A. B. C.) is one reference per letter, with the letters removed", () => {
    const refs = splitBibliography("A. Smith, J. (2020). One title here. Journal, 1(2), 3–4.\nB. JONES K, LEE P. Second title. Lancet 2019;12:101-9.\nC. Air quality. European Environment Agency. https://example.org/air");
    expect(refs).toHaveLength(3);
    expect(refs[0].startsWith("Smith, J.")).toBe(true);
    expect(refs[1].startsWith("JONES K")).toBe(true);
  });
  it("Phase 2: one reference per line with no numbers, in mixed formats", () => {
    const refs = splitBibliography("Smith, J. (2020). One title here. Journal, 1(2), 3–4. https://doi.org/10.1000/abc\nJONES K, LEE P. Second title. Lancet 2019;12:101-9.\nAir quality. European Environment Agency. https://example.org/air");
    expect(refs).toHaveLength(3);
  });
  it("initials at the start of IEEE lines are not taken for list letters", () => {
    expect(splitBibliography("A. Smith and B. Jones, \"A long enough title,\" J. Test., vol. 1, 2020.")).toHaveLength(1);
  });
});
