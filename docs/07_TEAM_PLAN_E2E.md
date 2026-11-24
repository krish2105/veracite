# 07 · Team plan: who owns what, end to end

**Model:** Claude Code does the building. Each of you **owns** a workstream end to end: you write or approve the spec, steer Claude Code (or review what it built), test it, put it in the deck, demo it and answer judges' questions on it. Rule 2 says *"judges may question any member"*, so everyone must be able to explain the whole product in 60 seconds (script at the bottom).

## Roles

| | **Krishna Mathur** | **Zedan Nasir Parol** | **Avighna Gavhane** |
|---|---|---|---|
| Title | **Product & Build Lead** | **Trust, Ethics & QA Lead** | **Design, Story & Deck Lead** |
| Owns (features) | Agent crew and workflow (F01–F11, F13), Verifier + X-ray (F04, F15–F19), LLM gateway + fallback (F39–F40), deploy | Governance features (F34–F38, F41), integrity features (F20, F22, F23, F29–F31, F33), **golden test set + measured results**, Trust Center copy | UI direction + 3D (F44, F26), library UX (F21, F25, F27), RTL / ⌘K (F45, F46), SAMPLE ribbon (F43), guided demo (F48) |
| Owns (docs) | `03_AGENTS_AND_ARCHITECTURE`, `09_PHASE2_PLAYBOOK` | `05_ETHICS_GOVERNANCE_GUARDRAILS`, `PROMPT_LOG` (rule 8) | `04_UI_3D_DIRECTIONS`, `06_DECK_PLAN`, `08_DEMO_SCRIPT_AND_QA` |
| Deck slides | 2 Workflow, 3 Architecture (accuracy) | 4 Ethics, 5 Governance, 6 Guardrails (content + numbers) | 1 Overview + design of all 6 + export/upload |
| Phase 2 (90 min) | **At the keyboard** driving Claude Code | Reads requirements against the rules, writes acceptance tests, updates the Trust Center and prompt log, tests the live link | Updates the demo script and timing, records the backup video, takes screenshots, keeps the clock |
| Presentation (8 min) | 2:00–5:30 live demo (X-ray + agents) | 5:30–7:00 guardrails + governance (Trust Center, Rules mode) | 0:00–2:00 hook + problem; 7:00–8:00 close |
| Judges' Q&A lead | Tech, architecture, models, cost | Ethics, privacy, policy, testing | Users, UX, design, adoption, roadmap |
| AI quiz specialty | Models, agents, RAG, tech terms | Ethics, regulation, UAE/global AI policy | AI history, companies, products, general |
| Accounts to create | Groq, OpenAlex key, GitHub (private repo), Vercel | Semantic Scholar key (apply today), Google AI Studio (backup) | — (gets edit access to repo + Vercel) |

**If only one laptop runs Claude Code:** Krishna drives; Zedan and Avighna each keep a running list of fixes and requests in the team chat, and Krishna pastes them in as Claude Code prompts. **If everyone can run Claude Code:** each works on their own branch (`feat/trust`, `feat/ui`, `feat/agents`) and Krishna merges. Never let two people edit the same files at once.

## Timeline (Dubai time)

### Tuesday 24 Nov: decide and set up
| Time | Krishna | Zedan | Avighna |
|---|---|---|---|
| By 1:00 PM | **30-min team call:** read `00_START_HERE`, pick the UI direction, confirm feature tiers, agree roles | same | same |
| Afternoon | Create Groq + OpenAlex keys, GitHub repo, Vercel project. Start build steps 1–2 (design system, 3D hero, registries, Verifier, X-ray) | Apply for the Semantic Scholar key. **Build the golden test set** (30 real, 20 fabricated by ChatGPT/Gemini, 10 chimeras, 5 retracted, 5 web) as JSON/CSV, every row marked `sample: true` | Deck v0: titles and structure in the chosen style; gather logo/brand assets; write landing-page copy |
| Evening | Build steps 3–4 (library, export, LLM gateway, Planner → Scribe → Skeptic + checkpoints) | Draft Trust Center copy (model card, policies, data handling); start `PROMPT_LOG.md` entries | Write demo script v1 and pick demo questions |
| 11:00 PM | **Checkpoint:** X-ray works end to end on the golden set | Test-set file ready | Deck v0 done |

### Wednesday 25 Nov: build, test, deck
| Time | Krishna | Zedan | Avighna |
|---|---|---|---|
| Morning | Build step 5 (Receipts, ledger, disclosure, Trust Center) + start the P1 wave | Run the golden set through X-ray; log every miss as a bug for Krishna | Review the UI on laptop and phone; list visual fixes |
| 1:00 PM | **Deploy to Vercel.** Live link in the team chat | Test the live link in incognito | Screenshots for the deck |
| Afternoon | P1 wave (Reader, Draft Checker, Certificate, Galaxy, quality facts, bias lens, autonomy dial…) | Measure results → slide 6 numbers; write the Phase 2 rules checklist | Deck v1 complete (all 6 slides) |
| 7:00 PM | **Rehearsal #1**: full 8-min demo + 2-min Q&A drill (timer on) | same | same |
| Evening | Fix rehearsal bugs; P2 features only if everything is green | Q&A bank answers (ethics/governance) | Deck v2 → **export PDF → upload by 11:00 PM** → screenshot proof in the team chat |

### Thursday 26 Nov: deliver
| Time | What |
|---|---|
| 7:30–8:30 AM | Final deck check (6 slides, link works). Re-upload only if needed. **Hard stop 8:30 AM** |
| 9:00–11:00 AM | Code freeze for features; bug fixes only. Pre-warm the demo questions (cache). Record the **90-second backup video** |
| 11:00 AM–12:30 PM | **Rehearsal #2 and #3** (one with a deliberately broken Wi-Fi scenario → switch to cached demo / video) |
| 12:30 PM | Lunch, charge laptops, chargers packed, **formal dress**, logins tested (Groq, Vercel, GitHub, Claude) |
| **1:15 PM** | Arrive at the Simulation Lab, 2nd floor (late teams lose build time) |
| 1:15–1:30 | Requirements revealed → run the **first 10 minutes of `09_PHASE2_PLAYBOOK`** |
| 1:30–3:00 | Phase 2 build. **Deploy by 2:40**, smoke test by 2:50, **no changes after 2:55** |
| 3:00 | Submissions close (the live link is what's judged; changes after 3:00 are ignored) |
| 3:15–3:20 | AI quiz (one answer per question as a team: decide fast, trust the specialist) |
| 3:20–4:40 | Presentations (8 min demo + 2 min Q&A, strict) |

## Communication rules
- One team chat thread. Every decision gets one line: **"DECIDED: …"**
- Blockers get raised within 15 minutes, not 2 hours.
- Krishna merges and deploys; nobody else pushes to `main` on Thursday.
- Every AI prompt anyone uses for the hackathon goes into `PROMPT_LOG.md` (rule 8: we must submit it).

## The 60-second explanation everyone must be able to give
> "Students use AI to find sources, and AI invents references: a real author with the wrong paper, DOIs that don't exist. **Veracite** is a reference manager with an AI research crew that *can't* do that. A Planner, Scout, Reader, Scribe and Skeptic do the work, but references can only come from public registries like Crossref and OpenAlex, and a code-only Verifier checks every one in two registries. Every sentence is labelled Verified, Reported, AI reasoning or Not found. The student approves the plan, the sources and the claims. And we export APA 7 plus an AI-use statement built from the actual logs, matching SP Jain's own integrity policy."
