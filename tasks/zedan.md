# Zedan Nasir Parol · Trust, Ethics & QA Lead

**Owns:** golden test set and measured results, integrity features (AI-use statement, Prompt Ledger, export gate, certificate, PII scrubber), Trust Center, prompt log. **Demo segment:** 5:30–7:00 (export, governance, Rules mode). **Q&A lead:** ethics, privacy, policy, testing. **Quiz:** ethics, regulation, UAE and global AI policy.
**Start here:** [`docs/onboarding/ZEDAN_START.md`](../docs/onboarding/ZEDAN_START.md) · then `docs/11_BUILD_PLAN.md` (the plan we follow) → `docs/HANDOFF.md` → `docs/05_ETHICS_GOVERNANCE_GUARDRAILS.md`.
**Milestones:** M0 Tue 23:59 · **M1 Wed 13:00** · **M2 Wed 19:00 (Trust Center shows measured numbers)** · M3 Wed 23:00. No P1 work until your P0s are merged.

## Tuesday night · no app code needed yet
- [x] **Z01** · P0 · Golden test set: 30 real references (check each DOI by hand), 20 AI-fabricated (generate with ChatGPT/Gemini and log the prompts), 10 chimeras, 5 retracted (real retracted DOIs), 5 web pages. Format in `veracite/tests/golden/README.md` · `veracite/tests/golden/**` · due Wed 09:00 · #honesty
    - Every record has `"sample": true`. No personal data.
    - 24 Nov: done. **51 records**: 30 real, 1 AI-fabricated, 10 chimeras, 5 retracted, 5 web; every DOI checked in Crossref. ChatGPT (5 prompts) and Gemini (2) refused to fabricate and slipped once (`fab-001`); decided to keep the 1 genuine fake rather than pad. Status spelling matches `types.ts` (`notfound`).
- [ ] **Z02** · P0 · Keep `docs/PROMPT_LOG.md` complete for all three of us (hackathon rule 8): add your own and Avighna's prompts · `docs/PROMPT_LOG.md` · due ongoing · #deck #pres

## Wednesday morning · guards and disclosure (M1)
- [x] **Z05** · P0 · PII scrubber + prompt-injection detector (pure functions + tests). Krishna's LLM gateway calls them. Start Tuesday night if Z01 is done · `veracite/src/lib/integrity/scrub* veracite/src/lib/integrity/injection*` · due Wed 11:00 · #honesty
    - If Groq's console shows `meta-llama/llama-prompt-guard-2-86m` as free, Krishna's gateway can call it as a second layer; your regex detector stays the always-on first layer.
    - 24 Nov: `scrub.ts` + `injection.ts`; usage for K06 in `veracite/tests/integrity/README.md`.
- [x] **Z04** · P0 · Integrity library: AI-use statement generator from the Receipts log (APA 2025 + SP Jain §h(viii)), Prompt Ledger export. Build against the `Receipt` type in `src/lib/types.ts` · `veracite/src/lib/integrity/**` · due Wed 13:00 · #honesty #research
    - 24 Nov: `statement.ts` + `ledger.ts` built on the shared `Receipt` in `types.ts`; `receipts.ts` lists the `ACTIONS` names K09 should log.

## Wednesday afternoon · make honesty measurable (M2)
- [~] **Z06** · P0 · Eval runner: run the X-ray over the golden set → `veracite/tests/results/latest.json` + summary (caught / false-Verified / real verified / time) · `veracite/tests/eval/**` · due Wed 15:00 · #honesty
    - Needs Krishna's K04 (Verifier, due 11:30).
    - 24 Nov: runner + scoring + tests in `tests/eval/`. Baseline DOI-exists checker on live Crossref marked **12 fakes Verified** (`tests/results/baseline-doi-exists.md`). **Left: `node tests/eval/run.mjs --adapter xray` once K05 is merged.**
- [ ] **Z07** · P0 · Trust Center: replace illustrative numbers with measured ones from Z06; model card (new model map, docs/11 §6), policies, data flow, "report a wrong verdict" link · `veracite/src/components/app/tabs/trust/**` · due Wed 17:00 · #honesty #ux

## Wednesday evening · deck-promised extras (M3)
- [ ] **Z15** · P1 · Export gate before download: unread-source warning (read-before-you-cite), one explain-it-back line per key source (AI button disabled there), AI-use statement preview. Uses Avighna's library + export libs · `veracite/src/components/app/ExportGate.tsx veracite/src/lib/integrity/gate*` · due Wed 20:00 · #honesty #ux
    - Deck slides 4 and 6 promise these, and the website must follow the deck.
- [~] **Z08** · P1 · Certificate: encode verified bibliography + SHA-256 into the URL, decode on `/certificate`, re-verify live, real QR · `veracite/src/components/app/tabs/certificate/** veracite/src/lib/integrity/certificate*` · due Wed 21:00 · #honesty #research
    - 24 Nov: `lib/integrity/certificate.ts` + 13 tests. **Left: wire `tabs/certificate/**` (K01 is merged); align with `CertificatePayload` in `types.ts` (needs title optional + url; ask Krishna).**
- [x] **Z09** · P1 · Paraphrase guard (n-gram overlap) for the Draft Checker · `veracite/src/lib/integrity/paraphrase*` · due Wed 22:00 · #honesty
    - 24 Nov: `paraphrase.ts`; usage for K10 in the integrity tests README.
- [x] **Z10** · P1 · Bias-lens numbers from OpenAlex fields (country, year, open access, publisher) · `veracite/src/lib/integrity/bias*` · due Wed 22:30 · #research #ux
    - 24 Nov: `bias.ts`, tested on live OpenAlex data for the 30 golden references.
- [~] **Z11** · PRES · Write final answers for the ethics/governance Q&A bank (docs/08 Q9–Q16) and memorise the 60-second pitch · `docs/08_DEMO_SCRIPT_AND_QA.md` · due Wed 22:00 · #pres
    - 24 Nov: Q9–Q16 final answers written in docs/08 (facts checked). **Left: memorise the pitch + rehearse aloud, then tick.**
- [ ] **Z16** · P2 · Web sources: URL live check + Wayback snapshot + APA retrieval date (moved from K12; a likely Phase-2 ask) · `veracite/src/app/api/sources/wayback/**` · #research
- [x] **Z03** · P2 · Apply for a Semantic Scholar API key (optional; Semantic Scholar is not in the demo spine) · #research
    - 24 Nov: applied (form submitted).

## Thursday
- [ ] **Z12** · DAY · Phase 2: underline every "must"; write 3 acceptance checks per requirement; test the live link in incognito at 14:40 · due Thu 14:50 · #dayof
- [ ] **Z13** · DAY · Update the Trust Center and prompt log for anything Phase 2 changed; export the prompt log to `submissions/prompt-log/` · due Thu 14:55 · #dayof #deck
- [ ] **Z14** · PRES · Rehearse segment 5:30–7:00 (export → statement → certificate → Rules mode) · due Thu 12:30 · #pres
