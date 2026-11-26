import { describe, expect, it } from "vitest";
import { looksUnclear } from "./question";

describe("looksUnclear: text that cannot be searched as a question (K54)", () => {
  it("flags keyboard mashing, single fragments and symbols", () => {
    for (const q of ["mjbkjkll;;", "asdfgh", "?????", "12345 678", "xk", "qwrt zxcv bnm"]) expect(looksUnclear(q), q).toBe(true);
  });
  it("lets real questions through, short ones and non-English ones included", () => {
    for (const q of ["Does generative AI help or hurt student learning?", "AI tutoring outcomes", "CRISPR ethics", "هل يساعد الذكاء الاصطناعي الطلاب؟", "¿La IA mejora el aprendizaje?", "LLM hallucination rates"]) expect(looksUnclear(q), q).toBe(false);
  });
});
