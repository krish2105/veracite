#!/usr/bin/env node
// Live-link smoke test for Phase 2 (task Z12, playbook step 2:40–2:50). Run from the repo root:
//   node submissions/phase2/smoke.mjs                      # https://veracite.vercel.app
//   node submissions/phase2/smoke.mjs --base http://localhost:3000
// Checks the P0 demo spine on the deployed site with records from the golden set (SAMPLE data):
// pages load, registries answer, a real reference is Verified, fakes / a retraction are NOT Verified,
// the streamed X-ray works, and the web-source check answers. Exit code 1 if anything fails.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(HERE, "..", "..", "veracite", "tests", "golden");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "https://veracite.vercel.app").replace(/\/+$/, "");
const golden = (f, id) => JSON.parse(readFileSync(join(GOLDEN, `${f}.json`), "utf8")).find((r) => r.id === id);

const results = [];
async function check(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ ok: true, name, detail: detail ?? "", ms: Date.now() - t0 });
  } catch (e) {
    results.push({ ok: false, name, detail: e?.message ?? String(e), ms: Date.now() - t0 });
  }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const get = (path, init) => fetch(BASE + path, { ...init, signal: AbortSignal.timeout(45000), headers: { "User-Agent": "veracite-smoke/1.0", ...(init?.headers ?? {}) } });
const verify = async (raw) => {
  const r = await get("/api/sources/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: raw }) });
  must(r.ok, `HTTP ${r.status}`);
  const j = await r.json();
  must(j.ok, j.error ?? "not ok");
  return j.verification.status;
};

console.log(`Smoke test · ${BASE}\n`);

for (const p of ["/", "/xray", "/research", "/library", "/draft", "/trust", "/certificate"]) {
  await check(`page ${p} loads`, async () => {
    const r = await get(p);
    must(r.ok, `HTTP ${r.status}`);
    const html = await r.text();
    must(/veracite/i.test(html), "page doesn't mention Veracite");
    return `HTTP ${r.status}`;
  });
}

await check("health: registries up, AI mode reported", async () => {
  const r = await get("/api/health");
  must(r.ok, `HTTP ${r.status}`);
  const h = await r.json();
  must(h.registries?.crossref !== "down" && h.registries?.openalex !== "down", `registries ${JSON.stringify(h.registries)}`);
  return `crossref ${h.registries.crossref} · openalex ${h.registries.openalex} · arxiv ${h.registries.arxiv} · AI ${h.ai}${h.aiReason ? ` (${h.aiReason})` : ""}`;
});

const cases = [
  ["real reference → verified", golden("real", "real-021"), (s) => s === "verified"],
  ["AI-fabricated (fab-001) → NOT verified", golden("fabricated", "fab-001"), (s) => s !== "verified"],
  ["chimera with someone else's DOI (chim-006) → NOT verified", golden("chimeras", "chim-006"), (s) => s !== "verified"],
  ["retracted, no 'RETRACTED' in title (ret-005) → retracted", golden("retracted", "ret-005"), (s) => s === "retracted"],
];
for (const [name, rec, ok] of cases) {
  await check(name, async () => {
    const s = await verify(rec.raw);
    must(ok(s), `got ${s}`);
    return `got ${s} (golden expects ${rec.expected})`;
  });
}

await check("X-ray streams one line per reference + a summary", async () => {
  const text = [golden("real", "real-022").raw, golden("retracted", "ret-003").raw].join("\n\n");
  const r = await get("/api/sources/xray", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  must(r.ok, `HTTP ${r.status}`);
  const lines = (await r.text()).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
  const refs = lines.filter((l) => l.type === "line");
  const summary = lines.find((l) => l.type === "summary");
  must(refs.length === 2, `${refs.length} result lines`);
  must(summary, "no summary line");
  const got = refs.map((l) => l.verification.status);
  must(got[0] === "verified" && got[1] === "retracted", `got ${got.join(", ")}`);
  return got.join(", ");
});

await check("web-source check: dead page with an archive copy → partial", async () => {
  const rec = golden("web", "web-004");
  const r = await get(`/api/sources/wayback?url=${encodeURIComponent(rec.url)}`);
  must(r.ok, `HTTP ${r.status}`);
  const j = await r.json();
  must(j.ok && j.check.status === "partial", `got ${j.check?.status ?? j.error}`);
  return `partial · live HTTP ${j.check.live.status} · archived ${j.check.archive.available}`;
});

await check("web-source check refuses a private address (SSRF guard)", async () => {
  const r = await get(`/api/sources/wayback?url=${encodeURIComponent("http://169.254.169.254/latest/meta-data")}`);
  must(r.status === 400, `HTTP ${r.status}`);
  return "HTTP 400";
});

const w = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? "✓" : "✖"} ${r.name.padEnd(w)}  ${r.detail}  (${r.ms} ms)`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed${failed ? ` · ${failed} FAILED` : ""}`);
process.exit(failed ? 1 : 0);
