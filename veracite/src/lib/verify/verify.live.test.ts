/**
 * K04 live check on the demo topic ("Does generative AI help or hurt student learning?") against the real
 * Crossref, OpenAlex and arXiv. Skipped unless LIVE=1. Prints a table of verdicts.
 *   cd veracite && LIVE=1 npx vitest run verify.live
 */
import { describe, expect, it } from "vitest";
import type { RefStatus } from "../types";
import { verifyReference } from "./verify";

const CASES: [string, RefStatus | "not-verified", string][] = [
  ["real · APA + DOI", "verified", "Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26), e2422633122. https://doi.org/10.1073/pnas.2422633122"],
  ["real · no DOI (notice trap)", "verified", "Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26)."],
  ["real · Sci Rep", "verified", "Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports, 15, 17458. https://doi.org/10.1038/s41598-025-97652-6"],
  ["real · arXiv preprint", "verified", "Kosmyna, N., Hauptmann, E., Yuan, Y. T., ... Maes, P. (2025). Your brain on ChatGPT: Accumulation of cognitive debt when using an AI assistant for essay writing task. arXiv. https://doi.org/10.48550/arXiv.2506.08872"],
  ["real · MLA, no DOI", "verified", 'Noy, Shakked, and Whitney Zhang. "Experimental Evidence on the Productivity Effects of Generative Artificial Intelligence." Science, vol. 381, no. 6654, 2023, pp. 187–92.'],
  ["real · QJE", "verified", "Brynjolfsson, E., Li, D., & Raymond, L. (2025). Generative AI at work. The Quarterly Journal of Economics, 140(2), 889–942. https://doi.org/10.1093/qje/qjae044"],
  ["retracted", "retracted", "Wang, J., & Fan, W. (2025). The effect of ChatGPT on students’ learning performance, learning perception, and higher-order thinking: insights from a meta-analysis. Humanities and Social Sciences Communications, 12, 621. https://doi.org/10.1057/s41599-025-04787-y"],
  ["chimera · wrong authors", "chimera", "Kestin, G., & Miller, K. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences."],
  ["chimera · hijacked DOI", "chimera", "Smith, J. A., & Lee, K. (2023). The impact of ChatGPT on undergraduate academic performance: A meta-analysis. Journal of Educational Technology & Society, 26(3), 45–62. https://doi.org/10.1073/pnas.2422633122"],
  ["mismatch · wrong year", "mismatch", "Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2021). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports, 15, 17458. https://doi.org/10.1038/s41598-025-97652-6"],
  ["fake · invented DOI", "not-verified", "Smith, J. A., & Lee, K. (2023). The impact of ChatGPT on undergraduate academic performance: A meta-analysis. Journal of Educational Technology & Society, 26(3), 45–62. https://doi.org/10.1234/jets.2023.0456"],
  ["fake · ChatGPT-style", "not-verified", "Johnson, M., & Patel, R. (2024). ChatGPT as a personal tutor: Effects on student motivation and exam scores in higher education. Computers & Education, 210, 104958."],
  ["fake · real authors", "not-verified", "Brynjolfsson, E., & Kestin, G. (2024). Large language models and the future of university assessment. Nature Human Behaviour, 8, 1120–1131."],
];

describe.skipIf(!process.env.LIVE)("Verifier (live, demo topic)", { timeout: 120_000 }, () => {
  it("verdicts on the demo bibliography", async () => {
    const rows: { case: string; expected: string; got: RefStatus; registries: string; ms: number; why: string }[] = [];
    for (const [name, expected, ref] of CASES) {
      const v = await verifyReference(ref);
      rows.push({ case: name, expected, got: v.status, registries: v.registries.join("+"), ms: v.ms, why: v.reasons.join(" ").slice(0, 110) });
    }
    console.table(rows);
    for (const r of rows) {
      if (r.expected === "not-verified") expect(r.got, r.case).not.toBe("verified");
      else expect(r.got, r.case).toBe(r.expected);
    }
  });
});
