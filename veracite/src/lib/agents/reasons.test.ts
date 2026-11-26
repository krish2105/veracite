import { describe, expect, it } from "vitest";
import { clampReason, tidyReason, uniqueIds } from "./reasons";

describe("Skeptic reasons (K02, found in the first live session)", () => {
  it("drops a rule code the model repeated at the start (the UI already shows the rules)", () => {
    expect(tidyReason("S7: The source cites 'educators' only.")).toBe("The source cites 'educators' only.");
    expect(tidyReason("S4 - Correlation, not causation.")).toBe("Correlation, not causation.");
  });

  it("a long reason reads as a whole sentence fragment with an ellipsis, not a half word", () => {
    const r = tidyReason(`S4: ${"The source reports a correlation but the claim implies causation across settings. ".repeat(5)}`);
    expect(r.length).toBeLessThanOrEqual(301);
    expect(r).toMatch(/[a-z]…$/);
    expect(r.startsWith("The source")).toBe(true);
  });

  it("leaves an ordinary reason exactly as written", () => {
    expect(tidyReason("The claim generalises from one university to all students.")).toBe("The claim generalises from one university to all students.");
  });

  it("clamps a long reason in code at a word boundary, never mid-word", () => {
    const long = "word ".repeat(80).trim(); // 399 characters
    const c = clampReason(long, 120);
    expect(c.length).toBeLessThanOrEqual(121);
    expect(c.endsWith("word…")).toBe(true);
    expect(clampReason("Short and complete.", 120)).toBe("Short and complete.");
  });
});

describe("uniqueIds: a source cited twice in one claim is shown once", () => {
  it("keeps the first occurrence, in order", () => {
    expect(uniqueIds(["doi:a", "doi:a", "doi:b", "doi:a"])).toEqual(["doi:a", "doi:b"]);
  });
});
