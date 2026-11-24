# 00 · START HERE · Team 7 · Veracite

> **Veracite: the AI research assistant that can't make up a reference.**
> *Every reference real. Every claim traceable. You stay in charge.*

**Team 7:** Krishna Mathur (Product & Build) · Zedan Nasir Parol (Trust, Ethics & QA) · Avighna Gavhane (Design, Story & Deck)
**Problem:** "Honest references with an AI research assistant" (AI Club Hackathon 2026, SP Jain Dubai)

## Deadlines (Dubai time)
| When | What | Status |
|---|---|---|
| **Wed 25 Nov, 11:00 PM** | *Our* deck deadline (upload early) | ⬜ |
| **Thu 26 Nov, 9:00 AM** | Official Phase 1 deck deadline: ≤ 6 slides, PPTX or PDF, late = not scored | ⬜ |
| **Thu 26 Nov, 1:15 PM** | Arrive at the Simulation Lab, 2nd floor, **formal dress**, charged laptops, logins ready | ⬜ |
| Thu 1:30–3:00 PM | Phase 2: adapt the website to new requirements (90 min) | ⬜ |
| Thu 3:15 PM | AI quiz (team, ≤ 5 min, counts) | ⬜ |
| Thu 3:20–4:40 PM | 8-min demo from the **live link** + 2-min Q&A | ⬜ |

## Every deliverable we owe
1. **Ideation deck** (6 slides; Workflow 8 · Architecture 6 · Ethics 5 · Governance 5 · Guardrails 6 = 30 pts) → `06_DECK_PLAN.md`
2. **A working first version of the website** before Thursday (rule 6) → `02`, `03`, `04`
3. **Phase 2 adaptation**, live by 3:00 PM Thursday → `09_PHASE2_PLAYBOOK.md`
4. **A live link** to present from (rule 15) → Vercel
5. **Record of AI prompts used** (rule 8, to be submitted) → `PROMPT_LOG.md`
6. **8-min demo + Q&A** → `08_DEMO_SCRIPT_AND_QA.md`
7. **AI quiz** → `10_AI_QUIZ_PREP.md`
8. **Honesty rules:** label every sample/simulated item; no personal data; follow SP Jain's AI policy (rules 9–11)

## The documents (read in this order)
| File | What's in it | Owner |
|---|---|---|
| `01_RESEARCH_REPORT.md` | Evidence, competitors, free APIs and limits, policies, the 10 design decisions research forces | All |
| `02_FEATURE_BIBLE.md` | All ~49 features, tiered P0/P1/P2/Roadmap, mapped to rubric and owner; what we refuse to build | Krishna |
| `03_AGENTS_AND_ARCHITECTURE.md` | 8 agents + student, workflow with 3 checkpoints and 5 checks, trust-label rules, architecture, stack, models, tests | Krishna |
| `04_UI_3D_DIRECTIONS.md` | 4 full-3D design directions with tokens, type, layouts, 3D scenes; recommendation | Avighna |
| `05_ETHICS_GOVERNANCE_GUARDRAILS.md` | Risk → response, RACI, disclosure, policies, 17 guardrails | Zedan |
| `06_DECK_PLAN.md` | Slide-by-slide content for the 6-slide deck | Avighna |
| `07_TEAM_PLAN_E2E.md` | Roles, hour-by-hour plan Tue → Thu, the 60-second pitch everyone memorises | All |
| `08_DEMO_SCRIPT_AND_QA.md` | 8-min script with timings + 24 judge questions with answers | Avighna |
| `09_PHASE2_PLAYBOOK.md` | The 90 minutes on Thursday + prepared moves for likely requirements | Krishna |
| `10_AI_QUIZ_PREP.md` | Terms, timeline, regulation, UAE AI facts, Groq ≠ Grok | All |
| `PROMPT_LOG.md` | Required prompt record (keep adding to it) | Zedan |
| `ui-directions/index.html` | Live 3D design boards for the 4 directions (open in a browser) | Avighna |

## Why we can win (the 5 things judges will remember)
1. **A structural guarantee:** our AI *cannot* write a reference. It can only point to records fetched from Crossref and OpenAlex, and a code-only Verifier checks every one in two registries.
2. **The live X-ray moment:** paste a ChatGPT bibliography and watch the fakes and the "chimeras" (real parts, wrong combination) get caught. That's SP Jain's own policy clause §h(ix) on screen.
3. **The student is visibly in charge:** 3 approval checkpoints, an autonomy dial with AI fully off, explain-it-back.
4. **Governance generated from logs:** APA AI-use statement, Prompt Ledger and a QR Verification Certificate a professor can re-check.
5. **An unforgettable look:** a UV-lamp theme toggle that reveals "VOID" on counterfeit references (recommended direction).

## Decisions made
- Name **Veracite** · AI on **Groq free tier** (+ Rules mode with no AI) · Claude Code builds, the 3 of us own workstreams · all 16 optional features in, **tiered** so the demo spine is never at risk · stack: Next.js 16 + R3F + Tailwind 4 on Vercel (empty scaffold already in `../veracite/`)

## How we're scored (official rubric, out of 100)
| Part | Points | Breakdown |
|---|---|---|
| Phase 1 deck | 30 | Workflow 8 · Architecture 6 · Ethical considerations 5 · Governance 5 · Guardrails 6 |
| AI quiz | 5 | 1st 5 · 2nd 4 · 3rd 3 · 4th 2 · others 1 |
| **Phase 2 website + presentation** | **65** | **Working MVP 15 · Research & citation features 12 · Honesty & verification in action 10 · Day-of requirements 8 · User experience 8 · Presentation & Q&A 12** |
Ties go to the higher Phase 2 score. Our plan for 95+: [`SCORING_PLAN.md`](SCORING_PLAN.md). Live progress: [`STATUS.md`](STATUS.md). Your tasks: [`../tasks/`](../tasks/).

## Decisions made on 24 Nov (afternoon)
- **Look: Hybrid.** Watermark colours and fonts; the Vault 3D is the landing page; the Neural 3D is Research's Mission Control.
- **Repo:** private on GitHub until Thu 15:00, then public. Only the three of us appear as contributors.
- **Deck:** done. `submissions/phase1/Team7_Veracite_Phase1_Deck.pdf` (upload the PDF).

## Decisions still needed from the team
1. GitHub usernames of Zedan and Avighna (to add as collaborators).
2. Paste the free Groq + OpenAlex keys into `veracite/.env.local` (Krishna, task K02).
3. Go-ahead to build the real MVP (tasks K03 onwards).

## In the next 2 hours
- **Krishna:** create the Groq API key + OpenAlex API key, a private GitHub repo and a Vercel account.
- **Zedan:** apply for a Semantic Scholar API key; start the golden test set (`03_…` §10).
- **Avighna:** open the design boards, shortlist a direction, start deck v0 titles.
- **All:** 30-minute call by 1:00 PM; read this file + `07_TEAM_PLAN_E2E.md`; memorise the 60-second pitch.
