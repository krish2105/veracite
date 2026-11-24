// Tests for the AI-use statement generator (Z04).
// Run from veracite/: node --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
// All sessions below are SAMPLE data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAiUseStatement, statementFacts, toolReference, OWN_WORK_PLACEHOLDER, VERACITE_TOOL } from "../../src/lib/integrity/statement.ts";

// Builds a shared `Receipt` (src/lib/types.ts). `input`/`output` in the cases below map to `prompt`/`detail`.
const r = (at, actor, action, { input, output, ...extra } = {}) => ({ id: `${actor}@${at}`, sessionId: "s1", at, actor, action, aiUsed: typeof extra.model === "string", ms: 100, ok: true, ...(input === undefined ? {} : { prompt: input }), ...(output === undefined ? {} : { detail: output }), ...extra });

/** A full Assist-mode session, 25 Nov 2026 (Dubai). */
const SESSION = [
  r("2026-11-25T06:00:00Z", "student", "ask"),
  r("2026-11-25T06:00:05Z", "planner", "plan", { model: "openai/gpt-oss-120b", input: "Plan a search on screen time and teen sleep", output: "{...}", tokens: { input: 700, output: 200 } }),
  r("2026-11-25T06:01:00Z", "student", "approve_plan"),
  r("2026-11-25T06:01:10Z", "verifier", "verify", { output: "12 checked" }),
  r("2026-11-25T06:03:00Z", "student", "approve_sources"),
  r("2026-11-25T06:03:01Z", "student", "reject_source"),
  r("2026-11-25T06:03:20Z", "reader", "extract", { model: "llama-3.3-70b-versatile" }),
  r("2026-11-25T06:03:40Z", "scribe", "draft", { model: "llama-3.3-70b-versatile" }),
  r("2026-11-25T06:03:41Z", "scribe", "blocked_citation"),
  r("2026-11-25T06:04:00Z", "skeptic", "challenge", { model: "qwen/qwen3-32b" }),
  r("2026-11-25T06:05:00Z", "student", "approve_claims"),
];
const verified = (opened = true) => ({ verification: { status: "verified", registries: ["Crossref", "OpenAlex"] }, opened });
const SOURCES = [...Array.from({ length: 11 }, () => verified()), { verification: { status: "partial", registries: ["Wayback Machine"] }, opened: false }];
const CLAIMS = [
  ...Array.from({ length: 5 }, () => ({ label: "verified", decision: "kept" })),
  { label: "reported", decision: "edited" },
  { label: "notfound", decision: "dropped" },
];

test("facts are computed from the log only", () => {
  const f = statementFacts({ receipts: SESSION, autonomy: "assist", sources: SOURCES, claims: CLAIMS });
  assert.deepEqual(f.models, ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3-32b"]);
  assert.equal(f.aiCalls, 4);
  assert.equal(f.blockedCitations, 1);
  assert.deepEqual(f.sources, { total: 12, opened: 11, byStatus: { verified: 11, partial: 1 }, registries: ["Crossref", "OpenAlex", "Wayback Machine"] });
  assert.deepEqual(f.claims, { total: 7, kept: 5, edited: 1, dropped: 1, pending: 0 });
  assert.equal(f.decisions.approve_plan, 1);
  assert.deepEqual(f.aiActivities, [
    "proposed a search plan",
    "extracted quoted evidence from the sources",
    "drafted a labelled evidence summary that could cite only sources I had approved",
    "challenged each claim in that summary",
  ]);
});

test("full Assist session produces a complete, honest statement", () => {
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", sources: SOURCES, claims: CLAIMS, ownWork: "I wrote the final essay myself." });
  const t = s.text;
  assert.match(t, /^I used Veracite \(Team 7, 2026\), an AI research assistant, in Assist mode on 25 November 2026 /);
  assert.match(t, /models llama-3\.3-70b-versatile, openai\/gpt-oss-120b and qwen\/qwen3-32b/);
  assert.match(t, /In total 4 AI requests were made; every prompt is listed in the attached Prompt Ledger\./);
  assert.match(t, /12 references in my reference list were checked by code against Crossref, OpenAlex and Wayback Machine: 11 verified and 1 partially confirmed\./);
  assert.match(t, /blocked 1 AI-written citation to sources that had not been retrieved/);
  assert.match(t, /I approved the search plan, chose which sources to keep, rejected 1 suggested source and reviewed the 7 AI-drafted claims and kept 5, edited 1 and dropped 1\./);
  assert.match(t, /I opened 11 of the 12 sources myself\./);
  assert.ok(t.endsWith("I wrote the final essay myself."));
  assert.equal(s.sample, false);
  assert.ok(s.warnings.some((w) => w.includes("not opened 1")));
  assert.ok(s.warnings.some((w) => w.includes("partially confirmed")));
});

test("never claims the student's own work unless the student wrote it", () => {
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", sources: SOURCES, claims: CLAIMS });
  assert.ok(s.text.endsWith(OWN_WORK_PLACEHOLDER));
  // The placeholder itself shows an example sentence; outside it, no authorship claim may appear.
  assert.doesNotMatch(s.text.replace(OWN_WORK_PLACEHOLDER, ""), /I wrote|written by me|my own words/);
  assert.ok(s.warnings.some((w) => w.includes("will not write it for you")));
});

test("Off mode with no AI calls says no generative AI was used", () => {
  const receipts = [r("2026-11-24T08:00:00Z", "verifier", "verify"), r("2026-11-24T08:05:00Z", "student", "open_source")];
  const s = buildAiUseStatement({ receipts, autonomy: "off", sources: [verified()], ownWork: "I wrote everything." });
  assert.match(s.text, /in Off \(reference manager and checker only, no AI\) mode on 24 November 2026 to organise and check references\. No generative AI model was used/);
  assert.doesNotMatch(s.text, /Prompt Ledger/);
  assert.match(s.text, /1 reference in my reference list was checked by code against Crossref and OpenAlex: 1 verified\./);
});

test("warns when the log contradicts the autonomy setting", () => {
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "off", ownWork: "x" });
  assert.ok(s.warnings.some((w) => w.includes("autonomy was set to Off")));
});

test("multi-day sessions give a date range (in Dubai time)", () => {
  const receipts = [r("2026-11-24T21:30:00Z", "student", "ask"), r("2026-11-26T05:00:00Z", "student", "approve_claims")];
  // 21:30Z on the 24th is already 25 Nov in Dubai (UTC+4)
  const s = buildAiUseStatement({ receipts, autonomy: "assist", ownWork: "x" });
  assert.match(s.text, /between 25 November 2026 and 26 November 2026/);
});

test("rules-mode fallbacks and failed calls are disclosed", () => {
  const receipts = [...SESSION, r("2026-11-25T06:06:00Z", "system", "fallback_rules"), r("2026-11-25T06:06:01Z", "system", "fallback_rules")];
  const s = buildAiUseStatement({ receipts, autonomy: "copilot", ownWork: "x" });
  assert.match(s.text, /in Co-pilot mode/);
  assert.match(s.text, /2 steps fell back to rules mode \(no AI\)/);
});

test("unverified references produce a warning", () => {
  const sources = [verified(), { verification: { status: "notfound" }, opened: false }, { verification: { status: "retracted" }, opened: true }];
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", sources, ownWork: "x" });
  assert.match(s.text, /3 references .* 1 verified, 1 could not be found and 1 was retracted\./);
  assert.ok(s.warnings.some((w) => w.startsWith("2 references in your list are not verified")));
});

test("pending claims produce a warning", () => {
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", claims: [{ label: "verified", decision: "pending" }], ownWork: "x" });
  assert.ok(s.warnings.some((w) => w.includes("1 claim has not been reviewed")));
});

test("sample data is labelled SAMPLE (rule 9)", () => {
  const s = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", sources: [{ ...verified(), sample: true }], ownWork: "x" });
  assert.equal(s.sample, true);
  assert.ok(s.text.startsWith("SAMPLE: generated from sample data."));
});

test("same log in → same statement out (deterministic, order-independent)", () => {
  const a = buildAiUseStatement({ receipts: SESSION, autonomy: "assist", sources: SOURCES, claims: CLAIMS, ownWork: "x" });
  const b = buildAiUseStatement({ receipts: [...SESSION].reverse(), autonomy: "assist", sources: SOURCES, claims: CLAIMS, ownWork: "x" });
  assert.equal(a.text, b.text);
});

test("APA 7 software reference for the tool", () => {
  assert.equal(toolReference(VERACITE_TOOL), "Team 7. (2026). Veracite (Version 0.1) [AI research assistant]. SP Jain AI Club Hackathon.");
  assert.equal(
    toolReference({ ...VERACITE_TOOL, url: "https://veracite.example" }),
    "Team 7. (2026). Veracite (Version 0.1) [AI research assistant]. SP Jain AI Club Hackathon. https://veracite.example",
  );
});
