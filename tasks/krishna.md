# Krishna Mathur · Product & Build Lead

**Owns:** the agent pipeline, registries, Verifier, APIs, deployment, Phase-2 keyboard. **Demo segment:** 2:00–5:30 (X-ray + research session). **Q&A lead:** tech, architecture, models, cost. **Quiz:** models, agents, tech terms.
Read first: `docs/11_BUILD_PLAN.md` (the plan we follow) → `docs/HANDOFF.md` → `docs/03_AGENTS_AND_ARCHITECTURE.md`.
**Milestones:** M0 Tue 23:59 (team unblocked) · **M1 Wed 13:00 (X-ray live)** · **M2 Wed 19:00 (spine live)** · M3 Wed 23:00 (P1 wave). No P1 work until your P0s are merged.

## Tuesday night · unblock the team (M0)
- [x] **K00** · P0 · Docs, deck, repo, task system and 3D prototypes in place · `docs/** submissions/** tasks/**` · due Tue 13:00 · #deck
- [ ] **K02** · P0 · Free keys (Groq, OpenAlex) in `veracite/.env.local`; Vercel project (root dir `veracite`) + env vars; add Avighna to the repo · due Tue 22:00 · #mvp
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

## Wednesday evening · deck-promised extras (M3)
- [x] **K10** · P1 · Draft Checker: parse APA in-text citations → match library → support check (works on text from Avighna's Writer) · `veracite/src/components/app/tabs/draft/** veracite/src/app/api/draft/**` · due Wed 21:00 · #research #honesty
    - Avighna owns `tabs/draft/Writer.tsx`; you own the rest of `tabs/draft/**`.
- [x] **K11** · P1 · Citation snowballing (OpenAlex `referenced_works` / `cited_by`), results go through the Verifier · `veracite/src/app/api/sources/snowball/**` · due Wed 22:30 · #research
- [ ] **K13** · P2 · Public verify API `GET /api/v1/verify?doi=` (first step to an MCP server) · `veracite/src/app/api/v1/**` · #research
- [ ] **K14** · P2 · Debate mode (Advocate vs Skeptic, student judges, 2 rounds) · `veracite/src/lib/agents/debate*` · #honesty #ux

## Thursday
- [ ] **K15** · DAY · Code freeze 11:00; pre-warm demo queries; backup deploy promoted · due Thu 11:00 · #dayof
- [ ] **K16** · DAY · Phase 2: drive Claude Code using `docs/09_PHASE2_PLAYBOOK.md`; deploy by 14:40 · due Thu 14:40 · #dayof
- [ ] **K17** · PRES · Rehearse demo segment 2:00–5:30 three times with a timer · due Thu 12:30 · #pres

*K12 (web sources + Wayback) moved to Zedan as Z16 (P2).*
