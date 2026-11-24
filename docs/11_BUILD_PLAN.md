# 11 · Build plan: Tue night → Thu 15:00, split across the three of us

*Written Tue 24 Nov, 20:40 Dubai, after reading the official Problem Statement, Rules and Rubric PDFs, docs 00–10, the deck and the app. This plan **replaces the timeline in `07_TEAM_PLAN_E2E.md`**; roles there still stand. Task lists in `tasks/*.md` follow this plan.*

---

## 1. Why the plan changed (5 findings)

| # | Finding | What we do about it |
|---|---|---|
| 1 | **The real MVP hasn't started.** The app is 6 tabs + 2 3D labs of SAMPLE previews; no API routes, no `src/lib`, no keys, no deploy. 1 of 45 tasks done. Wednesday is the only full build day | A **demo spine** that must be live by **Wed 19:00**, hard milestones, and a cut order if we slip (§3, §7) |
| 2 | **Groq's free tier dropped Llama** (Aug 2026). Groq's models page lists both Llama models as "contact sales". Free chat models now: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` (preview), `openai/gpt-oss-safeguard-20b`. Our `.env.example` points Planner and Coach at Llama, and the Skeptic at `qwen/qwen3-32b`, which is no longer listed | New model map (§6). The Skeptic stays on a **different model family** (Qwen) from the Scribe (gpt-oss), so the deck's claim still holds |
| 3 | **The brief leads with the reference manager**: save in one click (Zotero's button), organise, and *"insert citations while you write"*. We check citations but can't **insert** one while writing, and have no **one-click save**. The Workflow slide shows only the agent pipeline | Two new tasks: **A14 Write & cite** (P0) and **A15 one-click Save to Veracite** (P1). Deck slide 2 gains the library journey (§9) |
| 4 | **The website must follow the deck** ("Your website should still follow the design in your Phase 1 deck"). The deck promises things no task builds: autonomy dial, read-before-you-cite, explain-it-back, Socratic coach | Tasks added for what's cheap (K09, Z15). The Socratic coach is dropped from the deck before upload (§4, §9) |
| 5 | **Free citation checkers already exist** (CiteTrue, Sourcely, an Apify actor using Crossref + Retraction Watch + OpenAlex, the same sources as us) | Our story is the **whole loop**, not the checker: find → verify → organise → cite while writing → export with an AI-use statement, with the student approving each stage |

**Research that backs the design (use in Q&A):**
- **CiteTracer** (arXiv 2605.08583, 2026) has the same shape as Veracite: a deterministic field matcher first, an LLM only on ambiguous cases. It caught 97.1 % of real-world fabricated citations.
- **NeurIPS 2025 fake-citation taxonomy** (arXiv 2602.05930): 66 % wholly invented, 27 % real-looking with wrong fields, 4 % hijacked identifiers. Field-by-field checks and a "does this DOI really point to this title?" check are the right defences.
- **Review of 5 checker tools** (arXiv 2607.22693, 2026): they break on parsing errors and thin database coverage. That's why we use two registries and keep **Partial** (couldn't confirm) separate from **Not found**.

---

## 2. The one journey judges must see working (the demo spine)

> A student asks a question → **approves the plan** → Veracite searches Crossref + OpenAlex and the **code-only Verifier** badges every source → the student **approves sources** (saved to the library) → agents draft a brief where **every sentence has a trust label** → the student **approves claims** → writes a paragraph, **inserting citations from the verified library** → **exports APA 7 + an AI-use statement** built from the logs.
>
> Side door that opens the demo: **Reference X-ray** catches a ChatGPT bibliography live. Safety net: **Rules mode** keeps every check working with AI off.

Every P0 task below exists to make that journey run on the **live link**, with real data, by **Wed 19:00**.

---

## 3. Tiers (what "done" means and in what order)

| Tier | Rule | Contents |
|---|---|---|
| **P0 · spine** | Must work on the live link by **Wed 19:00**. Nobody starts P1 until their own P0s are merged | X-ray + Verifier · registries · LLM gateway + Rules mode · Planner, Reader, Scribe, Skeptic · orchestrator with 3 checkpoints + autonomy dial + Receipts · library · APA 7/BibTeX/RIS export · Write & cite · AI-use statement + Prompt Ledger · PII + injection guards · golden set + measured results · Trust Center · landing · design system basics · deploy |
| **P1 · promised in the deck** | Merged by **Wed 23:00**. If the deck shows it, it must exist at least in a simple form | Draft Checker · certificate (QR, re-verify) · export gate (read-before-you-cite, explain-it-back) · paraphrase guard · bias lens · snowballing · one-click save · other export styles |
| **P2 · stretch** | Only after M2 is green and rehearsal #1 is done | Arabic/RTL · ⌘K · PDF drop · 3D Mission Control wired to real state · real-data Galaxy · Debate mode · public verify API · web sources + Wayback · Semantic Scholar |
| **Roadmap** | Say it, don't build it | MCP server · browser extension · LMS plug-in · Word/Docs add-in |

**Cut order if we slip** (drop from the top):
1. If **M1** (Wed 13:00) slips past 15:00 → drop A15, K11, Z10 to P2.
2. If **M2** (Wed 19:00) slips past 21:00 → drop every P1 except **Z15 export gate** and **Z08 certificate** (both are big on the deck).
3. Never drop: X-ray, Verifier, 3 checkpoints, labels, Rules mode, APA 7 export, AI-use statement.

---

## 4. Deck promise audit (website must follow the deck)

| Deck promise | Slide | Task | Tier |
|---|---|---|---|
| 3D landing, UV-lamp mode, VERIFIED / VOID | 1 | A03 | P0 |
| Planner → Scout → Verifier → Reader → Scribe → Skeptic → Integrity Clerk, checks A–E | 2 | K03–K09 | P0 |
| 3 approvals; nothing searched before the plan is approved; nothing exported before claims are reviewed | 2, 6 | K09 | P0 |
| 4 trust labels set by code | 2 | K04, K09 | P0 |
| Side doors: Reference X-ray · Draft Checker | 2 | K05 · K10 | P0 · P1 |
| LLM gateway: schema check, PII scrub, injection shield, budget caps | 3 | K06 + Z05 | P0 |
| Different open model per agent, fallback model, Rules mode | 3 | K06 | P0 |
| Crossref + Retraction Watch · OpenAlex · arXiv | 3 | K03 | P0 |
| Semantic Scholar · DOAJ · Unpaywall / Europe PMC · Wayback | 3 | — | **Mark "optional" on the slide** (§9) |
| Library in IndexedDB; export BibTeX / RIS / CSL-JSON | 3 | A05, A06 | P0 |
| Paraphrase guard | 4 | Z09 | P1 |
| Explain each source in your own words · read-before-you-cite | 4, 6 | Z15 | P1 |
| PII scrubbed before any AI call | 4 | Z05 | P0 |
| Bias lens (country, year, open access, publisher) | 4 | Z10 | P1 |
| AI-autonomy dial (AI can be off) | 4, 6 | K09 | P0 |
| Socratic coach | 4 | — | **Remove from the slide** (§9) |
| Accessibility: list view for every 3D view, reduced motion | 4 | A04 | P0 |
| Verification certificate (QR, live re-check) | 5 | Z08 | P1 |
| AI-use statement from logs · Prompt Ledger | 5 | Z04 | P0 |
| Trust Center with test results · "report a wrong verdict" | 5 | Z06, Z07 | P0 |
| Skeptic: other model, 8 rules, 2 rounds, counter-evidence, rejections shown | 6 | K08 | P0 (counter-search P1) |
| 70-reference test set, zero fakes marked Verified | 6 | Z01, Z06 | P0 |

---

## 5. Contracts first, so three people never edit the same file

Tonight, before anyone writes feature code, **Krishna merges K01 + K18**:
- **K01:** `components/app/tabs.tsx` split into one folder per tab.
- **K18:** `veracite/src/lib/types.ts` with the shared types from `03_AGENTS_AND_ARCHITECTURE.md` §7 (`SourceRecord`, `Verification`, `FieldCheck`, `Status`, `Label`, `Claim`, `Receipt`, `Plan`, `EvidenceCard`) plus `veracite/src/lib/flags.ts` (feature flags for P2 items and Phase 2).

Then everyone codes against those types. Two small interfaces are owned by one person and used by the others:

| Interface | Owner (implements) | Used by | Signature (keep it this small) |
|---|---|---|---|
| Library store `src/lib/library/` | Avighna (A05) | K09, A14, A15, Z15, Z08 | `addSource(r)`, `getSource(id)`, `listSources(filter)`, `updateSource(id, patch)`, `markOpened(id)` |
| Receipts log `src/lib/session/receipts.ts` | Krishna (K09) | Z04, Z07 | `logReceipt(r: Receipt)`, `getReceipts(sessionId)` |
| Verify API `POST /api/sources/verify` | Krishna (K04/K05) | A15, Z06, Z08 | input: raw reference text or DOI → `Verification` |
| Export lib `src/lib/cite/` | Avighna (A06) | Z15, Z08, A14 | `format(records, style)`, `toBibTeX(records)`, `toRIS(records)`, `inText(record)` |

**Write & cite ownership split** (both touch the Draft tab): Avighna owns `tabs/draft/Writer.tsx` and `src/lib/cite/insert*`; Krishna owns the rest of `tabs/draft/**` and `api/draft/**` (the checker). See `OWNERSHIP.md`.

---

## 6. Groq model map (fixes finding 2; K02 confirms in the console tonight)

| Agent | Model | Why |
|---|---|---|
| Planner | `openai/gpt-oss-20b` | Small structured plan; keeps 120b's quota for the Scribe |
| Reader | `openai/gpt-oss-20b` | Fast quote extraction |
| Scribe | `openai/gpt-oss-120b` | Strongest synthesis |
| Skeptic | `qwen/qwen3.8-27b` (preview) | **Different family** from the Scribe. If Groq removes it, fall back to `gpt-oss-20b` and show an honest banner: "Skeptic running on the same model family today" |
| Injection check | `meta-llama/llama-prompt-guard-2-86m` if the console shows it as free, else Zedan's regex detector (Z05) | A real classifier is a stronger guardrail story |

Free-tier limits are per model (≈ 30 req/min, 1,000 req/day, 8K tokens/min on gpt-oss). One research session ≈ 5–7 calls, so the budget is fine; the 8K tokens/min is the tight one, so the Scribe gets **at most 8 approved abstracts** per call.

**Registry limits to design for (K03):** OpenAlex needs a free key (mandatory since 13 Feb 2026, $1/day free ≈ 1,000 searches). Crossref list/search queries are slow in the public pool (≈ 1/s), so send `mailto` for the polite pool, run at most 3 at once, cache for 24 h, and **stream X-ray results line by line** so the screen fills while it works.

---

## 7. Timeline and milestones (Dubai time)

| When | Milestone | Must be true |
|---|---|---|
| **Tue 23:59 · M0** | Unblocked | Keys in `.env.local` + Vercel · tabs split · `types.ts` + `flags.ts` merged · preview deployed (live link exists) · deck v1 fixed and **uploaded as insurance** · golden set under way |
| **Wed 13:00 · M1** | Verifier live | X-ray verifies a real pasted bibliography **on the live link** · library saves and exports APA 7 · PII/injection guards merged |
| **Wed 19:00 · M2** | Spine live | Full journey (§2) on the live link · Trust Center shows **measured** numbers · **Rehearsal #1** (8 min + Q&A drill) |
| **Wed 23:00 · M3** | Deck-complete | P1 wave merged · **final deck uploaded** (screenshot in the chat) |
| **Thu 11:00** | Freeze | Bug fixes only · demo queries pre-warmed · backup video recorded |
| **Thu 13:15–15:00** | Phase 2 | `09_PHASE2_PLAYBOOK.md`: deploy by 14:40, smoke test, freeze 14:55 |

Every merge to `main` auto-deploys on Vercel, so the live link is always the latest green build. Merge small and often.

---

## 8. Who does what (the split)

### Krishna · build lead: verification, agents, deploy
| When | Tasks |
|---|---|
| **Tue night** | **K02** keys (Groq, OpenAlex) + Vercel + new model map in `.env.example` + add Avighna to the repo · **K01** split tabs · **K18** contracts · **K07** first deploy of the preview |
| **Wed 09–13** | **K03** registries → **K04** Verifier (tested on Zedan's golden set) → **K05** X-ray API + tab ⇒ **M1** |
| **Wed 13–19** | **K06** LLM gateway (model map, fallback, Rules mode, budget caps, calls Z05) → **K08** agents → **K09** orchestrator (3 checkpoints, autonomy dial, Receipts) ⇒ **M2** |
| **Wed 19–23** | **K10** Draft Checker · **K11** snowballing |
| **Thu** | K15 freeze + pre-warm · K17 rehearse · K16 Phase 2 at the keyboard |

### Zedan · trust, ethics, QA: proof that it's honest
| When | Tasks |
|---|---|
| **Tue night** | **Z01** golden set (due Wed 09:00) · start **Z05** PII scrubber + injection detector (pure functions, no dependencies) |
| **Wed 09–13** | Finish **Z05** (by 11:00, Krishna's gateway calls it) · **Z04** AI-use statement + Prompt Ledger against `types.ts` |
| **Wed 13–19** | **Z06** eval runner on the golden set (once K04 is merged) → **Z07** Trust Center with measured numbers ⇒ **M2** |
| **Wed 19–23** | **Z15** export gate (read-before-you-cite, explain-it-back) · **Z08** certificate · **Z09** paraphrase guard · **Z10** bias lens · **Z11** Q&A answers |
| **Thu** | Z14 rehearse · Z12 Phase 2 acceptance checks · Z13 prompt log export |

### Avighna · design, library, deck: the part students touch
| When | Tasks |
|---|---|
| **Tue night** | **A01** apply the deck fixes in §9 and rebuild the PDF · **A02** upload v1 tonight as insurance (re-upload final by Wed 23:00) · send your GitHub username to Krishna |
| **Wed 09–13** | **A05** library store (Dexie) + Library tab on real items · **A04** design-system basics ⇒ **M1** |
| **Wed 13–19** | **A06** export (APA 7, BibTeX, RIS first) → **A14** Write & cite → **A03** landing (Vault 3D + real buttons) ⇒ **M2** |
| **Wed 19–23** | **A15** one-click Save to Veracite · other export styles (MLA, Harvard, IEEE, Chicago) · **A02** final deck upload |
| **Thu** | A11 demo script + backup video · A13 rehearse · A12 Phase 2 demo segment |

**Waiting on each other (raise it in the chat within 15 minutes if blocked):**
- K01 + K18 → everyone.
- K02 → K03, K06.
- Z01 → K04 tests, Z06.
- K03 → K04 → K05, Z06, Z08.
- Z05 → K06 (Krishna stubs it if late).
- A05 → K09, A14, A15, Z15.
- K09 → Z04 (Zedan builds against the `Receipt` type, so he isn't blocked).
- A06 → Z15, Z08.

---

## 9. Deck fixes before upload (A01, tonight)

The deck is judged without us, and this is an honesty hackathon, so every number must match its source.

1. **Slide 1:** "100+ hallucinated citations" → **"100 hallucinated citations in 51 papers accepted at NeurIPS 2025"** (GPTZero / TechCrunch, Jan 2026). Sources say 100, not more.
2. **Slide 1:** the 78–90 % figure is correct (Nature, Feb 2026, GPT-4o). Keep it.
3. **Slide 2:** add the library journey. In the "Side doors" box, add a line: **"Library: save a paper in one click, organise it with collections, tags and notes, and insert citations while you write (APA 7)."** The brief's first expectation is the organisation of a reference manager.
4. **Slide 3:** "A different open model per agent (gpt-oss, Llama, Qwen)" → **"(gpt-oss and Qwen)"**.
5. **Slide 3:** sources box → **"Crossref + Retraction Watch · OpenAlex · arXiv"**, then on a second line **"Optional: Semantic Scholar · DOAJ · Unpaywall · Wayback"**. Architecture is scored on being "realistic to build in 90 minutes".
6. **Slide 4:** over-reliance row: "…read-before-you-cite and a Socratic coach" → **"…read-before-you-cite and explain-it-back"**.
7. **Slide 6:** the chimera screenshot has overlapping text ("SP Jain policy" over "Digital wellbeing…"). Re-take it so the parts don't overlap.
8. Check: exactly 6 pages, every source in a footer, SP Jain clauses unchanged (verified against the policy PDF: g(vi), h(vi), h(viii), h(ix), v2 approved 24 Feb 2026).

---

## 10. Risks and what we do

| Risk | Plan |
|---|---|
| Groq removes the Qwen preview model | Skeptic falls back to gpt-oss-20b with an honest banner; model IDs are env vars |
| Crossref is slow for searches | Polite pool + cache + streamed X-ray results; pre-warm the demo bibliography Thu morning |
| Integration crunch on Wednesday afternoon | Contracts tonight (§5); merge P0s by M1/M2; cut order (§3) |
| Merge conflicts | Ownership map + Write & cite split (§5); one branch per task; small PRs |
| A teammate is unavailable on Wednesday | This plan assumes ~10 hours each on Wednesday. If not, P1 tasks move to whoever is free; P0 never moves without saying so in the chat |
| Venue Wi-Fi | Cached SAMPLE session + 90-second backup video (already in the demo plan) |

---

## 11. Demo topic (decided Tue 21:30): "Does generative AI help or hurt student learning?"

**How we chose:** we tested 5 topics live against Crossref and OpenAlex (no keys) and kept the one with open abstracts the Reader can quote, real DOIs, mixed evidence for the Skeptic, and a real retraction. Coverage of the top 25 OpenAlex results: AI & learning 92 % with abstracts, 84 % open access, 96 % with DOIs. Generative AI & productivity was the runner-up (72 % abstracts, landmark papers, but no retraction).

**Why it wins the room:**
1. **A real retraction, live.** Wang & Fan (2025), *"The effect of ChatGPT on students' learning performance…"*, Humanities & Social Sciences Communications, DOI `10.1057/s41599-025-04787-y`. A meta-analysis claiming large positive effects of ChatGPT on learning: **775 citations in OpenAlex, retracted 22 Apr 2026** over "discrepancies in the meta-analysis". Crossref carries the notice from both the publisher and Retraction Watch. Ranked by citations, it is near the top of this topic, and Veracite blocks it. Line for the demo: *"The most-cited evidence that ChatGPT helps students learn was retracted this year. A tool that ranks by citations would have handed it to you first."*
2. **Mixed evidence, so the Skeptic has work to do.** Bastani et al. (2025, PNAS, `10.1073/pnas.2422633122`): *"Generative AI without guardrails can harm learning"*, which also carries a **correction** notice (amber badge). Kestin et al. (2025, Scientific Reports, `10.1038/s41598-025-97652-6`): an AI tutor outperformed in-class active learning.
3. **A preprint, so the badge and Skeptic rule S6 show up.** Kosmyna et al. (2025, MIT, *"Your Brain on ChatGPT"*, arXiv `10.48550/arXiv.2506.08872`). The deck already cites it for over-reliance.
4. **It closes the loop on our own design.** The research says AI *without guardrails* harms learning, and Veracite is the guardrails. The judges are educators, and the hackathon problem is students using AI.

**What this means for the build:**
- **K03/K04:** arXiv DOIs (`10.48550/…`) return 404 from Crossref because they are DataCite DOIs. Verify preprints with OpenAlex + arXiv. Take abstracts from OpenAlex first (Crossref had none for Kestin et al.), then Crossref. Read retractions from Crossref `updated-by` on the original record plus OpenAlex `is_retracted`.
- **Z01:** add Wang & Fan to `retracted.json` and Bastani et al. (correction) to the notes. Ask ChatGPT for the fabricated set **on this topic** too, so the X-ray demo bibliography is on-topic.
- **A11 / demo script:** the X-ray clipboard bibliography and the research question both use this topic. The sample data in `components/app/data.ts` (screen time) stays as the labelled SAMPLE preview until the real flow replaces it.

Sources: Crossref and OpenAlex API responses (24 Nov 2026) · [Plagiarism Today on the retraction](https://www.plagiarismtoday.com/2026/07/15/study-claiming-ai-helps-students-learn-retracted/) · [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/highly-cited-meta-analysis-claiming-chatgpt-boosts-student-learning-retracted-over-data-concerns).

---

## Sources for this plan
Groq models (console.groq.com/docs/models) · Groq free tier changes 2026 (klymentiev.com/blog/groq-pricing; agentdeals.dev/vendor/groq) · OpenAlex authentication (developers.openalex.org/api-reference/authentication) · Crossref rate limits (community.crossref.org/t/16137) · OpenScholar, Nature Feb 2026 (washington.edu news, 4 Feb 2026) · NeurIPS hallucinated citations (techcrunch.com, 21 Jan 2026) · arXiv 2602.05930, 2605.08583, 2607.22693 · SP Jain Academic Integrity Policy v2 (spjain.ae) · CiteTrue, Sourcely, Apify Reference Checker (vendor pages).
