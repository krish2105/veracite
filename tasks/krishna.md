# Krishna Mathur · Product & Build Lead

**Owns:** the agent pipeline, registries, Verifier, APIs, deployment, Phase-2 keyboard. **Demo segment:** 2:00–5:30 (X-ray + research session). **Q&A lead:** tech, architecture, models, cost. **Quiz:** models, agents, tech terms.
Read first: `docs/11_BUILD_PLAN.md` (the plan we follow) → `docs/HANDOFF.md` → `docs/03_AGENTS_AND_ARCHITECTURE.md`.
**Milestones:** M0 Tue 23:59 (team unblocked) · **M1 Wed 13:00 (X-ray live)** · **M2 Wed 19:00 (spine live)** · M3 Wed 23:00 (P1 wave). No P1 work until your P0s are merged.

## Tuesday night · unblock the team (M0)
- [x] **K00** · P0 · Docs, deck, repo, task system and 3D prototypes in place · `docs/** submissions/** tasks/**` · due Tue 13:00 · #deck
- [x] **K02** · P0 · Free keys (Groq, OpenAlex) in `veracite/.env.local`; Vercel project (root dir `veracite`) + env vars; add Avighna to the repo · due Tue 22:00 · #mvp
    - 26 Nov: Groq and OpenAlex keys on Vercel Production (not copied into `.env.local`, by choice); live `/api/health` says `"ai":"ai"`; Avighna and Zedan are collaborators. Two full live Co-pilot sessions on 26 Nov; the second (07:47 Dubai) is the SAMPLE.
    - `.env.example` model map already updated in K06. Vercel project `veracite` created and deployed (K07). Still to do: paste the keys into `.env.local` and Vercel, confirm the model IDs and whether Prompt Guard 2 is free, add Avighna to the repo.
- [x] **K01** · P0 · Split `components/app/tabs.tsx` into one folder per tab (no behaviour change) so Z and A can work in parallel · `veracite/src/components/app/tabs/**` · due Tue 22:30 · #ux
    - Blocks everyone. Merge to `main` first.
- [x] **K18** · P0 · Shared contracts: `src/lib/types.ts` (types from docs/03 §7) + `src/lib/flags.ts` (feature flags) · `veracite/src/lib/types.ts veracite/src/lib/flags.ts` · due Tue 23:30 · #mvp
    - Everyone codes against these. Interfaces in docs/11 §5.
- [x] **K07** · P0 · First deploy of the current preview to Vercel; live link in `README.md` and `submissions/phase2/LIVE_LINK.md`; every merge to main auto-deploys after this · due Tue 23:59 · #mvp

## Wednesday morning · the Verifier goes live (M1)
- [x] **K03** · P0 · Registry clients: Crossref (DOI, `query.bibliographic`, retractions via `updated-by`), OpenAlex (DOI, search, abstract), arXiv; polite headers, 24h cache, max 3 concurrent · `veracite/src/lib/registries/**` · due Wed 10:30 · #mvp #honesty #research
- [x] **K04** · P0 · Verifier (code only): title normaliser and similarity, author match, year rule, DOI→title consistency, chimera detector, status rules + unit tests on Zedan's golden set · `veracite/src/lib/verify/**` · due Wed 11:30 · #honesty
    - Golden set (Zedan, live, 25 Nov 01:30): real 30/30, retracted 5/5, chimera 10/11, **0 fakes marked Verified**. The one "miss" (chim-002, year only) is a mismatch by docs/03.
- [x] **K05** · P0 · `/api/sources/verify` + `/api/sources/xray` (streams results line by line) + wire the X-ray tab (real results, no SAMPLE) · `veracite/src/app/api/sources/** veracite/src/components/app/tabs/xray/**` · due Wed 13:00 · #mvp #honesty

## Wednesday afternoon · the research session goes live (M2)
- [x] **K06** · P0 · LLM gateway: Groq with zod schemas, model per agent (docs/11 §6), fallback → Rules mode, budget caps, calls Zedan's PII scrubber + injection check · `veracite/src/lib/llm/**` · due Wed 14:30 · #mvp #honesty
- [x] **K08** · P0 · Agents: Planner, Reader (quotes + string match), Scribe (approved-ID whitelist, max 8 abstracts), Skeptic (Qwen, rules S1–S8, 2 rounds) · `veracite/src/lib/agents/**` · due Wed 16:30 · #mvp #research #honesty
- [x] **K09** · P0 · Research orchestrator: state machine, 3 checkpoints, autonomy dial (Off / Assist / Co-pilot), Receipts log, approved sources saved to the library; wire the Research tab end to end · `veracite/src/lib/session/** veracite/src/components/app/tabs/research/**` · due Wed 19:00 · #mvp #research #ux

## Day-of path (added Wed 14:15)
- [x] **K19** · P0 · Five-requirement path on the X-ray page: fake-reference check, labels + legend, approve to list, APA 7 copy/download, AI-use statement, phone layout · `veracite/src/components/app/tabs/xray/**` · due Wed 16:00 · #mvp #research #honesty #ux
    - Interim list store and APA formatter live in `tabs/xray/`; Avighna's A05/A06 can replace them (records use `SourceRecord`).

## Clean-up (added Wed 15:00)
- [x] **K20** · P0 · Replace sample pages with real ones: front page, shell, Library (organise, BibTeX/RIS/CSL, bias lens), Trust Center (measured results, Prompt Ledger), Certificate (QR + live re-check), eval runner reads NDJSON · due Wed 18:00 · #mvp #research #honesty #ux
    - Done in files owned by Avighna and Zedan (with Krishna's go-ahead). Their tasks A03-A06, Z06-Z08, Z10: review, then tick what you accept.
- [x] **K21** · P1 · X-ray checks web pages (connects Z16): live or archived pages that match the cited title are Partial, never Verified · `veracite/src/lib/verify/**` · #research #honesty
- [x] **K22** · P1 · 3D vault as the home page with buttons into the app; plain cards below 1024 px, with reduced motion or without WebGL (covers A03) · `veracite/src/app/page.tsx veracite/src/components/lab/**` · #ux
- [x] **K23** · P1 · Home page redesign (labelled fake note + three ways in) and effects on every app page: engraved background, torch glow, 3D note banner · `veracite/src/components/lab/home/** veracite/src/components/app/ambient/**` · #ux
- [x] **K24** · P1 · Headings fit their boxes; phones in dark mode no longer repaint the daylight theme; 3D vault on upright phones and tablets · `veracite/src/components/lab/** veracite/src/app/globals.css veracite/src/app/layout.tsx` · #ux

## Wednesday night · plan to 90+ (added Wed 22:30, see `docs/NEXT_SESSION_PROMPT.md`)
- [x] **K26** · P0 · Submission readiness: secret scan of the whole history (gitleaks: 0 leaks), repo made public, Zedan's prompt-log export merged (PR #37), `submissions/phase2/LIVE_LINK.md` lists everything we submit · `submissions/phase2/LIVE_LINK.md` · #dayof
- [x] **K27** · P1 · One-click save: `/save?doi=` or `?url=` verifies before adding, plus a bookmarklet on the Library page (Avighna owns `app/save/**`, A15) · `veracite/src/app/save/** veracite/src/lib/library/bookmarklet*` · #research #ux
    - 25 Nov: bookmarklet reads citation_doi / prism.doi / dc.identifier / citation_arxiv_id, else og:url / canonical + title; tested on live Nature and arXiv pages. A DOI is checked alone (the registry record decides); web pages stay Partial and cannot be added. 23 unit tests.
- [x] **K28** · P1 · Import an existing library: paste or upload `.bib` / `.ris`, X-ray every entry, add only the real ones · `veracite/src/lib/import/** veracite/src/components/app/tabs/library/ImportLibrary.tsx` · #research #honesty
    - 25 Nov: hand-written BibTeX + RIS parser (LaTeX accents, arXiv eprints, organisations, Zotero/biblatex fields), 19 tests; checked 30 at a time through the X-ray; SAMPLE file gets 3 verified · 1 retracted · 1 chimera · 1 not found on the live registries.
- [x] **K29** · P1 · Citation styles: APA 7, MLA 9, Harvard, IEEE, Chicago author-date (citation-js) in Write & cite, X-ray list and Library export · `veracite/src/lib/cite/**` · #research
    - 25 Nov: APA 7 stays on our formatter; the other four use the official CSL styles (CC BY-SA 3.0) through @citation-js/core + plugin-csl, loaded only when picked. One shared choice; switching rewrites citations inserted in Write & cite. 24 tests on LeCun 2015, Bastani 2025, an arXiv preprint and a WHO web page.
- [x] **K30** · P1 · Explain this paper: the Reader explains a saved source's abstract, every sentence labelled by code · `veracite/src/lib/agents/**` · #research #honesty
    - 25 Nov: `lib/agents/explain.ts` + `POST /api/agents/explain` + a button on every Library source. Verified only when the quote is in the abstract; made-up quotes removed; answers need a real quote or say Not found. Rules mode shows the abstract's sentences and matches questions without AI. 11 tests. Not yet run against a real model (no key).
- [x] **K31** · P1 · First-visit guidance: one "Try the full journey" path, a dismissible 3-step guide and clear empty states · `veracite/src/components/app/journey/**` · #ux
    - 25 Nov: slim strip under every page header (never a popup), ticks itself from the receipts log + two marks (citation inserted, certificate made), Hide guide remembered, `?journey=1` brings it back; home CTA "Try the full journey". Empty states checked on all six pages. 5 tests.
- [x] **K32** · P0 · Demo safety: pre-warmed searches, SAMPLE-labelled cached research session, plain error banners, 51-reference eval re-run on the live site · `scripts/prewarm.mjs veracite/src/lib/session/**` · #dayof
    - 25 Nov: `scripts/prewarm.mjs` (13/13 live); live-site eval = same numbers (median 0.66 s live vs 0.46 s local), kept in `tests/results/live-site.md`; error banners say which step failed + Try again (5 tests); SAMPLE replay + `?record=1` recorder built and tested. 26 Nov: AI SAMPLE recorded live (Co-pilot, 07:47 Dubai, the Skeptic catches a correlation read as a cause) and pasted unchanged into `tabs/research/sampleSession.ts`; button, banner and click-through tested 11/11.

## Thursday 00:50 · quick wins from the research pass ("Do all")
- [x] **K33** · P1 · Free full text: a legal open-access link (OpenAlex OA location, arXiv PDF) on X-ray rows, Library, save page and research sources · `veracite/src/lib/registries/fulltext*` · #research
    - 26 Nov: shown only when a registry reports a free copy, never on retracted/chimera/not-found rows; opening it counts as reading. 4 tests.
- [x] **K34** · P1 · Registry trace + "why this label": per-registry results and the rule that set each verdict, on every X-ray row · `veracite/src/lib/verify/explain*` · #honesty #ux
    - 26 Nov: "How this was decided" on every X-ray row and the save page: what Crossref, OpenAlex and arXiv returned, the field checks and the rule in one sentence. Reads the verdict, never changes it. 6 tests.
- [x] **K35** · P1 · Re-check my library for retractions and corrections since saving; warn in Write & cite before citing a retracted source · `veracite/src/lib/verify/recheck*` · #honesty
    - 26 Nov: Library card re-checks every saved DOI (3 at a time), applies only NEW notices, keeps the original checks, shows the last check time; Write & cite marks RETRACTED and warns. 6 tests.
- [x] **K36** · P1 · "Does this source say this?": the closest sentence in the source's abstract for each cited claim, code only · `veracite/src/components/app/tabs/draft/support*` · #honesty #research
    - 26 Nov: Draft Checker shows the nearest abstract sentence and the share of key words (86 % vs 22 % on the test claims); evidence only, the label never goes up. 6 tests.
- [x] **K37** · P1 · PDF drop on the X-ray page (pdf.js, approved): DOIs and the reference section into an editable list · `veracite/src/lib/import/pdf*` · #research #ux
    - 26 Nov: Read a PDF / drop on the box; pdf.js reads it in the browser (nothing uploaded), finds the last References heading (stops at appendices), re-joins hyphen and DOI line breaks, else lists the DOIs; the student edits, then X-rays. 11 tests; generated test paper → 3 Verified + 1 Chimera.

## Thursday 01:10 · remaining ideas ("Merge and do all")
- [x] **K39** · P2 · Paste a chatbot answer: keep its reference list + DOIs from the prose, flag author–year mentions with no full reference · `veracite/src/lib/import/chatanswer*` · #honesty #ux
    - 26 Nov: banner "This looks like a chatbot answer" → Check only its references; "Smith and Lee (2023)" flagged as uncheckable. 7 tests.
- [x] **K40** · P2 · Journal-index chips (DOAJ, indexed in), labelled Reported, not checked · `veracite/src/lib/registries/journal*` · #research
    - 26 Nov: OpenAlex `is_in_doaj` / `is_core` / `listed_in` kept on records and saved sources; chips on X-ray, Library, research sources (e.g. "DOAJ · MEDLINE · CWTS core list · +10 national lists"); never shown as a score, nothing hidden. 3 tests.
- [x] **K41** · P2 · New citations since you saved (OpenAlex cited-by, newer than the save date) · `veracite/src/components/app/tabs/library/NewCitations.tsx` · #research
    - 26 Nov: snowball route takes `since` + `perPage`; Library card checks up to 10 sources, 5 each, 2 at a time, since saved or last 12 months; every result verified, one-click add. 3 tests.
- [x] **K42** · P2 · Related-papers map (2D, from snowball data; click-to-add through the Verifier) · `veracite/src/components/app/tabs/research/PaperMap.tsx mapLayout*` · #research #ux
    - 26 Nov: Map button beside Papers it cites / Papers that cite it: deterministic SVG (no physics), cites left / cited-by right, oldest at top, size = citations, colour = verdict; tap a dot to add. 4 tests; phones scroll inside the map.
- [x] **K43** · P2 · Arabic / English toggle for the main labels, right-to-left (covers A08) · `veracite/src/lib/i18n/**` · #ux
    - 26 Nov: العربية / English chip in the header (flag `arabic` on): menus, page titles, AI-autonomy, trust labels and verdict badges in Arabic with lang="ar" dir="rtl"; results and references stay English and a beta note says so; layout not mirrored. 5 tests.

## Thursday 02:00 · fixes from the evidence-based rescore
- [x] **K44** · P1 · Library: core journey first (Sources → Export → Bias lens → Import), extra tools behind "More tools", Export ↓ shortcut; flags.ts matches what is live · `veracite/src/components/app/tabs/library/LibraryTab.tsx veracite/src/lib/flags.ts` · #ux
- [x] **K45** · P1 · Save checked web pages to the library (Partial, never Verified, retrieval date kept) · `veracite/src/lib/verify/websource*` · #research #honesty
- [x] **K46** · P1 · Deck brought up to date with the live site (PPTX + PDF rebuilt, 6 slides) and a humanised 3-person demo script PDF · `submissions/phase1/deck/build-deck.cjs`, `submissions/phase1/Team7_Veracite_Phase1_Deck.*`, `submissions/phase2/demo-script/**`, `submissions/phase2/Team7_Demo_Script.pdf` · due Thu 09:00 · #deck #pres
- [x] **K47** · P0 · Fixes from the first live AI session: a source cited once per claim, Skeptic reasons clamped in code at a word boundary (no repeated rule code), clearer "Reported" legend; demo script switched to Co-pilot · `veracite/src/lib/agents/reasons.ts`, `agents.ts`, `schemas.ts`, `tabs/research/parts.tsx`, `submissions/phase2/demo-script/**` · due Thu 09:00 · #ai #honesty
- [x] **K48** · P0 · Submission polish before the freeze: prompt log re-exported (rule 8), `submissions/README.md` statuses, debate turns say their chip is a quote check · `submissions/README.md`, `submissions/prompt-log/**` (Zedan's, export only), `tabs/research/parts.tsx` · due Thu 11:00 · #pres #honesty
- [x] **K49** · PRES · Demo script brought up to date and a rehearsal-plan page added (three timed runs, Q&A and failure drills, 11:00–12:40) · `submissions/phase2/demo-script/**`, `submissions/phase2/Team7_Demo_Script.pdf` · due Thu 11:00 · #pres
- [x] **K50** · PRES · Presenter deck: one slide per demo segment, the full spoken script in the speaker notes (Presenter View), generated from `script.html` · `submissions/phase2/demo-script/build-presenter.cjs`, `submissions/phase2/Team7_Demo_Presenter.pptx` · due Thu 11:00 · #pres
- [x] **K51** · PRES · Spoken script in the speaker notes of the Phase 1 deck itself (per slide: what to say, then the matching demo segment, then sources); slides unchanged · `submissions/phase1/deck/script-notes.cjs`, `build-deck.cjs`, `Team7_Veracite_Phase1_Deck.pptx` (Avighna's folder) · due Thu 09:00 · #pres #deck
- [x] **K52** · P0 · Make the difference from a DOI checker visible: Trust Center comparison table (DOI-only check vs Veracite, same 51 references), X-ray shows the wrong-DOI chimera first with a one-line note; script updated · `tabs/trust/baseline.ts` + `TrustTab.tsx` (Zedan's), `tabs/xray/ChimeraPanel.tsx`, `XrayTab.tsx`, `xray.css`, `submissions/**` · due Thu 11:00 · #honesty #pres
- [x] **K53** · PRES · Type-and-show file for the live demo (what to paste at each step, what judges see, fallbacks) and a 100-question AI quiz PDF · `submissions/phase2/DEMO_INPUTS.md`, `docs/Team7_AI_Quiz_100.pdf` · due Thu 11:00 · #pres
- [x] **K55** · PRES · Audit fixes that need no deployment: prompt log re-exported (rule 8), `docs/08` says Co-pilot · `submissions/prompt-log/**` (Zedan's, export only), `docs/08_DEMO_SCRIPT_AND_QA.md` (Avighna's, one line) · due Thu 11:00 · #pres
- [x] **K56** · P1 · Save as PDF on the reference list (browser print dialog, A4, no new dependency) · `tabs/xray/printDoc.ts`, `ReferenceList.tsx` · due Thu 13:00 · #research #ux
- [x] **K57** · UX · Home page under the UV lamp: the security strip is see-through instead of a glowing bar; VOID stamp unchanged (centred) · `components/lab/vault/VaultExperience.tsx` (Avighna's) · due Thu 13:00 · #ux
- [x] **K60** · DAY · Phase 2 edge cases: six required (Not found, Mismatch, Needs fix with accept or reject, Retracted warning, duplicate merge, no source exists) and bonus B1–B5; statuses in the library and every export · `lib/verify/**`, `tabs/xray/**`, `lib/session/**`, `lib/cite/styles.ts`, `lib/integrity/gate.ts` (Zedan's, one rule), `tabs/library/exports.ts` (Avighna's, status note) · due Thu 14:40 · #dayof #honesty
- [x] **K61** · DAY · Phase 2 documents: script segments 1:00 and 4:45 rewritten around the judges' test pack, DEMO_INPUTS with the pack and the three requests, paste-ready prompt log for the submission form, prompt log re-exported · `submissions/**` · due Thu 14:50 · #dayof #pres
- [x] **K63** · PRES · Phase 2 Q&A section (which step handles which case, hard-coding, reject a fix, duplicates, Not found), deck notes with the case-to-step map, form-ready prompt log generator · `submissions/**` (deck folder is Avighna's: notes only) · due Thu 14:50 · #pres #dayof
- [x] **K64** · DAY · Real links and named agents: a no-DOI reference keeps the registered version with the cited year (its link opens); a "Handled by" line on every result; architecture slide in the presenter deck · `lib/verify/**`, `tabs/xray/ResultRow.tsx`, `tabs/research/ResearchTab.tsx`, `submissions/phase2/**` · due Thu 14:50 · #dayof #honesty
- [x] **K65** · PRES · Showcase deck (10 slides, live screenshots of the test pack); the chatbot-answer banner no longer fires on a lettered reference list; form prompt log grouped by phase with our method, prompts as typed · `submissions/phase2/**`, `lib/import/chatanswer.ts` · due Thu 14:50 · #pres #dayof
- [x] **K66** · PRES · Showcase deck as 6 slides, Phase 1 look, one colour: introduction, architecture and AI agents with live-run receipts, speaker notes, links checked · `submissions/phase2/demo-script/build-showcase.cjs`, `Team7_Veracite_Showcase.pptx` · due Thu 15:00 · #pres
- [x] **K67** · DAY · Research: pasted references are looked up one by one by the Verifier, never searched as keywords; bare web links are web sources · `lib/session/assistant.ts`, `useResearch.ts`, `lib/verify/verify.ts`, `tabs/research/ResearchTab.tsx` · due Thu 14:55 · #dayof #honesty
- [x] **K69** · PRES · Phase 2 build of the Phase 1 deck (PHASE2=1): same design, agents strip on the architecture slide, case-to-step box, notes extended · `submissions/phase1/deck/**` (Avighna's folder), `submissions/phase2/Team7_Veracite_Phase2_Deck.pptx` · due Thu 15:15 · #pres
- [x] **K54** · P0 · A question that cannot be understood is not searched: code guard for text with no usable words (every mode), Planner flag `understood`, back to the question with the reason · `veracite/src/lib/agents/question.ts`, `agents.ts`, `schemas.ts`, `lib/types.ts`, `lib/session/useResearch.ts` · due Thu 11:00 · #honesty #mvp
    - 26 Nov: verdicts keep the web evidence; Add as web page on the X-ray and the save page; record from the live/Wayback check + the student's own author/date; Library shows retrieval date + archive link; exports and certificates include it. 8 new tests.

## Wednesday evening · deck-promised extras (M3)
- [x] **K10** · P1 · Draft Checker: parse APA in-text citations → match library → support check (works on text from Avighna's Writer) · `veracite/src/components/app/tabs/draft/** veracite/src/app/api/draft/**` · due Wed 21:00 · #research #honesty
    - Avighna owns `tabs/draft/Writer.tsx`; you own the rest of `tabs/draft/**`.
- [x] **K11** · P1 · Citation snowballing (OpenAlex `referenced_works` / `cited_by`), results go through the Verifier · `veracite/src/app/api/sources/snowball/**` · due Wed 22:30 · #research
- [x] **K13** · P2 · Public verify API `GET /api/v1/verify?doi=` (first step to an MCP server) · `veracite/src/app/api/v1/** veracite/src/app/api/mcp/**` · #research
    - 26 Nov: `/api/v1/verify` (open CORS, edge cache for DOIs) + a working MCP server at `/api/mcp` (tool `verify_reference`, stateless JSON-RPC, no dependencies). 13 tests; docs in `docs/API.md`.
- [x] **K14** · P2 · Debate mode (Advocate vs Skeptic, student judges, 2 rounds) · `veracite/src/lib/agents/debate*` · #honesty #ux
    - 26 Nov: "Debate this claim" at checkpoint 3 (AI on): Advocate on the Scribe's chain, Skeptic on Qwen with no shared memory; code blocks unapproved sources and fake quotes, sets labels; 6 tests + UI wiring test with stand-in AI answers. **Not yet run on a real model (no key).**

## Thursday
- [ ] **K15** · DAY · Code freeze 11:00; pre-warm demo queries; backup deploy promoted · due Thu 11:00 · #dayof
- [x] **K16** · DAY · Phase 2: drive Claude Code using `docs/09_PHASE2_PLAYBOOK.md`; deploy by 14:40 · due Thu 14:40 · #dayof
- [ ] **K17** · PRES · Rehearse demo segment 2:00–5:30 three times with a timer · due Thu 12:30 · #pres

*K12 (web sources + Wayback) moved to Zedan as Z16 (P2).*
