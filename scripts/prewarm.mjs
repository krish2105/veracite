#!/usr/bin/env node
// Pre-warm the live site before the demo (K32, plan step 8). Run from the repo root before 11:00 and again at ~12:20:
//   node scripts/prewarm.mjs                     # https://veracite.vercel.app
//   node scripts/prewarm.mjs --base http://localhost:3000
// It opens every page (so serverless functions start), runs the exact demo checks once (X-ray test list,
// the SAMPLE library file, the research searches, one-click save, the web check) and prints timings.
// Honest limit: Vercel may start fresh instances later, so this shortens cold starts; it cannot promise them away.
// Registries are hit politely: each request once, no loops. Exit code 1 if anything fails.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "https://veracite.vercel.app").replace(/\/+$/, "");
const src = (p) => readFileSync(join(ROOT, "veracite", p), "utf8");
// The same inputs the demo uses, read from the app's own source files.
const TEST_LIST = src("src/components/app/tabs/xray/testList.ts").match(/TEST_LIST = `([\s\S]*?)`;/)[1];
const DEMO_QUESTION = "Does generative AI help or hurt student learning?";
const QUERIES = ["generative AI student learning", "ChatGPT education learning outcomes", "AI tutoring randomized controlled trial"];

const results = [];
async function step(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ ok: true, name, detail: detail ?? "", ms: Date.now() - t0 });
  } catch (e) {
    results.push({ ok: false, name, detail: e?.message ?? String(e), ms: Date.now() - t0 });
  }
}
const must = (c, m) => { if (!c) throw new Error(m); };
const req = (path, init = {}) => fetch(BASE + path, { ...init, signal: AbortSignal.timeout(60000), headers: { "User-Agent": "veracite-prewarm/1.0", "Content-Type": "application/json", ...(init.headers ?? {}) } });
const ndjson = async (r) => (await r.text()).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));

console.log(`Pre-warm · ${BASE} · demo question: "${DEMO_QUESTION}"\n`);

for (const p of ["/", "/xray", "/research", "/draft", "/library", "/trust", "/certificate", "/save"]) {
  await step(`page ${p}`, async () => { const r = await req(p); must(r.ok, `HTTP ${r.status}`); return `HTTP ${r.status}`; });
}
await step("health", async () => {
  const h = await (await req("/api/health")).json();
  return `crossref ${h.registries?.crossref} · openalex ${h.registries?.openalex} · arxiv ${h.registries?.arxiv} · AI ${h.ai}${h.aiReason ? ` (${h.aiReason})` : ""}`;
});
await step("X-ray: the demo test list", async () => {
  const lines = await ndjson(await req("/api/sources/xray", { method: "POST", body: JSON.stringify({ text: TEST_LIST }) }));
  const sum = lines.find((l) => l.type === "summary");
  must(sum, "no summary");
  return Object.entries(sum.byStatus).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ");
});
await step("Scout: the research searches", async () => {
  const r = await req("/api/sources/search", { method: "POST", body: JSON.stringify({ queries: QUERIES }) });
  must(r.ok, `HTTP ${r.status}`);
  const j = await r.json();
  must(j.ok, j.error);
  const c = j.candidates ?? [];
  return `${c.length} candidates, ${c.filter((x) => x.verification?.status === "verified").length} verified`;
});
await step("One-click save: a DOI", async () => {
  const j = await (await req("/api/sources/verify", { method: "POST", body: JSON.stringify({ input: "https://doi.org/10.1073/pnas.2422633122" }) })).json();
  must(j.ok, j.error);
  return j.verification.status;
});
await step("Web check: a live page", async () => {
  const j = await (await req(`/api/sources/wayback?url=${encodeURIComponent("https://www.crossref.org/documentation/retrieve-metadata/rest-api/")}`)).json();
  must(j.ok, j.error);
  return j.check.status;
});

const w = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? "✓" : "✖"} ${r.name.padEnd(w)}  ${r.detail}  (${r.ms} ms)`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} warmed${failed ? ` · ${failed} FAILED: fix or use the SAMPLE fallback` : ""}`);
process.exit(failed ? 1 : 0);
