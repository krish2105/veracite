// Tests for the Verification Certificate (Z08).
// Run from veracite/: node --no-warnings --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
// Uses the 30 real references from tests/golden/real.json (SAMPLE data).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonicalJSON,
  certificateHash,
  encodeCertificate,
  decodeCertificate,
  certificateLink,
  certificateQR,
  certificateFromSources,
  validateCertificate,
  summariseCertificate,
  reverifyCertificate,
  QR_MAX_BYTES,
} from "../../src/lib/integrity/certificate.ts";

const real = JSON.parse(readFileSync(new URL("../golden/real.json", import.meta.url), "utf8"));

/** Turn a golden APA string into the fields a library item would have. */
const toSource = (rec) => ({
  doi: rec.doi,
  title: rec.raw.split(/\)\. /)[1].split(/\. (?=[A-Z])/)[0],
  authors: [{ family: rec.raw.split(",")[0] }],
  year: Number(rec.raw.match(/\((\d{4})\)/)[1]),
  verification: { status: "verified", registries: ["Crossref", "OpenAlex"] },
  sample: true,
});

const ISSUED = "2026-11-25T06:44:00Z";
const CERT = certificateFromSources(real.slice(0, 12).map(toSource), { issuedAt: ISSUED, title: "Does screen time before bed reduce sleep quality in teenagers?", autonomy: "assist" });

test("built from library items: DOI, title, first author, year, status; no student name field", () => {
  assert.equal(CERT.refs.length, 12);
  assert.deepEqual(CERT.refs[1], {
    doi: "10.1016/j.jadohealth.2024.06.006",
    title: "Bedtime screen use behaviors and sleep outcomes in early adolescents: A prospective cohort study",
    firstAuthor: "Nagata",
    year: 2024,
    status: "verified",
  });
  assert.deepEqual(CERT.registries, ["Crossref", "OpenAlex"]);
  assert.equal(CERT.sample, true);
  assert.ok(!/student|name|email/i.test(Object.keys(CERT).join(",")));
});

test("round trip: encode → decode gives back the same certificate and hash", async () => {
  const token = await encodeCertificate(CERT);
  assert.match(token, /^v1\.[A-Za-z0-9_-]+\.[0-9a-f]{16}$/);
  const d = await decodeCertificate(token);
  assert.equal(d.ok, true);
  assert.deepEqual(d.cert, CERT);
  assert.equal(d.hash, await certificateHash(CERT));
});

test("the link puts the data after # (never sent to a server); 12 references keep their titles", async () => {
  const link = await certificateLink("https://veracite.example/", CERT);
  assert.ok(link.url.startsWith("https://veracite.example/certificate#v1."));
  assert.equal(link.compact, false);
  assert.equal(link.fitsQr, true);
  const d = await decodeCertificate(link.url);
  assert.equal(d.ok, true);
  assert.equal(d.hash, link.hash, "printed hash = hash of what the link holds");
  assert.equal(d.cert.refs[0].title, CERT.refs[0].title);
});

test("30 references don't fit with titles, so the link goes compact and fits in one QR code", async () => {
  const all = certificateFromSources(real.map(toSource), { issuedAt: ISSUED });
  const link = await certificateLink("https://veracite.vercel.app", all);
  assert.equal(link.compact, true);
  assert.ok(link.fitsQr, `${link.bytes} bytes`);
  const d = await decodeCertificate(link.url);
  assert.equal(d.ok, true);
  assert.equal(d.cert.refs.length, 30);
  assert.equal(d.cert.refs[0].title, undefined, "DOI titles dropped; they come back on live re-check");
  assert.equal(d.cert.refs[0].doi, "10.1111/jsr.13666");
  assert.equal(d.hash, link.hash);
  const png = await certificateQR(link.url);
  assert.match(png, /^data:image\/png;base64,/);
});

test("a link too long for a QR code is refused with a plain reason", async () => {
  await assert.rejects(() => certificateQR("https://x.example/certificate#" + "a".repeat(QR_MAX_BYTES)), /QR code holds at most/);
});

test("a damaged link is detected", async () => {
  const token = await encodeCertificate(CERT);
  const [v, data, h] = token.split(".");
  const flipped = data.slice(0, 40) + (data[40] === "A" ? "B" : "A") + data.slice(41);
  const d1 = await decodeCertificate(`${v}.${flipped}.${h}`);
  assert.equal(d1.ok, false);
  const d2 = await decodeCertificate(`${v}.${data}.0000000000000000`);
  assert.equal(d2.ok, false);
  assert.match(d2.error, /doesn't match its fingerprint/);
  const d3 = await decodeCertificate(token.slice(0, token.length - 30));
  assert.equal(d3.ok, false);
});

test("junk input never throws", async () => {
  for (const junk of ["", "hello", "v1..", "v2.abc.def", "v1.!!!.0123456789abcdef", "https://x/certificate#", "v1." + "A".repeat(30000) + ".0"]) {
    const d = await decodeCertificate(junk);
    assert.equal(d.ok, false, junk.slice(0, 20));
    assert.equal(typeof d.error, "string");
  }
});

test("hash is the same whatever order the keys were written in", async () => {
  const shuffled = { refs: CERT.refs.map((r) => ({ status: r.status, year: r.year, title: r.title, firstAuthor: r.firstAuthor, doi: r.doi })), v: 1, title: CERT.title, issuedAt: ISSUED, autonomy: "assist", sample: true, registries: CERT.registries };
  assert.equal(await certificateHash(shuffled), await certificateHash(CERT));
  assert.equal(canonicalJSON({ b: 1, a: [2, { d: undefined, c: 3 }] }), '{"a":[2,{"c":3}],"b":1}');
});

test("an edited link with a recomputed fingerprint decodes, but live re-verification exposes it", async () => {
  // Honest limit: the hash is not a signature. Someone flips a "notfound" to "verified"…
  const forged = { ...CERT, refs: [...CERT.refs, { doi: "10.9999/made.up.2024", title: "A paper that does not exist", year: 2024, status: "verified" }] };
  const d = await decodeCertificate(await encodeCertificate(forged));
  assert.equal(d.ok, true);
  // …but the professor's browser re-checks every reference against the registries.
  const registry = async (ref) => ({ status: ref.doi === "10.9999/made.up.2024" ? "notfound" : "verified" });
  const r = await reverifyCertificate(d.cert, registry, { now: () => "2026-11-26T08:00:00Z" });
  assert.equal(r.stillVerified, false);
  assert.equal(r.changed, 1);
  assert.deepEqual(r.items.filter((x) => x.changed).map((x) => [x.then, x.now]), [["verified", "notfound"]]);
});

test("re-verification reports retractions since issue and survives network errors", async () => {
  const verify = async (ref) => {
    if (ref.doi === CERT.refs[0].doi) return { status: "retracted" };
    if (ref.doi === CERT.refs[1].doi) throw new Error("network down");
    return { status: "verified" };
  };
  const r = await reverifyCertificate(CERT, verify, { concurrency: 3, now: () => "2026-11-26T08:00:00Z" });
  assert.equal(r.items.length, 12);
  assert.equal(r.items[0].now, "retracted");
  assert.equal(r.items[0].changed, true);
  assert.equal(r.items[1].now, "error");
  assert.equal(r.items[1].changed, false);
  assert.equal(r.errors, 1);
  assert.equal(r.stillVerified, false);
  assert.equal(r.checkedAt, "2026-11-26T08:00:00Z");
});

test("validation rejects unsafe or malformed data", () => {
  const ok = { v: 1, issuedAt: ISSUED, refs: [{ doi: "10.1038/nature14539", title: "Deep learning", status: "verified" }] };
  assert.doesNotThrow(() => validateCertificate(ok));
  const bad = (patch, msg) => assert.throws(() => validateCertificate({ ...ok, ...patch }), msg);
  bad({ v: 2 }, /version/);
  bad({ issuedAt: "yesterday" }, /issue date/);
  bad({ refs: [] }, /no references/);
  bad({ refs: [{ url: "javascript:alert(1)", title: "x", status: "verified" }] }, /bad URL/);
  bad({ refs: [{ doi: "not-a-doi", title: "x", status: "verified" }] }, /bad DOI/);
  bad({ refs: [{ doi: "10.1038/nature14539", title: "x", status: "trust-me" }] }, /unknown status/);
  bad({ refs: [{ title: "x", status: "verified" }] }, /no DOI or URL/);
  bad({ refs: [{ url: "https://example.org", status: "verified" }] }, /no title/); // web sources always need a title
  assert.doesNotThrow(() => validateCertificate({ ...ok, refs: [{ doi: "10.1038/nature14539", status: "verified" }] }));
  bad({ refs: [{ doi: "10.1038/nature14539", title: "x", year: 3000, status: "verified" }] }, /bad year/);
});

test("web sources use their URL; unknown statuses become notfound", () => {
  const c = certificateFromSources(
    [
      { url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research", title: "Guidance for generative AI in education and research", year: 2023, verification: { status: "partial" } },
      { doi: "https://doi.org/10.1038/nature14539", title: "Deep learning", verification: { status: "weird" } },
    ],
    { issuedAt: ISSUED },
  );
  assert.equal(c.refs[0].url.startsWith("https://www.unesco.org"), true);
  assert.equal(c.refs[1].doi, "10.1038/nature14539");
  assert.equal(c.refs[1].status, "notfound");
  assert.equal(c.sample, undefined);
});

test("summary counts every status", () => {
  const s = summariseCertificate({ ...CERT, refs: [...CERT.refs, { ...CERT.refs[0], status: "retracted" }] });
  assert.equal(s.total, 13);
  assert.equal(s.byStatus.verified, 12);
  assert.equal(s.byStatus.retracted, 1);
  assert.equal(s.allVerified, false);
  assert.equal(summariseCertificate(CERT).allVerified, true);
});
