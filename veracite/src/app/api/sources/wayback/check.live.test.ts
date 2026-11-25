/**
 * Live web-source check on the golden web set (tests/golden/web.json). Skipped unless LIVE=1.
 *   cd veracite && LIVE=1 npx vitest run wayback/check.live
 * Expected statuses follow docs/03: live or archived page → partial; neither → notfound.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkWebSource } from "./check";

const web = JSON.parse(readFileSync(new URL("../../../../../tests/golden/web.json", import.meta.url), "utf8")) as { id: string; url: string; expected: string }[];

describe.skipIf(!process.env.LIVE)("web sources (live)", { timeout: 120_000 }, () => {
  it("matches the golden web set and never says verified", async () => {
    const rows = [];
    for (const r of web) {
      const c = await checkWebSource(r.url);
      rows.push({ id: r.id, expected: r.expected, got: c.status, http: c.live.status, archived: c.archive.available, title: c.live.title?.slice(0, 50) });
      expect(c.status).not.toBe("verified");
    }
    console.table(rows);
    expect(rows.filter((x) => x.got !== x.expected)).toEqual([]);
  });
});
