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
});
