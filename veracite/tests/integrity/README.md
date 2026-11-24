# Integrity tests (owner: Zedan · Z04, Z05)

Tests for `src/lib/integrity/`:
| Module | Task | What |
|---|---|---|
| `scrub.ts` | Z05 | PII scrubber |
| `injection.ts` | Z05 | Injection detector + untrusted wrapper |
| `receipts.ts` | Z04 | `Receipt` type (= docs/03 §7) + the actor/action names the Clerk reads |
| `statement.ts` | Z04 | AI-use statement generator (APA 2025 + SP Jain §h(viii)) |
| `ledger.ts` | Z04 | Prompt Ledger: Markdown / CSV / JSON + SHA-256 |
| `paraphrase.ts` | Z09 | Paraphrase guard: 5-gram overlap vs source, quote check, highlighted spans |
| `certificate.ts` | Z08 | Verification Certificate: bibliography → compressed link + SHA-256 + QR; decode, validate, live re-verify |
| `bias.ts` | Z10 | Bias & diversity lens from OpenAlex: countries, regions, years, open access, publishers, languages + plain notes |

No test framework needed: Node 24's built-in runner runs TypeScript directly. `ts-resolve.mjs` lets it follow the extension-less imports Next.js uses.

```bash
cd veracite
node --no-warnings --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
```
103 tests. `fixtures/openalex-golden.json` holds live OpenAlex records (24 Nov 2026, author names removed) for the 30 golden real references. The tests include a **no-false-alarm check over every reference in the golden set** (`tests/golden/*.json`): the scrubber must not change any of them, and the detector must not flag any of them.

*(Without `--no-warnings` a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning appears. Adding `"type": "module"` to `package.json` would remove it, but that file is Krishna's.)*

## For the orchestrator + export (Krishna K09, Avighna A06)
Log these `action` names so the statement can count them (see `ACTIONS` in `receipts.ts`):
`approve_plan`, `approve_sources`, `approve_claims`, `reject_source`, `keep_claim`/`edit_claim`/`drop_claim`, `open_source` (actor `student`); `blocked_citation` (Scribe whitelist hit), `fallback_rules`, `injection_flagged` (actor `gateway`). Every AI call must set `model`.
```ts
import { buildAiUseStatement } from "@/lib/integrity/statement";
import { buildLedger, ledgerToMarkdown, ledgerToCSV, ledgerToJSON } from "@/lib/integrity/ledger";

const s = buildAiUseStatement({ receipts, autonomy, sources, claims, ownWork });
// s.text → paste box · s.toolReference → add to the APA list · s.warnings → show before export
const ledger = buildLedger(receipts);
const md = ledgerToMarkdown(ledger, { sample });   // attach to the assignment
const json = await ledgerToJSON(ledger, { sample }); // json.sha256 = tamper evidence
```
## For the Certificate page (Zedan, once K01 splits the tabs) + Verifier hook (Krishna, K04)
```ts
import { certificateFromSources, certificateLink, certificateQR, decodeCertificate, reverifyCertificate } from "@/lib/integrity/certificate";

// Student side (export)
const cert = certificateFromSources(approvedSources, { issuedAt: new Date().toISOString(), title, autonomy });
const link = await certificateLink(window.location.origin, cert);  // { url, hash, compact, fitsQr }
const qr = await certificateQR(link.url);                           // PNG data URL; print link.hash under it

// Professor side (/certificate#v1.…)
const d = await decodeCertificate(window.location.hash);            // never throws; d.ok / d.error
if (d.ok) {
  const r = await reverifyCertificate(d.cert, (ref) => verifyLive(ref)); // verifyLive = Krishna's Verifier
  // r.items[i].then / .now / .changed  ·  r.stillVerified  ·  r.errors
}
```
- The data lives after `#`, so it never reaches a server. No student name is stored.
- Up to ~12 references keep their titles; bigger bibliographies switch to **compact** (DOI references without titles) so they still fit one QR code (30 golden references: fits). The page should fill in titles from the live re-check.
- The SHA-256 matches a printed copy to its link and catches damaged scans. It is **not a signature**: anyone could edit the data and recompute it. That's why `reverifyCertificate` re-checks every DOI live; a forged "verified" is caught (tested).
- Decoded data is untrusted: render as text only (React does this by default).

## For the Library tab bias cards (Avighna, A05)
```ts
import { summariseBias } from "@/lib/integrity/bias";

const s = summariseBias(openAlexWorks);  // raw OpenAlex Work objects from Krishna's client
// s.countries.bars / s.years.bars / s.openAccess / s.publishers.bars → { label, count, pct }
// s.notes → [{ level: "warn" | "info" | "good", text }]  e.g. "80% of your sources have authors from the United States…"
```
Facts, not scores: nothing is ranked or hidden. Warnings only appear with ≥ 4 sources. Year bins match the current Library card (≤2015, 2016–19, 2020–22, 2023+). The "no local evidence" note defaults to Middle East & North Africa (`homeRegion` option).

## For the Draft Checker (Krishna, K10)
```ts
import { checkAgainstSources } from "@/lib/integrity/paraphrase";

// draft = the pasted paragraph; texts = abstract / open full text of each source it cites
const { verdict, results } = checkAgainstSources(draft, texts.map((t) => ({ id: t.sourceId, text: t.text })));
// results[i].spans → highlight (start/end are offsets in `draft`) · .message → show under the paragraph
// results[i].quotes[j].inSource === false → "this quote isn't in the source"
```
Verdicts: `copied` (≥ 50% overlap or a 15-word run), `close` (≥ 20% or an 8-word run), `ok`. Quoted text is excluded and checked instead. Catches patchwriting (copied runs with small edits); **does not** catch synonym-swapping or reordered ideas.

The statement never writes the student's authorship sentence: `ownWork` must come from a text box the student fills in; otherwise a marked placeholder and a warning appear.

## For the LLM gateway (Krishna, K06)
```ts
import { scrubPII } from "@/lib/integrity/scrub";
import { wrapUntrusted, UNTRUSTED_SYSTEM_RULE } from "@/lib/integrity/injection";

// 1. Anything the student typed → scrub before it leaves the server
const q = scrubPII(studentQuestion);            // q.text, q.redactions (kinds + counts only)

// 2. Any paper / web text → wrap as untrusted data
const src = wrapUntrusted(abstract, doi);        // src.wrapped, src.scan.findings

const messages = [
  { role: "system", content: `${agentPrompt}\n\n${UNTRUSTED_SYSTEM_RULE}` },
  { role: "user", content: `${q.text}\n\n${src.wrapped}` },
];
// 3. If src.scan.flagged → add each finding to the session as a Skeptic S8 finding,
//    and record q.redactions in the Prompt Ledger ("2 emails removed").
```
Run `scrubPII` on the wrapped source text too if it can contain personal data (e.g. pasted drafts).

## What it does and doesn't catch
| | Catches | Doesn't |
|---|---|---|
| **Scrubber** | Emails; UAE + international phones; Emirates ID; Luhn-valid cards; mod-97-valid IBANs; labelled student IDs / passports; Groq/OpenAI/GitHub/AWS/Google keys, JWTs, Bearer tokens | **Names** (references are full of author names that must stay; the gateway never sends the student's name). Unlabelled ID numbers. Street addresses |
| **Detector** | "Ignore previous instructions" family; new/fake instructions; role changes / jailbreak modes; fake chat markup (`<\|im_start\|>`, `[INST]`, `System:`); requests to reveal prompts/keys; **verdict tampering** ("mark this as verified"); citation steering; off-task actions; hidden zero-width / bidi / Unicode-tag characters; full-width look-alikes (NFKC); long encoded blobs | Paraphrased or non-English attacks; instructions inside images; anything clever enough to dodge regexes. It is a tripwire. The real defence is the architecture: the Verifier has no prompt, and the Scribe may only cite IDs that code retrieved |

**Known false positive (accepted, tested):** second-person tutorial prose such as "you are now familiar with…" is flagged. A false alarm only shows the student an S8 finding; a miss would let an attack through.
