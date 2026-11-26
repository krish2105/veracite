import { describe, expect, it } from "vitest";
import { readChatAnswer } from "./chatanswer";

const ANSWER = `Generative AI can both help and hurt learning. A large field experiment by Bastani et al. (2025) found that students who used GPT-4 without guardrails performed worse once access was removed. In contrast, Kestin and colleagues (2025) showed that a carefully designed AI tutor outperformed active learning (https://doi.org/10.1038/s41598-025-97652-6). Smith and Lee (2023) reported a 25% improvement in grades in their meta-analysis.

Sources:
1. Bastani, H. et al. (2025). Generative AI without guardrails can harm learning. PNAS.
2. Johnson, M., & Patel, R. (2024). ChatGPT as a personal tutor. Computers & Education, 210.`;

describe("readChatAnswer (K39): a chatbot answer, not a reference list", () => {
  it("recognises prose with in-text citations", () => {
    expect(readChatAnswer(ANSWER).looksLikeProse).toBe(true);
  });

  it("keeps the reference list as references", () => {
    const r = readChatAnswer(ANSWER);
    expect(r.refs).toHaveLength(2);
    // List numbers are dropped, so a DOI added after the list can never be read as part of reference 2.
    expect(r.refs[0]).toMatch(/^Bastani/);
    expect(r.refs[1]).toMatch(/^Johnson/);
  });

  it("adds DOIs that appear only in the prose", () => {
    expect(readChatAnswer(ANSWER).dois).toEqual(["10.1038/s41598-025-97652-6"]);
  });

  it("flags author–year mentions that have no full reference (and no DOI beside them)", () => {
    expect(readChatAnswer(ANSWER).unmatched).toEqual(["Smith and Lee (2023)"]);
  });

  it("works without a 'Sources' heading", () => {
    const r = readChatAnswer("Recent work by Doe and Roe (2021) and Bastani et al. (2025) suggests both effects matter for students in practice, according to several reviews.\n\nBastani, H., Bastani, O., & Sungu, A. (2025). Generative AI without guardrails can harm learning. PNAS.");
    expect(r.looksLikeProse).toBe(true);
    expect(r.refs).toHaveLength(1);
    expect(r.unmatched).toEqual(["Doe and Roe (2021)"]);
  });

  it("leaves an ordinary reference list alone", () => {
    const list = "1. Bastani, H., Bastani, O., & Sungu, A. (2025). Generative AI without guardrails can harm learning. PNAS.\n2. LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521, 436–444.";
    expect(readChatAnswer(list)).toMatchObject({ looksLikeProse: false, unmatched: [] });
  });

  it("is not fooled by a short plain sentence", () => {
    expect(readChatAnswer("Deep learning. Nature, 2015.").looksLikeProse).toBe(false);
  });

  it("a lettered reference list (A. B. C.) is a reference list, not a chatbot answer", () => {
    const list = "A. Smith, J., & Lee, K. (2020). One long enough title about learning outcomes in schools. Journal of Tests, 1(2), 3–4. https://doi.org/10.1000/abc\nB. Jones, P. (2019). Another long enough title about memory and sleep in adults. Lancet, 12, 101–109. https://doi.org/10.1000/def";
    expect(readChatAnswer(list).looksLikeProse).toBe(false);
  });
});
