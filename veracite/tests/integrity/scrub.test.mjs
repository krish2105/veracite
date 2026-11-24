// Tests for the PII scrubber (Z05). Run from veracite/: node --test "tests/integrity/*.test.mjs"
// All personal-looking values below are FAKE test values (example.com, test card numbers, sample IBAN).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scrubPII, hasPII } from "../../src/lib/integrity/scrub.ts";

const golden = (f) =>
  JSON.parse(readFileSync(new URL(`../golden/${f}.json`, import.meta.url), "utf8"));

test("removes emails", () => {
  const r = scrubPII("Contact me at test.student+notes@example.ac.ae or a.b@example.com.");
  assert.equal(r.text, "Contact me at [EMAIL] or [EMAIL].");
  assert.deepEqual(r.redactions, [{ kind: "email", count: 2 }]);
});

test("removes UAE and international phone numbers", () => {
  for (const p of ["+971 50 123 4567", "+971-4-123-4567", "00971501234567", "050 123 4567", "050-123-4567", "04 123 4567", "+44 20 7946 0958", "+1 (555) 010-0199"]) {
    const r = scrubPII(`Call ${p} today`);
    assert.equal(r.text, "Call [PHONE] today", `phone not removed: ${p}`);
  }
});

test("removes Emirates ID numbers", () => {
  assert.equal(scrubPII("EID 784-1990-1234567-1.").text, "EID [EMIRATES_ID].");
  assert.equal(scrubPII("EID 784199012345671").text, "EID [EMIRATES_ID]");
});

test("removes Luhn-valid card numbers only", () => {
  assert.equal(scrubPII("card 4111 1111 1111 1111").text, "card [CARD]");
  assert.equal(scrubPII("card 5555-5555-5555-4444").text, "card [CARD]");
  // 16 digits that fail Luhn are left alone (could be a reference or record number)
  assert.equal(scrubPII("id 1234 5678 9012 3450").text, "id 1234 5678 9012 3450");
});

test("removes valid IBANs only", () => {
  assert.equal(scrubPII("IBAN AE07 0331 2345 6789 0123 456").text, "IBAN [IBAN]");
  assert.equal(scrubPII("IBAN AE070331234567890123456").text, "IBAN [IBAN]");
  assert.equal(scrubPII("code AE08 0331 2345 6789 0123 456").text, "code AE08 0331 2345 6789 0123 456");
});

test("removes labelled student IDs and passport numbers, keeps the label", () => {
  assert.equal(scrubPII("Student ID: SPJ20231234").text, "Student ID: [STUDENT_ID]");
  assert.equal(scrubPII("my roll no. 42-117 is").text, "my roll no. [STUDENT_ID] is");
  assert.equal(scrubPII("passport number N1234567").text, "passport number [PASSPORT]");
  assert.equal(scrubPII("passport X9876543").text, "passport [PASSPORT]");
});

test("leaves ordinary prose with years and numbers alone", () => {
  for (const s of [
    "The student 2023 cohort was larger than the 2022 one.",
    "Hospital admission 2019-2020 rose by 12%.",
    "A vaccine passport 2021 policy was introduced.",
    "pp. 1147–1154, n = 1,234, p < .001, 95% CI [0.12, 0.34]",
    "ISBN 978-0-262-03561-3 and arXiv:1706.03762v5",
  ]) {
    assert.equal(scrubPII(s).text, s, `changed: ${s}`);
    assert.equal(hasPII(s), false);
  }
});

test("removes API keys and tokens", () => {
  // Built at runtime so no secret-looking literal sits in the repo.
  const groq = "gsk_" + "A1b2".repeat(12);
  const gh = "ghp_" + "x".repeat(36);
  const jwt = "eyJ" + "a".repeat(20) + "." + "b".repeat(20) + "." + "c".repeat(20);
  const r = scrubPII(`key=${groq} token ${gh} Authorization: Bearer ${"t".repeat(32)} jwt ${jwt}`);
  assert.equal(r.text, "key=[SECRET] token [SECRET] Authorization: Bearer [SECRET] jwt [SECRET]");
  assert.equal(r.total, 4);
});

test("never alters any reference in the golden set (DOIs, pages, years kept)", () => {
  for (const f of ["real", "chimeras", "retracted", "web"]) {
    for (const rec of golden(f)) {
      const r = scrubPII(rec.raw);
      assert.equal(r.text, rec.raw, `${rec.id} was altered: ${r.text}`);
    }
  }
});

test("keeps DOIs even when they look like phone numbers", () => {
  const s = "https://doi.org/10.1016/0021-9150(90)90150-4 and 10.1002/(SICI)1097-0266(199708)18:7<509::AID-SMJ882>3.0.CO;2-Z";
  assert.equal(scrubPII(s).text, s);
});

test("mixed paragraph: scrubs PII, keeps the reference", () => {
  const input =
    "Hi, I'm at test.student@example.com (+971 55 123 4567, Student ID: SPJ2024001). " +
    "Please check Hale, L., & Guan, S. (2015). Sleep Medicine Reviews, 21, 50–58. https://doi.org/10.1016/j.smrv.2014.07.007";
  const r = scrubPII(input);
  assert.equal(
    r.text,
    "Hi, I'm at [EMAIL] ([PHONE], Student ID: [STUDENT_ID]). " +
      "Please check Hale, L., & Guan, S. (2015). Sleep Medicine Reviews, 21, 50–58. https://doi.org/10.1016/j.smrv.2014.07.007",
  );
  assert.equal(r.total, 3);
  assert.ok(!JSON.stringify(r.redactions).includes("example.com"), "redaction report must not contain values");
});
