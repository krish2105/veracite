import { describe, expect, it } from "vitest";
import latest from "../../../../../tests/results/latest.json";
import baseline from "../../../../../tests/results/baseline-doi-exists.json";
import { compareCheckers } from "./baseline";

describe("Trust Center: a DOI-only check next to Veracite, same test set (K52)", () => {
  const c = compareCheckers(baseline, latest);
  it("only compares runs over the same number of references", () => {
    expect(c.total).toBe(51);
    expect(() => compareCheckers({ ...baseline, summary: { ...baseline.summary, total: 50 } }, latest)).toThrow(/same test set/);
  });
  it("reports the measured numbers from the committed result files, baseline first", () => {
    expect(c.rows).toEqual([
      { what: "Fakes caught (invented or stitched)", baseline: "4/11", veracite: "11/11" },
      { what: "Fakes or retracted papers passed as fine", baseline: "12", veracite: "0" },
      { what: "Retractions flagged", baseline: "0/5", veracite: "5/5" },
      { what: "Real references accepted", baseline: "30/30", veracite: "30/30" },
    ]);
  });
});
