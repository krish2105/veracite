#!/usr/bin/env node
// Golden-set evaluation runner (task Z06).
//
//   node tests/eval/run.mjs --adapter xray [--base http://localhost:3000]
//       → runs Veracite's Reference X-ray (POST /api/sources/xray, Krishna K05) over the golden set
//       → writes tests/results/latest.json + latest.md   ← the ONLY numbers the Trust Center may show
//
//   node tests/eval/run.mjs --adapter baseline
//       → a naive "does the DOI exist?" checker (what many citation checkers do), for comparison
//       → writes tests/results/baseline-doi-exists.json + .md   (never latest.*)
//
// Options: --sets real,chimeras  --concurrency 3  --limit 5 (per set, for a quick smoke run)
// Run from veracite/. Records are SAMPLE data from tests/golden/.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SETS, score, proofLine, toMarkdown } from "./score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(HERE, "..", "golden");
const RESULTS = join(HERE, "..", "results");
const UA = "veracite-eval/1.0 (hackathon test run)";

function args() {
  const a = { adapter: "xray", base: "http://localhost:3000", sets: Object.keys(SETS), concurrency: 3, limit: Infinity };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, "");
    const v = argv[i + 1];
    if (k === "adapter") a.adapter = v, i++;
    else if (k === "base") a.base = v.replace(/\/+$/, ""), i++;
    else if (k === "sets") a.sets = v.split(","), i++;
    else if (k === "concurrency") a.concurrency = Math.max(1, Number(v)), i++;
    else if (k === "limit") a.limit = Math.max(1, Number(v)), i++;
    else if (k === "help" || k === "h") a.help = true;
  }
  return a;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, init = {}, tries = 3) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(30000) });
    if (res.status !== 429 && res.status < 500) return res;
    if (i >= tries - 1) return res;
    await sleep(1000 * 2 ** i);
  }
}

// ---------- adapters: (record) → status string ----------

const ADAPTERS = {
  /** Veracite's own X-ray. Contract (docs/03 §6): POST /api/sources/xray, raw text → per-reference verdicts. */
  xray: (opts) => ({
    name: `Veracite Reference X-ray (${opts.base}/api/sources/xray)`,
    out: "latest",
    label: null,
    async check(rec) {
      const res = await fetchRetry(`${opts.base}/api/sources/xray`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rec.raw }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // K05 streams NDJSON: one {"type":"line", verification} per reference, between a start and a summary line.
      const lines = (await res.text()).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
      const status = lines.find((l) => l.type === "line")?.verification?.status;
      if (typeof status !== "string") throw new Error("no status in X-ray response");
      return status;
    },
  }),

  /** Naive comparison: "verified" if the DOI resolves in Crossref (or the URL answers 2xx). Not Veracite. */
  baseline: () => ({
    name: "Baseline: DOI-exists check (Crossref lookup / URL status only), NOT Veracite",
    out: "baseline-doi-exists",
    label: "BASELINE, not Veracite: a naive DOI-exists checker, for comparison only. SAMPLE data.",
    async check(rec) {
      if (rec.doi) {
        const res = await fetchRetry(`https://api.crossref.org/works/${encodeURIComponent(rec.doi)}`);
        if (res.status === 404) return "notfound";
        if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
        return "verified";
      }
      if (rec.url) {
        const res = await fetchRetry(rec.url, { redirect: "follow" });
        return res.ok ? "verified" : "notfound";
      }
      return "notfound"; // a DOI-exists checker has nothing to look up
    },
  }),
};

// ---------- run ----------

function loadSets(names, limit) {
  const recs = [];
  const present = [];
  for (const set of names) {
    const meta = SETS[set];
    if (!meta) throw new Error(`unknown set "${set}" (have: ${Object.keys(SETS).join(", ")})`);
    const path = join(GOLDEN, meta.file);
    if (!existsSync(path)) continue;
    const list = JSON.parse(readFileSync(path, "utf8"));
    if (list.length) present.push(set);
    for (const r of list.slice(0, limit)) recs.push({ ...r, set });
  }
  return { recs, present };
}

async function main() {
  const a = args();
  if (a.help || !ADAPTERS[a.adapter]) {
    console.log("usage: node tests/eval/run.mjs --adapter xray|baseline [--base URL] [--sets real,chimeras] [--concurrency 3] [--limit N]");
    process.exit(a.help ? 0 : 1);
  }
  const adapter = ADAPTERS[a.adapter](a);
  const { recs, present } = loadSets(a.sets, a.limit);
  console.log(`${adapter.name}\n${recs.length} golden records from: ${present.join(", ") || "none"}\n`);

  const rows = new Array(recs.length);
  let next = 0;
  async function worker() {
    while (next < recs.length) {
      const i = next++;
      const rec = recs[i];
      const t0 = performance.now();
      try {
        const got = await adapter.check(rec);
        rows[i] = { id: rec.id, set: rec.set, expected: rec.expected, got, ms: Math.round(performance.now() - t0) };
      } catch (e) {
        rows[i] = { id: rec.id, set: rec.set, expected: rec.expected, got: "", ms: Math.round(performance.now() - t0), error: String(e?.message ?? e) };
      }
      const r = rows[i];
      const mark = r.error ? "ERR" : r.got === r.expected ? " ok" : r.got === "verified" && r.expected !== "verified" ? "!!!" : " ~ ";
      console.log(`${mark} ${r.id.padEnd(9)} expected ${r.expected.padEnd(9)} got ${(r.error ? `error: ${r.error}` : r.got).padEnd(10)} ${r.ms} ms`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(a.concurrency, recs.length || 1) }, worker));

  const summary = score(rows);
  if (summary.total === 0 || summary.errors === summary.total) {
    // Never write "0 fakes marked Verified" from a run where nothing was actually checked.
    console.error(`\nNo reference was checked (${summary.errors} errors). Nothing written. Is the server running at ${a.base}?`);
    process.exit(2);
  }
  const report = {
    sample: true,
    adapter: adapter.name,
    label: adapter.label,
    ranAt: new Date().toISOString(),
    sets: present,
    proofLine: proofLine(summary, present),
    summary,
    rows,
  };
  mkdirSync(RESULTS, { recursive: true });
  writeFileSync(join(RESULTS, `${adapter.out}.json`), JSON.stringify(report, null, 2) + "\n");
  writeFileSync(join(RESULTS, `${adapter.out}.md`), toMarkdown(report));
  console.log(`\n${report.proofLine}\n→ tests/results/${adapter.out}.json + .md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
