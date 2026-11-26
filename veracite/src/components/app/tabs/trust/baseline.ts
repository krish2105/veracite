/**
 * A DOI-only check next to Veracite, on the same test set (K52). Numbers come only from the two committed result
 * files (tests/results/baseline-doi-exists.json and latest.json); nothing here is typed in by hand.
 */
type Summary = { total: number; fakes: { total: number; caught: number }; falseVerified: { count: number }; retracted: { total: number; flagged: number }; real: { total: number; verified: number } };
type Run = { summary: Summary; ranAt: string };

export type CheckerComparison = { total: number; baselineRanAt: string; rows: { what: string; baseline: string; veracite: string }[] };

export function compareCheckers(baseline: Run, veracite: Run): CheckerComparison {
  const b = baseline.summary, v = veracite.summary;
  if (b.total !== v.total) throw new Error("The two runs must cover the same test set.");
  const frac = (n: number, d: number) => `${n}/${d}`;
  return {
    total: v.total,
    baselineRanAt: baseline.ranAt,
    rows: [
      { what: "Fakes caught (invented or stitched)", baseline: frac(b.fakes.caught, b.fakes.total), veracite: frac(v.fakes.caught, v.fakes.total) },
      { what: "Fakes or retracted papers passed as fine", baseline: String(b.falseVerified.count), veracite: String(v.falseVerified.count) },
      { what: "Retractions flagged", baseline: frac(b.retracted.flagged, b.retracted.total), veracite: frac(v.retracted.flagged, v.retracted.total) },
      { what: "Real references accepted", baseline: frac(b.real.verified, b.real.total), veracite: frac(v.real.verified, v.real.total) },
    ],
  };
}
