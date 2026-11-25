# 📊 Veracite · live project status

> **Auto-generated** from `tasks/*.md` by `scripts/status.mjs`. Don't edit by hand: tick your task file and push.
> Last updated **Wed 25 Nov, 22:03 (Dubai)** · commit `a8e7bb9`

## At a glance
| | |
|---|---|
| **Overall progress** | ██████░░░░ **56%** (31/55 tasks) |
| **P0 demo spine** | ███████░░░ 19/26 |
| **Build** | Type-check 🟢 passing · Production build 🟢 passing |
| **Live link** | https://veracite.vercel.app |
| **In progress / blocked** | 2 🔨 · 0 ⛔ |

## ⏱️ Deadlines
| What | When (Dubai) | Time left |
|---|---|---|
| Deck upload (team target) | Wed 23:00 | **0h 56m** |
| Deck upload (official, hard) | Thu 09:00 | **10h 56m** |
| Arrive at the Simulation Lab | Thu 13:15 | **15h 11m** |
| Phase 2 submissions close | Thu 15:00 | **16h 56m** |

## 👥 By person
| Person | Progress | ✅ | 🔨 | ⬜ | ⛔ |
|---|---|---|---|---|---|
| [Krishna Mathur](../tasks/krishna.md) | ████████░░ 75% | 18 | 0 | 6 | 0 |
| [Zedan Nasir Parol](../tasks/zedan.md) | ███████░░░ 69% | 11 | 1 | 4 | 0 |
| [Avighna Gavhane](../tasks/avighna.md) | █░░░░░░░░░ 13% | 2 | 1 | 12 | 0 |

## 🎯 Readiness by judging criterion (out of 100)
*Share of tasks tagged with each criterion that are done. A progress signal, not a predicted score.*
| Criterion | Points | Readiness |
|---|---|---|
| Working MVP | 15 | ████████░░ 82% (9/11) |
| Research & citation features | 12 | ███████░░░ 74% (14/19) |
| Honesty & verification in action | 10 | ██████████ 95% (19/20) |
| Day-of requirements | 8 | ░░░░░░░░░░ 0% (0/5) |
| User experience | 8 | ██████░░░░ 63% (12/19) |
| Presentation & Q&A | 12 | ░░░░░░░░░░ 0% (0/8) |
| Phase 1 deck | 30 | ██░░░░░░░░ 20% (1/5) |
| AI quiz | 5 | n/a |

## 🔨 Doing now
- **A11** Final demo script with timings (add the Write & cite moment); record a 90-second backup video; take README screenshots · Avighna Gavhane · due Thu 11:00
- **Z11** Write final answers for the ethics/governance Q&A bank (docs/08 Q9–Q16) and memorise the 60-second pitch · Zedan Nasir Parol · due Wed 22:00

## ⛔ Blocked
_Nothing blocked._

## 📋 Remaining (by person)
### Krishna Mathur
- ⬜ **K02** · P0 · Free keys (Groq, OpenAlex) in `veracite/.env.local`; Vercel project (root dir `veracite`) + env vars; add Avighna to the repo · _due Tue 22:00_
- ⬜ **K13** · P2 · Public verify API `GET /api/v1/verify?doi=` (first step to an MCP server)
- ⬜ **K14** · P2 · Debate mode (Advocate vs Skeptic, student judges, 2 rounds)
- ⬜ **K15** · DAY · Code freeze 11:00; pre-warm demo queries; backup deploy promoted · _due Thu 11:00_
- ⬜ **K16** · DAY · Phase 2: drive Claude Code using `docs/09_PHASE2_PLAYBOOK.md`; deploy by 14:40 · _due Thu 14:40_
- ⬜ **K17** · PRES · Rehearse demo segment 2:00–5:30 three times with a timer · _due Thu 12:30_

### Zedan Nasir Parol
- ⬜ **Z02** · P0 · Keep `docs/PROMPT_LOG.md` complete for all three of us (hackathon rule 8): add your own and Avighna's prompts · _due ongoing_
- 🔨 **Z11** · PRES · Write final answers for the ethics/governance Q&A bank (docs/08 Q9–Q16) and memorise the 60-second pitch · _due Wed 22:00_
- ⬜ **Z12** · DAY · Phase 2: underline every "must"; write 3 acceptance checks per requirement; test the live link in incognito at 14:40 · _due Thu 14:50_
- ⬜ **Z13** · DAY · Update the Trust Center and prompt log for anything Phase 2 changed; export the prompt log to `submissions/prompt-log/` · _due Thu 14:55_
- ⬜ **Z14** · PRES · Rehearse segment 5:30–7:00 (export → statement → certificate → Rules mode) · _due Thu 12:30_

### Avighna Gavhane
- ⬜ **A01** · P0 · Apply the 7 deck fixes in `docs/11_BUILD_PLAN.md` §9 (ask Claude Code to edit `submissions/phase1/deck/build-deck.cjs`, rebuild PPTX + PDF); send your GitHub username to Krishna · _due Tue 23:00_
- ⬜ **A02** · P0 · Upload the fixed deck **PDF** tonight as insurance, then the final version by **Wed 23:00** (hard deadline Thu 09:00; the latest upload counts); screenshot the "uploaded" status into the team chat · _due Wed 23:00_
- ⬜ **A05** · P0 · Library store on the device (IndexedDB via Dexie): collections, tags, notes, "opened" flag; Library tab reads real items. API in docs/11 §5 (Krishna, Zedan and A14 use it) · _due Wed 12:00_
- ⬜ **A04** · P0 · Design-system basics: Watermark tokens everywhere, light/UV toggle on every page, remove the A/B skin switch, focus states, reduced motion, list view for every 3D view · _due Wed 13:00_
- ⬜ **A06** · P0 · Export with citation-js + official CSL: APA 7, BibTeX, RIS first (MLA 9, Harvard, IEEE, Chicago in the evening); import BibTeX/RIS · _due Wed 15:00_
- ⬜ **A15** · P1 · One-click "Save to Veracite" bookmarklet: reads the page's DOI meta tag, opens Veracite's `/save` page, verifies via `/api/sources/verify`, saves to the library (like Zotero's browser button) · _due Wed 21:00_
- ⬜ **A07** · P2 · Mission Control 3D = the Neural network (from `/lab/neural`) in Watermark colours inside the Research tab, wired to Krishna's real session state (the current MiniMission stays until then)
- ⬜ **A08** · P2 · Arabic / English toggle (nav + key labels, RTL)
- ⬜ **A09** · P2 · ⌘K command palette (search library, run X-ray, export, theme)
- ⬜ **A10** · P2 · PDF drop: read DOIs and the reference list in the browser (pdf.js) and send them to the X-ray
- 🔨 **A11** · PRES · Final demo script with timings (add the Write & cite moment); record a 90-second backup video; take README screenshots · _due Thu 11:00_
- ⬜ **A12** · DAY · Phase 2: rewrite demo segment 4:30–5:30 around the new requirement; keep the clock · _due Thu 14:50_
- ⬜ **A13** · PRES · Rehearse the opening and close with a timer; check outfits, chargers and logins · _due Thu 12:30_

## ✅ Done
- **A14** Write & cite: a writing pane where "Insert citation" picks from the verified library, drops "(Author, Year)" into the text and builds the APA 7 reference list live; only library sources can be cited · Avighna Gavhane
- **A03** Landing page `/` = the Vault 3D (from `/lab/vault`) with real buttons into X-ray, Research and Library; UV-lamp theme toggle · Avighna Gavhane
- **K00** Docs, deck, repo, task system and 3D prototypes in place · Krishna Mathur
- **K01** Split `components/app/tabs.tsx` into one folder per tab (no behaviour change) so Z and A can work in parallel · Krishna Mathur
- **K18** Shared contracts: `src/lib/types.ts` (types from docs/03 §7) + `src/lib/flags.ts` (feature flags) · Krishna Mathur
- **K07** First deploy of the current preview to Vercel; live link in `README.md` and `submissions/phase2/LIVE_LINK.md`; every merge to main auto-deploys after this · Krishna Mathur
- **K03** Registry clients: Crossref (DOI, `query.bibliographic`, retractions via `updated-by`), OpenAlex (DOI, search, abstract), arXiv; polite headers, 24h cache, max 3 concurrent · Krishna Mathur
- **K04** Verifier (code only): title normaliser and similarity, author match, year rule, DOI→title consistency, chimera detector, status rules + unit tests on Zedan's golden set · Krishna Mathur
- **K05** `/api/sources/verify` + `/api/sources/xray` (streams results line by line) + wire the X-ray tab (real results, no SAMPLE) · Krishna Mathur
- **K06** LLM gateway: Groq with zod schemas, model per agent (docs/11 §6), fallback → Rules mode, budget caps, calls Zedan's PII scrubber + injection check · Krishna Mathur
- **K08** Agents: Planner, Reader (quotes + string match), Scribe (approved-ID whitelist, max 8 abstracts), Skeptic (Qwen, rules S1–S8, 2 rounds) · Krishna Mathur
- **K09** Research orchestrator: state machine, 3 checkpoints, autonomy dial (Off / Assist / Co-pilot), Receipts log, approved sources saved to the library; wire the Research tab end to end · Krishna Mathur
- **K19** Five-requirement path on the X-ray page: fake-reference check, labels + legend, approve to list, APA 7 copy/download, AI-use statement, phone layout · Krishna Mathur
- **K20** Replace sample pages with real ones: front page, shell, Library (organise, BibTeX/RIS/CSL, bias lens), Trust Center (measured results, Prompt Ledger), Certificate (QR + live re-check), eval runner reads NDJSON · Krishna Mathur
- **K21** X-ray checks web pages (connects Z16): live or archived pages that match the cited title are Partial, never Verified · Krishna Mathur
- **K22** 3D vault as the home page with buttons into the app; plain cards below 1024 px, with reduced motion or without WebGL (covers A03) · Krishna Mathur
- **K23** Home page redesign (labelled fake note + three ways in) and effects on every app page: engraved background, torch glow, 3D note banner · Krishna Mathur
- **K24** Headings fit their boxes; phones in dark mode no longer repaint the daylight theme; 3D vault on upright phones and tablets · Krishna Mathur
- **K10** Draft Checker: parse APA in-text citations → match library → support check (works on text from Avighna's Writer) · Krishna Mathur
- **K11** Citation snowballing (OpenAlex `referenced_works` / `cited_by`), results go through the Verifier · Krishna Mathur
- **Z01** Golden test set: 30 real references (check each DOI by hand), 20 AI-fabricated (generate with ChatGPT/Gemini and log the prompts), 10 chimeras, 5 retracted (real retracted DOIs), 5 web pages. Format in `veracite/tests/golden/README.md` · Zedan Nasir Parol
- **Z05** PII scrubber + prompt-injection detector (pure functions + tests). Krishna's LLM gateway calls them. Start Tuesday night if Z01 is done · Zedan Nasir Parol
- **Z04** Integrity library: AI-use statement generator from the Receipts log (APA 2025 + SP Jain §h(viii)), Prompt Ledger export. Build against the `Receipt` type in `src/lib/types.ts` · Zedan Nasir Parol
- **Z06** Eval runner: run the X-ray over the golden set → `veracite/tests/results/latest.json` + summary (caught / false-Verified / real verified / time) · Zedan Nasir Parol
- **Z07** Trust Center: replace illustrative numbers with measured ones from Z06; model card (new model map, docs/11 §6), policies, data flow, "report a wrong verdict" link · Zedan Nasir Parol
- **Z15** Export gate before download: unread-source warning (read-before-you-cite), one explain-it-back line per key source (AI button disabled there), AI-use statement preview. Uses Avighna's library + export libs · Zedan Nasir Parol
- **Z08** Certificate: encode verified bibliography + SHA-256 into the URL, decode on `/certificate`, re-verify live, real QR · Zedan Nasir Parol
- **Z09** Paraphrase guard (n-gram overlap) for the Draft Checker · Zedan Nasir Parol
- **Z10** Bias-lens numbers from OpenAlex fields (country, year, open access, publisher) · Zedan Nasir Parol
- **Z16** Web sources: URL live check + Wayback snapshot + APA retrieval date (moved from K12; a likely Phase-2 ask) · Zedan Nasir Parol
- **Z03** Apply for a Semantic Scholar API key (optional; Semantic Scholar is not in the demo spine) · Zedan Nasir Parol
