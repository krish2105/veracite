# 📊 Veracite · live project status

> **Auto-generated** from `tasks/*.md` by `scripts/status.mjs`. Don't edit by hand: tick your task file and push.
> Last updated **Tue 24 Nov, 22:57 (Dubai)** · commit `cbf27e6`

## At a glance
| | |
|---|---|
| **Overall progress** | █░░░░░░░░░ **12%** (6/49 tasks) |
| **P0 demo spine** | ███░░░░░░░ 6/24 |
| **Build** | Type-check 🟢 passing · Production build 🟢 passing |
| **Live link** | not deployed yet |
| **In progress / blocked** | 0 🔨 · 0 ⛔ |

## ⏱️ Deadlines
| What | When (Dubai) | Time left |
|---|---|---|
| Deck upload (team target) | Wed 23:00 | **1d 0h** |
| Deck upload (official, hard) | Thu 09:00 | **1d 10h** |
| Arrive at the Simulation Lab | Thu 13:15 | **1d 14h** |
| Phase 2 submissions close | Thu 15:00 | **1d 16h** |

## 👥 By person
| Person | Progress | ✅ | 🔨 | ⬜ | ⛔ |
|---|---|---|---|---|---|
| [Krishna Mathur](../tasks/krishna.md) | ███░░░░░░░ 33% | 6 | 0 | 12 | 0 |
| [Zedan Nasir Parol](../tasks/zedan.md) | ░░░░░░░░░░ 0% | 0 | 0 | 16 | 0 |
| [Avighna Gavhane](../tasks/avighna.md) | ░░░░░░░░░░ 0% | 0 | 0 | 15 | 0 |

## 🎯 Readiness by judging criterion (out of 100)
*Share of tasks tagged with each criterion that are done. A progress signal, not a predicted score.*
| Criterion | Points | Readiness |
|---|---|---|
| Working MVP | 15 | ███░░░░░░░ 33% (3/9) |
| Research & citation features | 12 | █░░░░░░░░░ 6% (1/16) |
| Honesty & verification in action | 10 | ██░░░░░░░░ 18% (3/17) |
| Day-of requirements | 8 | ░░░░░░░░░░ 0% (0/5) |
| User experience | 8 | █░░░░░░░░░ 7% (1/14) |
| Presentation & Q&A | 12 | ░░░░░░░░░░ 0% (0/8) |
| Phase 1 deck | 30 | ██░░░░░░░░ 20% (1/5) |
| AI quiz | 5 | n/a |

## 🔨 Doing now
_Nothing marked in progress._

## ⛔ Blocked
_Nothing blocked._

## 📋 Remaining (by person)
### Krishna Mathur
- ⬜ **K02** · P0 · Free keys (Groq, OpenAlex) in `veracite/.env.local`; Vercel project (root dir `veracite`) + env vars; add Avighna to the repo · _due Tue 22:00_
- ⬜ **K07** · P0 · First deploy of the current preview to Vercel; live link in `README.md` and `submissions/phase2/LIVE_LINK.md`; every merge to main auto-deploys after this · _due Tue 23:59_
- ⬜ **K06** · P0 · LLM gateway: Groq with zod schemas, model per agent (docs/11 §6), fallback → Rules mode, budget caps, calls Zedan's PII scrubber + injection check · _due Wed 14:30_
- ⬜ **K08** · P0 · Agents: Planner, Reader (quotes + string match), Scribe (approved-ID whitelist, max 8 abstracts), Skeptic (Qwen, rules S1–S8, 2 rounds) · _due Wed 16:30_
- ⬜ **K09** · P0 · Research orchestrator: state machine, 3 checkpoints, autonomy dial (Off / Assist / Co-pilot), Receipts log, approved sources saved to the library; wire the Research tab end to end · _due Wed 19:00_
- ⬜ **K10** · P1 · Draft Checker: parse APA in-text citations → match library → support check (works on text from Avighna's Writer) · _due Wed 21:00_
- ⬜ **K11** · P1 · Citation snowballing (OpenAlex `referenced_works` / `cited_by`), results go through the Verifier · _due Wed 22:30_
- ⬜ **K13** · P2 · Public verify API `GET /api/v1/verify?doi=` (first step to an MCP server)
- ⬜ **K14** · P2 · Debate mode (Advocate vs Skeptic, student judges, 2 rounds)
- ⬜ **K15** · DAY · Code freeze 11:00; pre-warm demo queries; backup deploy promoted · _due Thu 11:00_
- ⬜ **K16** · DAY · Phase 2: drive Claude Code using `docs/09_PHASE2_PLAYBOOK.md`; deploy by 14:40 · _due Thu 14:40_
- ⬜ **K17** · PRES · Rehearse demo segment 2:00–5:30 three times with a timer · _due Thu 12:30_

### Zedan Nasir Parol
- ⬜ **Z01** · P0 · Golden test set: 30 real references (check each DOI by hand), 20 AI-fabricated (generate with ChatGPT/Gemini and log the prompts), 10 chimeras, 5 retracted (real retracted DOIs), 5 web pages. Format in `veracite/tests/golden/README.md` · _due Wed 09:00_
- ⬜ **Z02** · P0 · Keep `docs/PROMPT_LOG.md` complete for all three of us (hackathon rule 8): add your own and Avighna's prompts · _due ongoing_
- ⬜ **Z05** · P0 · PII scrubber + prompt-injection detector (pure functions + tests). Krishna's LLM gateway calls them. Start Tuesday night if Z01 is done · _due Wed 11:00_
- ⬜ **Z04** · P0 · Integrity library: AI-use statement generator from the Receipts log (APA 2025 + SP Jain §h(viii)), Prompt Ledger export. Build against the `Receipt` type in `src/lib/types.ts` · _due Wed 13:00_
- ⬜ **Z06** · P0 · Eval runner: run the X-ray over the golden set → `veracite/tests/results/latest.json` + summary (caught / false-Verified / real verified / time) · _due Wed 15:00_
- ⬜ **Z07** · P0 · Trust Center: replace illustrative numbers with measured ones from Z06; model card (new model map, docs/11 §6), policies, data flow, "report a wrong verdict" link · _due Wed 17:00_
- ⬜ **Z15** · P1 · Export gate before download: unread-source warning (read-before-you-cite), one explain-it-back line per key source (AI button disabled there), AI-use statement preview. Uses Avighna's library + export libs · _due Wed 20:00_
- ⬜ **Z08** · P1 · Certificate: encode verified bibliography + SHA-256 into the URL, decode on `/certificate`, re-verify live, real QR · _due Wed 21:00_
- ⬜ **Z09** · P1 · Paraphrase guard (n-gram overlap) for the Draft Checker · _due Wed 22:00_
- ⬜ **Z10** · P1 · Bias-lens numbers from OpenAlex fields (country, year, open access, publisher) · _due Wed 22:30_
- ⬜ **Z11** · PRES · Write final answers for the ethics/governance Q&A bank (docs/08 Q9–Q16) and memorise the 60-second pitch · _due Wed 22:00_
- ⬜ **Z16** · P2 · Web sources: URL live check + Wayback snapshot + APA retrieval date (moved from K12; a likely Phase-2 ask)
- ⬜ **Z03** · P2 · Apply for a Semantic Scholar API key (optional; Semantic Scholar is not in the demo spine)
- ⬜ **Z12** · DAY · Phase 2: underline every "must"; write 3 acceptance checks per requirement; test the live link in incognito at 14:40 · _due Thu 14:50_
- ⬜ **Z13** · DAY · Update the Trust Center and prompt log for anything Phase 2 changed; export the prompt log to `submissions/prompt-log/` · _due Thu 14:55_
- ⬜ **Z14** · PRES · Rehearse segment 5:30–7:00 (export → statement → certificate → Rules mode) · _due Thu 12:30_

### Avighna Gavhane
- ⬜ **A01** · P0 · Apply the 7 deck fixes in `docs/11_BUILD_PLAN.md` §9 (ask Claude Code to edit `submissions/phase1/deck/build-deck.cjs`, rebuild PPTX + PDF); send your GitHub username to Krishna · _due Tue 23:00_
- ⬜ **A02** · P0 · Upload the fixed deck **PDF** tonight as insurance, then the final version by **Wed 23:00** (hard deadline Thu 09:00; the latest upload counts); screenshot the "uploaded" status into the team chat · _due Wed 23:00_
- ⬜ **A05** · P0 · Library store on the device (IndexedDB via Dexie): collections, tags, notes, "opened" flag; Library tab reads real items. API in docs/11 §5 (Krishna, Zedan and A14 use it) · _due Wed 12:00_
- ⬜ **A04** · P0 · Design-system basics: Watermark tokens everywhere, light/UV toggle on every page, remove the A/B skin switch, focus states, reduced motion, list view for every 3D view · _due Wed 13:00_
- ⬜ **A06** · P0 · Export with citation-js + official CSL: APA 7, BibTeX, RIS first (MLA 9, Harvard, IEEE, Chicago in the evening); import BibTeX/RIS · _due Wed 15:00_
- ⬜ **A14** · P0 · Write & cite: a writing pane where "Insert citation" picks from the verified library, drops "(Author, Year)" into the text and builds the APA 7 reference list live; only library sources can be cited · _due Wed 18:00_
- ⬜ **A03** · P0 · Landing page `/` = the Vault 3D (from `/lab/vault`) with real buttons into X-ray, Research and Library; UV-lamp theme toggle · _due Wed 19:00_
- ⬜ **A15** · P1 · One-click "Save to Veracite" bookmarklet: reads the page's DOI meta tag, opens Veracite's `/save` page, verifies via `/api/sources/verify`, saves to the library (like Zotero's browser button) · _due Wed 21:00_
- ⬜ **A07** · P2 · Mission Control 3D = the Neural network (from `/lab/neural`) in Watermark colours inside the Research tab, wired to Krishna's real session state (the current MiniMission stays until then)
- ⬜ **A08** · P2 · Arabic / English toggle (nav + key labels, RTL)
- ⬜ **A09** · P2 · ⌘K command palette (search library, run X-ray, export, theme)
- ⬜ **A10** · P2 · PDF drop: read DOIs and the reference list in the browser (pdf.js) and send them to the X-ray
- ⬜ **A11** · PRES · Final demo script with timings (add the Write & cite moment); record a 90-second backup video; take README screenshots · _due Thu 11:00_
- ⬜ **A12** · DAY · Phase 2: rewrite demo segment 4:30–5:30 around the new requirement; keep the clock · _due Thu 14:50_
- ⬜ **A13** · PRES · Rehearse the opening and close with a timer; check outfits, chargers and logins · _due Thu 12:30_

## ✅ Done
- **K00** Docs, deck, repo, task system and 3D prototypes in place · Krishna Mathur
- **K01** Split `components/app/tabs.tsx` into one folder per tab (no behaviour change) so Z and A can work in parallel · Krishna Mathur
- **K18** Shared contracts: `src/lib/types.ts` (types from docs/03 §7) + `src/lib/flags.ts` (feature flags) · Krishna Mathur
- **K03** Registry clients: Crossref (DOI, `query.bibliographic`, retractions via `updated-by`), OpenAlex (DOI, search, abstract), arXiv; polite headers, 24h cache, max 3 concurrent · Krishna Mathur
- **K04** Verifier (code only): title normaliser and similarity, author match, year rule, DOI→title consistency, chimera detector, status rules + unit tests on Zedan's golden set · Krishna Mathur
- **K05** `/api/sources/verify` + `/api/sources/xray` (streams results line by line) + wire the X-ray tab (real results, no SAMPLE) · Krishna Mathur
