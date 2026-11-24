// Scoring for the golden-set evaluation (task Z06). Pure functions, no network.
// Metrics are the ones docs/03 §10 promises to publish, honestly and with the date:
//   - fabricated references caught            (target 100 %)
//   - fakes wrongly marked Verified           (target 0, the number that matters most)
//   - real references verified                (target ≥ 90 %)
//   - median X-ray time per reference         (target < 2 s)

export const STATUSES = ["verified", "chimera", "mismatch", "notfound", "retracted", "partial"];

/** Golden files and what "doing well" means for each. */
export const SETS = {
  real: { file: "real.json", kind: "real" },
  fabricated: { file: "fabricated.json", kind: "fake" },
  chimeras: { file: "chimeras.json", kind: "fake" },
  retracted: { file: "retracted.json", kind: "retracted" },
  web: { file: "web.json", kind: "web" },
};

/**
 * One row per golden record.
 * @typedef {{ id: string, set: string, expected: string, got: string, ms: number, error?: string }} Row
 */

const pct = (n, d) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function p95(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
}

/** Turn rows into the published metrics. */
export function score(rows) {
  const by = (set) => rows.filter((r) => r.set === set);
  const kindOf = (r) => SETS[r.set]?.kind ?? "other";
  const ok = (r) => !r.error;

  const fakes = rows.filter((r) => kindOf(r) === "fake");
  const real = by("real");
  const retracted = by("retracted");
  const web = by("web");

  // A "fake" (fabricated or chimera) is caught if it is NOT marked verified (and the check ran).
  const fakesChecked = fakes.filter(ok);
  const fakesCaught = fakesChecked.filter((r) => r.got !== "verified");
  // Anything that isn't really a verified source but came out "verified".
  const falseVerified = rows.filter((r) => ok(r) && r.got === "verified" && r.expected !== "verified");
  const realChecked = real.filter(ok);
  const realVerified = realChecked.filter((r) => r.got === "verified");
  const retractedFlagged = retracted.filter((r) => ok(r) && r.got === "retracted");
  const webMatch = web.filter((r) => ok(r) && r.got === r.expected);
  const exact = rows.filter((r) => ok(r) && r.got === r.expected);
  const times = rows.filter(ok).map((r) => r.ms);

  const perSet = {};
  for (const set of Object.keys(SETS)) {
    const rs = by(set);
    const confusion = {};
    for (const r of rs) {
      const key = `${r.expected}→${r.error ? "error" : r.got}`;
      confusion[key] = (confusion[key] ?? 0) + 1;
    }
    perSet[set] = { total: rs.length, errors: rs.filter((r) => r.error).length, exact: rs.filter((r) => ok(r) && r.got === r.expected).length, confusion };
  }

  return {
    total: rows.length,
    errors: rows.filter((r) => r.error).length,
    fakes: { total: fakes.length, checked: fakesChecked.length, caught: fakesCaught.length, caughtPct: pct(fakesCaught.length, fakesChecked.length) },
    falseVerified: { count: falseVerified.length, ids: falseVerified.map((r) => r.id) },
    real: { total: real.length, checked: realChecked.length, verified: realVerified.length, verifiedPct: pct(realVerified.length, realChecked.length), missed: realChecked.filter((r) => r.got !== "verified").map((r) => `${r.id}:${r.got}`) },
    retracted: { total: retracted.length, flagged: retractedFlagged.length, missed: retracted.filter((r) => ok(r) && r.got !== "retracted").map((r) => `${r.id}:${r.got}`) },
    web: { total: web.length, matched: webMatch.length },
    exactAgreement: { count: exact.length, pct: pct(exact.length, rows.filter(ok).length) },
    timeMs: { median: median(times), p95: p95(times), total: times.reduce((a, b) => a + b, 0) },
    perSet,
  };
}

/** The one-line proof for slide 6 / the Trust Center. Never states more than was measured. */
export function proofLine(s, setsPresent) {
  const n = (set) => s.perSet[set]?.total ?? 0;
  const parts = [`Tested on ${s.total} references (${n("real")} real, ${n("fabricated")} fabricated, ${n("chimeras")} chimeras, ${n("retracted")} retracted, ${n("web")} web)`];
  if (s.fakes.checked) parts.push(`${s.fakes.caught}/${s.fakes.checked} fakes caught`);
  parts.push(`${s.falseVerified.count} fake${s.falseVerified.count === 1 ? "" : "s"} marked Verified`);
  if (s.real.checked) parts.push(`${s.real.verifiedPct}% of real references verified`);
  if (s.retracted.total) parts.push(`${s.retracted.flagged}/${s.retracted.total} retractions flagged`);
  if (s.timeMs.median !== null) parts.push(`median ${(s.timeMs.median / 1000).toFixed(1)} s per reference`);
  if (s.errors) parts.push(`${s.errors} could not be checked (errors)`);
  const missing = Object.keys(SETS).filter((k) => !setsPresent.includes(k) || n(k) === 0);
  let line = parts.join(" · ");
  if (missing.length) line += ` (not yet tested: ${missing.join(", ")})`;
  return line;
}

/** Markdown summary written next to the JSON. */
export function toMarkdown(report) {
  const s = report.summary;
  const L = [];
  if (report.label) L.push(`> **${report.label}**`, "");
  L.push(`# Golden-set evaluation · ${report.adapter}`, "");
  L.push(`Run: ${report.ranAt} · golden set as of this commit · ${s.total} references · ${s.errors} error${s.errors === 1 ? "" : "s"}`, "");
  L.push(`**${report.proofLine}**`, "");
  L.push("| Metric | Result | Target |", "|---|---|---|");
  L.push(`| Fakes caught (fabricated + chimeras) | ${s.fakes.caught}/${s.fakes.checked}${s.fakes.caughtPct === null ? "" : ` (${s.fakes.caughtPct}%)`} | 100% |`);
  L.push(`| **Fakes marked Verified** | **${s.falseVerified.count}**${s.falseVerified.ids.length ? ` (${s.falseVerified.ids.join(", ")})` : ""} | **0** |`);
  L.push(`| Real references verified | ${s.real.verified}/${s.real.checked}${s.real.verifiedPct === null ? "" : ` (${s.real.verifiedPct}%)`} | ≥ 90% |`);
  L.push(`| Retractions flagged | ${s.retracted.flagged}/${s.retracted.total} | 5/5 |`);
  L.push(`| Web sources as expected | ${s.web.matched}/${s.web.total} | 5/5 |`);
  L.push(`| Exact status agreement | ${s.exactAgreement.count}${s.exactAgreement.pct === null ? "" : ` (${s.exactAgreement.pct}%)`} | — |`);
  L.push(`| Median time per reference | ${s.timeMs.median === null ? "—" : `${s.timeMs.median} ms`} (p95 ${s.timeMs.p95 ?? "—"} ms) | < 2000 ms |`, "");
  L.push("## Per set (expected → got)", "");
  for (const [set, v] of Object.entries(s.perSet)) {
    if (!v.total) {
      L.push(`- **${set}**: no records yet`);
      continue;
    }
    const conf = Object.entries(v.confusion).map(([k, c]) => `${k} ×${c}`).join(", ");
    L.push(`- **${set}** (${v.exact}/${v.total} exact${v.errors ? `, ${v.errors} errors` : ""}): ${conf}`);
  }
  if (s.real.missed.length) L.push("", `Real references not verified: ${s.real.missed.join(", ")}`);
  if (s.retracted.missed.length) L.push("", `Retractions missed: ${s.retracted.missed.join(", ")}`);
  L.push("");
  return L.join("\n");
}
