# Zedan Nasir Parol · Trust, Ethics & QA Lead

**Owns:** golden test set and measured results, integrity features (AI-use statement, Prompt Ledger, certificate, PII scrubber), Trust Center, prompt log. **Demo segment:** 5:30–7:00 (export, governance, Rules mode). **Q&A lead:** ethics, privacy, policy, testing. **Quiz:** ethics, regulation, UAE and global AI policy.
Read first: `docs/HANDOFF.md` → `docs/05_ETHICS_GOVERNANCE_GUARDRAILS.md` → `docs/SCORING_PLAN.md`.

## Tuesday · no code needed yet (Krishna is splitting the tabs, K01)
- [ ] **Z01** · P0 · Golden test set: 30 real references (check each DOI by hand), 20 AI-fabricated (generate with ChatGPT/Gemini and log the prompts), 10 chimeras, 5 retracted (real retracted DOIs), 5 web pages. Format in `veracite/tests/golden/README.md` · `veracite/tests/golden/**` · due Wed 09:00 · #honesty
    - Every record has `"sample": true`. No personal data.
- [ ] **Z02** · P0 · Keep `docs/PROMPT_LOG.md` complete for all three of us (hackathon rule 8): add your own and Avighna's prompts · `docs/PROMPT_LOG.md` · due ongoing · #deck #pres
- [ ] **Z03** · P0 · Apply for a Semantic Scholar API key (optional, approval takes time) · due Tue 18:00 · #research

## Wednesday · make honesty measurable
- [ ] **Z04** · P0 · Integrity library: AI-use statement generator from the Receipts log (APA 2025 + SP Jain §h(viii)), Prompt Ledger export · `veracite/src/lib/integrity/**` · due Wed 13:00 · #honesty #research
- [ ] **Z05** · P0 · PII scrubber + prompt-injection detector (pure functions + tests). Krishna's LLM gateway calls them · `veracite/src/lib/integrity/scrub* veracite/src/lib/integrity/injection*` · due Wed 11:00 · #honesty
- [ ] **Z06** · P0 · Eval runner: run the X-ray over the golden set → `veracite/tests/results/latest.json` + summary (caught / false-Verified / real verified / time) · `veracite/tests/eval/**` · due Wed 15:00 · #honesty
- [ ] **Z07** · P0 · Trust Center: replace illustrative numbers with measured ones from Z06; model card, policies, data flow, "report a wrong verdict" link · `veracite/src/components/app/tabs/trust/**` · due Wed 17:00 · #honesty #ux
- [ ] **Z08** · P0 · Certificate: encode verified bibliography + SHA-256 into the URL, decode on `/certificate`, re-verify live, real QR · `veracite/src/components/app/tabs/certificate/** veracite/src/lib/integrity/certificate*` · due Wed 19:00 · #honesty #research
- [ ] **Z09** · P1 · Paraphrase guard (n-gram overlap) for the Draft Checker · `veracite/src/lib/integrity/paraphrase*` · due Wed 20:00 · #honesty
- [ ] **Z10** · P1 · Bias-lens numbers from OpenAlex fields (country, year, open access, publisher) · `veracite/src/lib/integrity/bias*` · due Wed 21:00 · #research #ux
- [ ] **Z11** · PRES · Write final answers for the ethics/governance Q&A bank (docs/08 Q9–Q16) and memorise the 60-second pitch · `docs/08_DEMO_SCRIPT_AND_QA.md` · due Wed 22:00 · #pres

## Thursday
- [ ] **Z12** · DAY · Phase 2: underline every "must"; write 3 acceptance checks per requirement; test the live link in incognito at 14:40 · due Thu 14:50 · #dayof
- [ ] **Z13** · DAY · Update the Trust Center and prompt log for anything Phase 2 changed; export the prompt log to `submissions/prompt-log/` · due Thu 14:55 · #dayof #deck
- [ ] **Z14** · PRES · Rehearse segment 5:30–7:00 (export → statement → certificate → Rules mode) · due Thu 12:30 · #pres
