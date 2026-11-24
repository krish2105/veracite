// Tests for the Prompt Ledger (Z04).
// Run from veracite/: node --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
// All data below is SAMPLE data; personal-looking values are fake (example.com).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLedger, ledgerToMarkdown, ledgerToCSV, ledgerToJSON, verifyLedgerJSON, sha256Hex } from "../../src/lib/integrity/ledger.ts";

// Builds a shared `Receipt` (src/lib/types.ts). `input`/`output` in the cases below map to `prompt`/`detail`.
const r = (at, actor, action, { input, output, ...extra } = {}) => ({ id: `${actor}@${at}`, sessionId: "s1", at, actor, action, aiUsed: typeof extra.model === "string", ms: 120, ok: true, ...(input === undefined ? {} : { prompt: input }), ...(output === undefined ? {} : { detail: output }), ...extra });

const RECEIPTS = [
  r("2026-11-25T06:03:40Z", "scribe", "draft", { model: "llama-3.3-70b-versatile", input: "Draft a brief citing only [S1,S2]", output: "S1 reports shorter sleep…", tokens: { input: 1200, output: 300 } }),
  r("2026-11-25T06:00:00Z", "student", "ask", { input: "my question" }),
  r("2026-11-25T06:00:05Z", "planner", "plan", { model: "openai/gpt-oss-120b", input: "Plan a search on screen time and teen sleep", output: '{"queries":["screen time sleep adolescents"]}', tokens: { input: 700, output: 200 } }),
  r("2026-11-25T06:01:10Z", "verifier", "verify", { output: "12 checked" }),
  r("2026-11-25T06:04:00Z", "skeptic", "challenge", { model: "qwen/qwen3-32b", input: "Challenge claim C3", output: "", ok: false, ms: 30000 }),
];

test("ledger contains only AI calls, in time order, numbered", () => {
  const l = buildLedger(RECEIPTS);
  assert.deepEqual(l.map((e) => [e.n, e.actor, e.model]), [
    [1, "planner", "openai/gpt-oss-120b"],
    [2, "scribe", "llama-3.3-70b-versatile"],
    [3, "skeptic", "qwen/qwen3-32b"],
  ]);
  assert.equal(l[2].ok, false);
});

test("prompts are scrubbed again at export (second line of defence)", () => {
  const leaky = [r("2026-11-25T06:00:00Z", "planner", "plan", { model: "m", input: "I am test.student@example.com, call +971 50 123 4567", output: "ok" })];
  const [e] = buildLedger(leaky);
  assert.equal(e.prompt, "I am [EMAIL], call [PHONE]");
  assert.equal(e.redactedAtExport, 2);
  assert.match(ledgerToMarkdown([e], { exportedAt: "2026-11-25T07:00:00Z" }), /2 personal-data item\(s\) removed at export/);
});

test("Markdown export: header, every prompt fenced, SAMPLE label", () => {
  const md = ledgerToMarkdown(buildLedger(RECEIPTS), { exportedAt: "2026-11-25T07:00:00Z", sample: true });
  assert.ok(md.startsWith("> **SAMPLE**"));
  assert.match(md, /# Prompt Ledger/);
  assert.match(md, /Exported: 25 Nov 2026, 11:00:00 \(Asia\/Dubai\) · 3 AI requests · Models: llama-3\.3-70b-versatile, openai\/gpt-oss-120b, qwen\/qwen3-32b/);
  assert.match(md, /## 1\. planner · plan\n\n25 Nov 2026, 10:00:05 · `openai\/gpt-oss-120b` · 120 ms · 700 in \/ 200 out tokens · ok/);
  assert.match(md, /```text\nPlan a search on screen time and teen sleep\n```/);
  assert.match(md, /30000 ms · failed/);
});

test("Markdown export: a prompt containing ``` cannot break out of its fence", () => {
  const tricky = [r("2026-11-25T06:00:00Z", "reader", "extract", { model: "m", input: "abc\n```\n# Fake heading\n```", output: "x" })];
  const md = ledgerToMarkdown(buildLedger(tricky), { exportedAt: "2026-11-25T07:00:00Z" });
  assert.match(md, /````text\nabc\n```\n# Fake heading\n```\n````/);
});

test("Markdown export: empty session says so", () => {
  const md = ledgerToMarkdown([], { exportedAt: "2026-11-25T07:00:00Z" });
  assert.match(md, /0 AI requests · Models: none/);
  assert.match(md, /_No AI model was called in this session\._/);
});

test("Markdown export truncates very long responses but JSON keeps them", async () => {
  const long = [r("2026-11-25T06:00:00Z", "scribe", "draft", { model: "m", input: "p", output: "y".repeat(2000) })];
  const entries = buildLedger(long);
  assert.match(ledgerToMarkdown(entries, { exportedAt: "2026-11-25T07:00:00Z" }), /…\[truncated; full text in the JSON export\]/);
  assert.equal((await ledgerToJSON(entries)).entries[0].response.length, 2000);
});

test("CSV export: header, quoting, and spreadsheet-formula neutralisation", () => {
  const evil = [r("2026-11-25T06:00:00Z", "reader", "extract", { model: "m", input: '=HYPERLINK("http://x","click")', output: 'He said "hi", then left\nnew line' })];
  const csv = ledgerToCSV(buildLedger(evil));
  const [header, row] = csv.split("\r\n");
  assert.equal(header, "n,at,actor,action,model,ok,ms,tokens_in,tokens_out,prompt,response,redacted_at_export");
  assert.ok(row.includes(`"'=HYPERLINK(""http://x"",""click"")"`), "formula must be prefixed with ' and quotes doubled");
  assert.ok(csv.includes('"He said ""hi"", then left\nnew line"'));
});

test("JSON export carries a SHA-256 that detects edits", async () => {
  const doc = await ledgerToJSON(buildLedger(RECEIPTS), { exportedAt: "2026-11-25T07:00:00Z" });
  assert.equal(doc.format, "veracite.prompt-ledger/1");
  assert.match(doc.sha256, /^[0-9a-f]{64}$/);
  assert.equal(await verifyLedgerJSON(doc), true);
  const tampered = structuredClone(doc);
  tampered.entries[0].prompt = "something else";
  assert.equal(await verifyLedgerJSON(tampered), false);
});

test("sha256Hex matches the standard test vector", async () => {
  assert.equal(await sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
