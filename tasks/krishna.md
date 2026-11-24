# Krishna Mathur · Product & Build Lead

**Owns:** the agent pipeline, registries, Verifier, APIs, deployment, Phase-2 keyboard. **Demo segment:** 2:00–5:30 (X-ray + research session). **Q&A lead:** tech, architecture, models, cost. **Quiz:** models, agents, tech terms.
Read first: `docs/HANDOFF.md` → `docs/03_AGENTS_AND_ARCHITECTURE.md` → `docs/SCORING_PLAN.md`.

## Tuesday · unblock the team
- [x] **K00** · P0 · Docs, deck, repo, task system and 3D prototypes in place · `docs/** submissions/** tasks/**` · due Tue 13:00 · #deck
- [ ] **K01** · P0 · Split `components/app/tabs.tsx` into one folder per tab (no behaviour change) so Z and A can work in parallel · `veracite/src/components/app/tabs/**` · due Tue 20:00 · #ux
    - Blocks: Z05, Z06, A05. Merge to `main` first.
- [ ] **K02** · P0 · Create free keys (Groq, OpenAlex) and paste them into `veracite/.env.local`; link Vercel project (root dir `veracite`); add env vars on Vercel · due Tue 21:00 · #mvp
- [ ] **K03** · P0 · Registry clients: Crossref (DOI, `query.bibliographic`, retractions via `update-to`), OpenAlex (DOI, search, abstract), arXiv; polite headers, 24h cache, rate limits · `veracite/src/lib/registries/**` · due Wed 10:00 · #mvp #honesty #research

## Wednesday · the real MVP
- [ ] **K04** · P0 · Verifier (code only): title normaliser and similarity, author match, year rule, chimera detector, status rules + unit tests on Zedan's golden set · `veracite/src/lib/verify/**` · due Wed 11:00 · #honesty
- [ ] **K05** · P0 · `/api/sources/xray` + wire the X-ray tab to it (real results, no SAMPLE) · `veracite/src/app/api/sources/** veracite/src/components/app/tabs/xray/**` · due Wed 12:00 · #mvp #honesty
- [ ] **K06** · P0 · LLM gateway: Groq with zod schemas, model per agent, fallback → Rules mode, budget counter, calls Zedan's PII scrubber + injection wrapper · `veracite/src/lib/llm/**` · due Wed 12:30 · #mvp #honesty
- [ ] **K07** · P0 · Deploy to Vercel, put the live link in `README.md` and `submissions/phase2/LIVE_LINK.md`, smoke test · due Wed 13:00 · #mvp
- [ ] **K08** · P0 · Agents: Planner, Reader (quotes + string match), Scribe (approved-ID whitelist), Skeptic (different model, rules S1–S8) · `veracite/src/lib/agents/**` · due Wed 16:00 · #mvp #research #honesty
- [ ] **K09** · P0 · Research orchestrator: state machine, 3 checkpoints, Receipts log; wire the Research tab end to end · `veracite/src/lib/session/** veracite/src/components/app/tabs/research/**` · due Wed 18:00 · #mvp #research #ux
- [ ] **K10** · P1 · Draft Checker real: parse APA in-text citations → match library → support check · `veracite/src/components/app/tabs/draft/** veracite/src/app/api/draft/**` · due Wed 20:00 · #research #honesty
- [ ] **K11** · P1 · Citation snowballing (OpenAlex `referenced_works` / `cited_by`), results go through the Verifier · `veracite/src/app/api/sources/snowball/**` · due Wed 21:00 · #research
- [ ] **K12** · P1 · Web sources: URL live check + Wayback snapshot + APA retrieval date · `veracite/src/app/api/sources/wayback/**` · due Wed 22:00 · #research
- [ ] **K13** · P2 · Public verify API `GET /api/v1/verify?doi=` (first step to an MCP server) · `veracite/src/app/api/v1/**` · #research
- [ ] **K14** · P2 · Debate mode (Advocate vs Skeptic, student judges, 2 rounds) · `veracite/src/lib/agents/debate*` · #honesty #ux

## Thursday
- [ ] **K15** · DAY · Code freeze 11:00; pre-warm demo queries; backup deploy promoted · due Thu 11:00 · #dayof
- [ ] **K16** · DAY · Phase 2: drive Claude Code using `docs/09_PHASE2_PLAYBOOK.md`; deploy by 14:40 · due Thu 14:40 · #dayof
- [ ] **K17** · PRES · Rehearse demo segment 2:00–5:30 three times with a timer · due Thu 12:30 · #pres
