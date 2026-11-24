// Tests for the bias & diversity lens (Z10).
// Run from veracite/: node --no-warnings --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
// fixtures/openalex-golden.json = live OpenAlex records (24 Nov 2026) for the 30 references in
// tests/golden/real.json, with author names removed. SAMPLE data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractBiasFacts, summariseBias, regionOf, countryName, countryInSentence } from "../../src/lib/integrity/bias.ts";

const { works } = JSON.parse(readFileSync(new URL("./fixtures/openalex-golden.json", import.meta.url), "utf8"));
const byId = (id) => works.find((w) => w.golden_id === id);
const OPT = { currentYear: 2026 };
const levels = (s, dim) => s.notes.filter((n) => n.dimension === dim).map((n) => n.level);

test("fixture covers all 30 golden references", () => {
  assert.equal(works.length, 30);
});

test("extracts countries, year, open access, publisher from a real OpenAlex record", () => {
  const f = extractBiasFacts(byId("real-001")); // Bani-Issa et al., UAE sleep study
  assert.equal(f.id, "https://doi.org/10.1111/jsr.13666");
  assert.equal(f.year, 2022);
  assert.deepEqual(f.countries, ["AE", "AU", "BN", "JO", "MY"]);
  assert.deepEqual(f.regions, ["East Asia & Pacific", "Middle East & North Africa"]);
  assert.equal(f.openAccess, true);
  assert.equal(f.oaStatus, "green");
  assert.equal(f.publisher, "Wiley");
  assert.equal(f.venue, "Journal of Sleep Research");
  assert.equal(f.language, "en");
});

test("falls back to institution country codes when authorships[].countries is missing", () => {
  const f = extractBiasFacts({ authorships: [{ institutions: [{ country_code: "ae" }, { country_code: null }] }, { countries: [] }] });
  assert.deepEqual(f.countries, ["AE"]);
});

test("missing fields become null / empty, never invented", () => {
  const f = extractBiasFacts({});
  assert.deepEqual(f, { id: "", year: null, countries: [], regions: [], openAccess: null, oaStatus: null, publisher: null, venue: null, language: null });
});

test("regions and country names", () => {
  assert.equal(regionOf("AE"), "Middle East & North Africa");
  assert.equal(regionOf("tr"), "Europe & Central Asia");
  assert.equal(regionOf("ZZ"), "Other");
  assert.equal(countryName("AE"), "United Arab Emirates");
  assert.equal(countryInSentence("US"), "the United States");
  assert.equal(countryInSentence("BR"), "Brazil");
});

test("the 20 ChatGPT references: international, recent, open → no warnings", () => {
  const s = summariseBias(works.slice(0, 20), OPT);
  assert.equal(s.total, 20);
  assert.equal(s.countries.bars[0].key, "CN");
  assert.equal(s.countries.bars.at(-1).key, "other");
  assert.equal(s.countries.topTwoPct, 35);
  assert.equal(s.years.median, 2024);
  assert.equal(s.years.recentPct, 90);
  assert.equal(s.openAccess.pct, 95);
  assert.ok(s.regions.bars.some((b) => b.key === "Middle East & North Africa"));
  assert.deepEqual(s.notes.filter((n) => n.level === "warn"), []);
  assert.deepEqual(levels(s, "countries"), ["good"]);
  assert.deepEqual(levels(s, "years"), ["good"]);
});

test("the 10 hand-picked classics: US-heavy and old → country + recency warnings, MENA note", () => {
  const s = summariseBias(works.slice(20), OPT);
  assert.equal(s.countries.bars[0].key, "US");
  assert.equal(s.countries.bars[0].pct, 80);
  assert.equal(s.years.median, 2003);
  const text = s.notes.map((n) => `${n.level}:${n.text}`);
  assert.ok(text.includes("warn:80% of your sources have authors from the United States. Look for studies from other countries."));
  assert.ok(text.includes("warn:Half your sources are from 2003 or earlier. Check whether newer studies changed the picture."));
  assert.ok(text.includes("info:No sources from Middle East & North Africa. If your topic is local, look for regional studies."));
});

test("year bars always list all four bins in order (matches the Library tab)", () => {
  const s = summariseBias(works, OPT);
  assert.deepEqual(s.years.bars.map((b) => b.key), ["≤2015", "2016–19", "2020–22", "2023+"]);
  assert.equal(s.years.bars.reduce((t, b) => t + b.count, 0), 30);
});

test("two-country concentration warning", () => {
  const mk = (c) => ({ publication_year: 2024, authorships: [{ countries: [c] }] });
  const s = summariseBias([mk("US"), mk("US"), mk("GB"), mk("GB"), mk("GB"), mk("FR")], OPT);
  assert.equal(s.countries.topTwoPct, 83);
  assert.ok(s.notes.some((n) => n.level === "warn" && n.text === "83% of your sources come from two countries (the United Kingdom and the United States). Consider studies from other regions."));
});

test("single-region warning", () => {
  const mk = (c) => ({ publication_year: 2024, authorships: [{ countries: [c] }] });
  const s = summariseBias([mk("US"), mk("CA"), mk("US"), mk("CA")], OPT);
  assert.ok(s.notes.some((n) => n.dimension === "regions" && n.level === "warn" && n.text.includes("one region (North America)")));
});

test("old evidence: under 20% recent → warning", () => {
  const s = summariseBias([2001, 2005, 2010, 2012, 2024].map((y) => ({ publication_year: y })), OPT);
  assert.equal(s.years.recentPct, 20);
  const s2 = summariseBias([2001, 2005, 2010, 2012, 2013].map((y) => ({ publication_year: y })), OPT);
  assert.equal(s2.years.recentPct, 0);
  assert.ok(s2.notes.some((n) => n.dimension === "years" && n.text.startsWith("Only 0% of your sources are from 2022 or later (median year 2010)")));
});

test("low open access → warning; publisher dominance → info", () => {
  const mk = (oa) => ({ open_access: { is_oa: oa, oa_status: oa ? "gold" : "closed" }, primary_location: { source: { host_organization_name: "Elsevier BV" } } });
  const s = summariseBias([mk(false), mk(false), mk(false), mk(true)], OPT);
  assert.equal(s.openAccess.pct, 25);
  assert.ok(s.notes.some((n) => n.dimension === "openAccess" && n.level === "warn" && n.text.startsWith("Only 25% open access")));
  assert.ok(s.notes.some((n) => n.dimension === "publishers" && n.text === "100% of your sources are published by Elsevier BV."));
});

test("non-English sources are counted as a positive", () => {
  const s = summariseBias(["en", "en", "ar", "fr"].map((l) => ({ language: l })), OPT);
  assert.deepEqual(s.languages.bars.map((b) => b.label), ["English", "Arabic", "French"]);
  assert.ok(s.notes.some((n) => n.dimension === "languages" && n.text === "2 sources are not in English."));
});

test("too few sources → no warnings, just an info note", () => {
  const s = summariseBias(works.slice(20, 22), OPT);
  assert.deepEqual(s.notes, [{ dimension: "sample", level: "info", text: "Only 2 sources: too few to judge balance." }]);
  assert.deepEqual(summariseBias([], OPT).notes, [{ dimension: "sample", level: "info", text: "No sources yet." }]);
});

test("unknown values are counted separately, not guessed", () => {
  const s = summariseBias([{ publication_year: 2024 }, { publication_year: 2025, authorships: [{ countries: ["AE"] }] }], OPT);
  assert.equal(s.countries.unknown, 1);
  assert.equal(s.countries.bars[0].pct, 100); // % of sources with a known country
  assert.equal(s.openAccess.unknown, 2);
});

test("accepts pre-extracted facts as well as raw works", () => {
  const a = summariseBias(works, OPT);
  const b = summariseBias(works.map(extractBiasFacts), OPT);
  assert.deepEqual(a, b);
});
