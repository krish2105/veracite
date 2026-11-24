// Unit tests for the eval scoring (Z06). Run from veracite/: node --test "tests/eval/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { score, proofLine, toMarkdown } from "./score.mjs";

const row = (id, set, expected, got, ms = 1000, error) => ({ id, set, expected, got, ms, ...(error ? { error } : {}) });

const ROWS = [
  row("real-1", "real", "verified", "verified", 800),
  row("real-2", "real", "verified", "verified", 900),
  row("real-3", "real", "verified", "partial", 1200),
  row("fab-1", "fabricated", "notfound", "notfound", 1500),
  row("fab-2", "fabricated", "notfound", "verified", 700), // the worst kind of miss
  row("chim-1", "chimeras", "chimera", "chimera", 2000),
  row("chim-2", "chimeras", "chimera", "mismatch", 1800), // caught, wrong sub-label
  row("ret-1", "retracted", "retracted", "retracted", 600),
  row("ret-2", "retracted", "retracted", "verified", 600),
  row("web-1", "web", "verified", "verified", 3000),
  row("web-2", "web", "notfound", "", 0, "timeout"),
];

test("fakes caught = fabricated + chimeras not marked verified", () => {
  const s = score(ROWS);
  assert.deepEqual(s.fakes, { total: 4, checked: 4, caught: 3, caughtPct: 75 });
});

test("false Verified counts every non-real record marked verified, including retracted", () => {
  const s = score(ROWS);
  assert.deepEqual(s.falseVerified, { count: 2, ids: ["fab-2", "ret-2"] });
});

test("real verified, retractions, web, exact agreement", () => {
  const s = score(ROWS);
  assert.equal(s.real.verifiedPct, 66.7);
  assert.deepEqual(s.real.missed, ["real-3:partial"]);
  assert.deepEqual(s.retracted, { total: 2, flagged: 1, missed: ["ret-2:verified"] });
  assert.deepEqual(s.web, { total: 2, matched: 1 });
  // real-1, real-2, fab-1, chim-1, ret-1, web-1 = 6 of the 10 rows that ran
  assert.deepEqual(s.exactAgreement, { count: 6, pct: 60 });
});

test("errors are excluded from rates and time, but counted", () => {
  const s = score(ROWS);
  assert.equal(s.errors, 1);
  assert.equal(s.perSet.web.errors, 1);
  assert.equal(s.perSet.web.confusion["notfound→error"], 1);
  assert.equal(s.timeMs.median, 1050); // mean of the middle two of 10 timings (900, 1200)
  assert.equal(s.timeMs.p95, 3000);
});

test("confusion table per set", () => {
  assert.deepEqual(score(ROWS).perSet.chimeras.confusion, { "chimera→chimera": 1, "chimera→mismatch": 1 });
});

test("empty sets give null rates, not fake zeros or 100%", () => {
  const s = score([row("real-1", "real", "verified", "verified")]);
  assert.equal(s.fakes.caughtPct, null);
  assert.equal(s.perSet.fabricated.total, 0);
});

test("proof line states only what was measured and names untested sets", () => {
  const s = score(ROWS.filter((r) => r.set !== "fabricated"));
  const line = proofLine(s, ["real", "chimeras", "retracted", "web"]);
  assert.equal(
    line,
    "Tested on 9 references (3 real, 0 fabricated, 2 chimeras, 2 retracted, 2 web) · 2/2 fakes caught · 1 fake marked Verified · 66.7% of real references verified · 1/2 retractions flagged · median 1.1 s per reference · 1 could not be checked (errors) (not yet tested: fabricated)",
  );
});

test("markdown summary has the headline table", () => {
  const s = score(ROWS);
  const md = toMarkdown({ adapter: "test", ranAt: "2026-11-25T08:00:00Z", summary: s, proofLine: proofLine(s, Object.keys(s.perSet)), label: "SAMPLE" });
  assert.match(md, /\| \*\*Fakes marked Verified\*\* \| \*\*2\*\* \(fab-2, ret-2\) \| \*\*0\*\* \|/);
  assert.match(md, /- \*\*fabricated\*\* \(1\/2 exact\): notfound→notfound ×1, notfound→verified ×1/);
});
