/**
 * Runs the Verifier over Zedan's golden set (veracite/tests/golden/*.json, task Z01) as soon as it exists.
 * Asserts the property that matters most: no reference whose expected verdict is not "verified" gets Verified.
 * Skipped unless LIVE=1 and the golden files are present. Zedan's eval runner (Z06) produces the published numbers;
 * this is the guard rail for Verifier changes.
 *   cd veracite && LIVE=1 npx vitest run golden.live
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RefStatus } from "../types";
import { verifyReference } from "./verify";

interface GoldenRecord {
  id: string;
  raw: string;
  expected: RefStatus;
}

const DIR = new URL("../../../tests/golden/", import.meta.url);
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "web.json") : [];
const records: GoldenRecord[] = files.flatMap((f) => JSON.parse(readFileSync(new URL(f, DIR), "utf8")) as GoldenRecord[]);

describe.skipIf(!process.env.LIVE || records.length === 0)("Verifier on the golden set (live)", { timeout: 600_000 }, () => {
  it("never marks a non-verified reference as Verified", async () => {
    const wrongVerified: string[] = [];
    const misses: { id: string; expected: string; got: string; why: string }[] = [];
    const tally: Record<string, { n: number; right: number }> = {};
    for (const r of records) {
      const v = await verifyReference(r.raw);
      const got = v.status;
      const t = (tally[r.expected] ??= { n: 0, right: 0 });
      t.n++;
      if (got === r.expected) t.right++;
      else misses.push({ id: r.id, expected: r.expected, got, why: v.reasons.join(" ").slice(0, 140) });
      if (got === "verified" && r.expected !== "verified") wrongVerified.push(`${r.id} (expected ${r.expected})`);
    }
    console.table(Object.entries(tally).map(([expected, t]) => ({ expected, total: t.n, correct: t.right, rate: `${Math.round((100 * t.right) / t.n)}%` })));
    if (misses.length) console.table(misses);
    expect(wrongVerified, "fakes wrongly marked Verified").toEqual([]);
  });
});
