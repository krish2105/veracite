# 02 · Feature bible: everything Veracite does, ranked

*Every feature is tied to a judging criterion. Owner = the teammate who writes its spec, reviews what Claude Code builds, tests it and demos it (K = Krishna, Z = Zedan, A = Avighna).*

**Tiers**
- **P0, demo spine.** Must work flawlessly before Thursday. If any P0 is broken, stop building P1/P2.
- **P1, differentiators.** These win the room. Build them Wednesday.
- **P2, polish and stretch.** Build only if every P0/P1 is green by Wednesday evening.
- **R, roadmap.** Don't build. Mention in the deck or Q&A as "next".

> **Golden rule for a hackathon:** a flawless 12-feature demo beats a shaky 40-feature demo. You picked all 16 optional features, and they're all here, but in tiers, so the demo spine is never at risk.

**Rubric shorthand:** W = Workflow (8), Ar = Architecture (6), Et = Ethics (5), Gv = Governance (5), Gr = Guardrails (6). These are the 30 Phase-1 deck points; the same features carry the live demo.

---

## A. The agentic research workflow (the heart of the product)

| ID | Feature | What the student sees | How it works | Rubric | Tier | Owner |
|---|---|---|---|---|---|---|
| F01 | **Research session + Mission Control** | Type a question. A live panel shows each agent waking up, working and handing over, with timings and a "Why?" button | Client-side state machine; each agent is a stateless API call; every step written to the Receipts log | W, Ar | P0 | K |
| F02 | **Checkpoint 1: approve the plan** | Planner proposes sub-questions, keywords, year range and inclusion rules. Student edits and clicks *Approve plan* | Planner LLM → JSON schema; nothing searches until approved | W, Gr | P0 | K |
| F03 | **Multi-source search** | One search across OpenAlex, Crossref and arXiv (Semantic Scholar optional), duplicates merged | Parallel API calls, dedupe by DOI and by fuzzy title | Ar | P0 | K |
| F04 | **Verifier (no AI)** | Every candidate gets a badge: Verified / Mismatch / Not found / Retracted, with a field-by-field table | Deterministic code: DOI resolves at Crossref; title, authors and year cross-matched against OpenAlex; retraction lookup | Gr, Ar | P0 | K |
| F05 | **Checkpoint 2: approve sources** | Accept or reject each source with a reason ("too old", "off-topic"). Only accepted sources go further | Library write happens only on click; decision logged | W, Gr | P0 | K |
| F06 | **Reader: evidence cards** | For each approved source, a card with key finding, method and sample, each backed by an **exact quote** from the abstract or open full text | LLM extracts quote spans; code confirms each quote exists in the text; otherwise "Not stated in available text" | Gr | P1 | K |
| F07 | **Scribe: evidence brief** | A short answer where **every sentence** carries a trust label and source chips | LLM may only cite IDs from the approved set (whitelist). Unknown IDs are rejected automatically and logged | W, Gr | P0 | K |
| F08 | **Skeptic: challenge + counter-evidence** | Under each claim: "Does the source really say this?", "Overgeneralised?", plus an **opposing-view card** when contradicting papers exist | Separate LLM, different model, no shared state with Scribe; runs a targeted counter-search; named rejection criteria | Gr, Et | P0 basic / P1 counter-search | K |
| F09 | **Checkpoint 3: approve claims** | Student keeps, edits or drops each claim. Nothing exports without approval | Approval state per claim; export disabled until reviewed | W, Gv | P0 | K |
| F10 | **Debate mode** | On a contested claim, an Advocate and the Skeptic argue in two rounds using only verified sources; **the student is the judge** | Two LLM roles, capped at 2 rounds; verdict logged (based on DebateCV-style research) | Et, W | P2 | K |
| F11 | **Citation snowballing** | "Find papers this one cites / papers that cite this one." Results still go through the Verifier | OpenAlex `referenced_works` and `cited_by` filter. A real systematic-review technique | W | P1 | K |
| F12 | **Evidence matrix** | Lit-review table: rows = papers, columns = method, sample, setting, finding, limitation. Every cell links to its quote. Export CSV | Built from F06 cards | W | P2 | A |
| F13 | **Honest "Not found" + search receipts** | "No reliable source found for this sub-question. Here's exactly what we searched, where and when." | Not-found is a first-class result type, never filled by the LLM | Gr, Et | P0 | K |
| F14 | **Research gap finder** | "Thin evidence here. A possible gap for your thesis." Always labelled **AI reasoning** | LLM over the Not-found and thin-coverage list | W | P2 | A |

## B. Checking other people's (and other AIs') output

| ID | Feature | What it does | How | Rubric | Tier | Owner |
|---|---|---|---|---|---|---|
| F15 | **Reference X-ray** ⭐ demo opener | Paste any bibliography (APA, MLA, messy, from ChatGPT). Each line gets a verdict: **Verified · Chimera (real parts, wrong combination) · Mismatch · Not found · Retracted**. A chimera "explodes" into its parts, showing which real paper the title came from and which the authors came from | Crossref `query.bibliographic` → best match → field-level comparison → OpenAlex cross-check. **Zero AI needed** | Gr, Et | P0 | K (Z owns the test set) |
| F16 | **Draft Checker** | Paste a paragraph with in-text citations, e.g. "(Smith, 2021)". Each claim is matched to its reference and checked against the source text. Unsupported claims are highlighted; APA in-text format checked | Regex for APA in-text → library lookup → support check (LLM + quote match) | Gr, Et | P1 | K |
| F17 | **Chat Transcript Auditor** | Paste a whole ChatGPT/Gemini chat; every reference and factual claim is extracted and X-rayed | Reuses F15 + F16 | Gr | P2 | Z |
| F18 | **Quote checker** | Any quoted sentence must be found in the source text, else "Quote not found in source" | Normalised exact plus fuzzy match (≥ 0.92) on abstract or open full text | Gr | P0 | K |
| F19 | **Retraction and correction alerts** | Red banner on retracted papers, amber on corrections and expressions of concern | Crossref `update-to` (Retraction Watch data) + OpenAlex `is_retracted` | Gr, Et | P0 | K |
| F20 | **Web sources + archiving** | Cite a web page: we check it loads, find or offer a Wayback snapshot so the link can't rot, and add the APA retrieval date | URL HEAD/GET check + Wayback availability API + "Archive now" link | W, Gr | P1 | Z |

## C. The reference manager (library)

| ID | Feature | What it does | How | Rubric | Tier | Owner |
|---|---|---|---|---|---|---|
| F21 | **Library** | Collections (folders), tags, notes, search, filter by trust label and status | Local-first: stored in the browser (IndexedDB). No account | W, Et | P0 | A |
| F22 | **Source-quality facts** | Facts, not scores: peer-reviewed or preprint · in DOAJ · citation count · open access · retraction status · venue | OpenAlex + Crossref + DOAJ fields | Et | P1 | Z |
| F23 | **Bias and diversity lens** | Charts of your sources by country, year, open access and publisher, with plain warnings ("85 % of sources from one country", "nothing after 2015") | OpenAlex `authorships.institutions.country_code`, years, `is_oa` | Et | P1 | Z |
| F24 | **Watchdog** | On opening the library: "1 source was retracted since you saved it", "a preprint you cite is now published" | Re-runs F19 on saved DOIs (cheap DOI lookups) | Gr | P2 | K |
| F25 | **Import + PDF drop** | Import a Zotero/Mendeley BibTeX/RIS file (everything gets verified on the way in). Drop a PDF: we read its DOI and reference list **in your browser** and X-ray them | citation-js parsers; pdf.js text extraction client-side | W | P2 | A |
| F26 | **3D Evidence Galaxy** ⭐ wow | Your library as an interactive 3D graph: papers are nodes, citation links are threads, colour and shape show the trust label. Click a node to open the paper. Has a list-view twin for accessibility | react-force-graph-3d / R3F; edges from OpenAlex `referenced_works` | W (wow) | P1 | A |
| F27 | **Export** | APA 7 (default, SP Jain's style) · MLA 9 · Harvard · IEEE · Chicago · BibTeX · RIS · CSL-JSON | citation-js with the **official CSL style files** (the same engine family Zotero uses) | Gv | P0 (APA, BibTeX, RIS) / P1 (others) | A |
| F28 | **How others cite it** | "Later papers mention this one as supporting / contrasting / method" | Semantic Scholar citation contexts and intents | Et | P2 | Z |

## D. The student stays in charge (anti over-reliance)

| ID | Feature | What it does | How | Rubric | Tier | Owner |
|---|---|---|---|---|---|---|
| F29 | **AI autonomy dial** | **Off** (pure reference manager + verifier) · **Assist** (AI finds and checks, student writes) · **Co-pilot** (AI also drafts a labelled brief). The setting is written into the disclosure | Feature flags per mode | Et, Gv | P1 | Z |
| F30 | **Read-before-you-cite** | Sources you never opened are marked "unread" and flagged at export ("3 sources cited without opening the abstract") | Track abstract or source opens | Et | P1 | Z |
| F31 | **Explain-it-back** | Before export, the student writes one line per key source in their own words; the AI is not allowed to fill it in | Required text field; the AI button is disabled there by design | Et | P1 | Z |
| F32 | **Socratic Coach** | Instead of answers: "What would count as strong evidence for this?", "Which source disagrees?" | Coach LLM with a question-only output schema | Et | P2 | A |
| F33 | **Paraphrase guard** | Flags notes or draft text that copy a source too closely ("78 % word overlap: quote it with marks, or rewrite") | n-gram overlap against the source text (deterministic) | Et | P2 | Z |

## E. Governance and transparency

| ID | Feature | What it does | How | Rubric | Tier | Owner |
|---|---|---|---|---|---|---|
| F34 | **Auto AI-use statement** | One click produces an APA-style disclosure: tools, models, dates, what the AI did, what the student decided, plus an APA reference for the tool | Generated from the Receipts log, never typed by the AI from memory | Gv | P0 | Z |
| F35 | **Prompt Ledger** | Every prompt sent to an AI model (redacted), exportable. Directly satisfies SP Jain §h(viii) and hackathon rule 8 | Logged in the orchestrator | Gv | P0 | Z |
| F36 | **Receipts (audit trail)** | Timeline of every agent step, API call and student decision. Download as JSON. *Replay* steps through a session | Append-only log in state | Gv, Ar | P0 log / P2 replay | K |
| F37 | **Verification Certificate** | Shareable page + QR. A professor scans it and **Veracite re-verifies the bibliography live**. Tamper-evident SHA-256 hash | The certificate data is compressed into the URL itself, so no server database holds student data | Gv, Gr | P1 | Z |
| F38 | **Trust Center page** | Model card, the agent roster, what data goes where, policies followed, **measured results on our test set**, known limitations, "report a wrong verdict" | Static page + eval numbers from Z's test runs | Gv | P0 | Z |
| F39 | **Rules mode + provider fallback** | If Groq is slow or out of quota: switch model, then fall back to **Rules mode** (no AI, still verifies), clearly labelled | Provider chain in the LLM client | Ar, Gr | P0 | K |
| F40 | **Injection shield** | Paper text or web pages saying "ignore previous instructions…" are treated as data, flagged and counted | Untrusted-content wrapping + regex/heuristic detector | Gr | P1 | K |
| F41 | **PII scrubber** | Emails, phone numbers and student IDs are removed before any text reaches an AI model | Regex redaction (deterministic) | Et, Gv | P1 | Z |
| F42 | **Budget meter** | "AI calls used today: 14 / 1,000 · tokens: 31K" with hard caps per session | Counters in state; caps stop runaway loops | Gr | P2 | K |
| F43 | **SAMPLE watermark** | Any demo or test data shows a visible SAMPLE ribbon (hackathon rule 9) | Data flag → UI ribbon | Gv | P0 | A |

## F. Experience

| ID | Feature | Tier | Owner |
|---|---|---|---|
| F44 | **3D hero + light/dark toggle** (see `04_UI_3D_DIRECTIONS.md`; in the recommended direction the toggle is a *UV lamp* that reveals hidden security marks) | P0 | A |
| F45 | **Arabic / English (RTL)** interface, with logical CSS so layouts mirror correctly | P2 | A |
| F46 | **⌘K command palette** (search library, start an X-ray, export, switch theme) | P2 | A |
| F47 | **Accessibility**: keyboard navigation, visible focus, reduced motion turns 3D off, every 3D view has a list twin, labels use icon + text + colour (never colour alone) | P0 | A |
| F48 | **Guided demo** with clearly labelled SAMPLE content and a 60-second tour | P1 | A |
| F49 | **Public Verify API** (`/api/v1/verify?doi=…`): any other AI app can call Veracite's verifier. The first step toward an MCP server | P2 | K |

## G. Roadmap (say it, don't build it)

- **R1 · MCP server.** Claude, ChatGPT or Copilot can call "verify this reference" *before* answering. Honesty as a service for other AIs.
- **R2 · Browser extension.** X-ray references in place on ChatGPT, Google Docs and Overleaf.
- **R3 · LMS integration** (Moodle/Canvas) + a faculty dashboard of certificates.
- **R4 · Word / Google Docs add-in** for in-document citing with labels.
- **R5 · Institutional proxy** for paywalled full text (quote checks beyond abstracts).
- **R6 · Group projects** with a per-member contribution log. *Also a likely Phase-2 ask, see `09_PHASE2_PLAYBOOK.md`.*

---

## What Veracite will NOT do, on purpose (a strong ethics talking point)

| We refuse to… | Because… |
|---|---|
| "Detect AI writing" in essays | Detectors flagged 61 % of non-native English essays as AI (Stanford). False accusations harm international students. **We verify sources, we don't accuse people.** |
| Offer a "write my essay" button | The student is the author (SP Jain §h(v), COPE/ICMJE). The Scribe writes an *evidence brief*, labelled, never a submission |
| Show confidence percentages | A number from a model looks precise but isn't. We show **labels with reasons** instead |
| Store student data on a server | Privacy (UAE PDPL). The library lives on the student's device; certificates live inside their URL |
| Scrape Google Scholar or use shadow libraries | Terms of service and copyright. We use open, licensed registries only |
| Let the AI cite anything it didn't retrieve | It's the root cause of fabricated references. It's blocked structurally |

## Build order (what Claude Code builds, in sequence)

1. Design system + theme toggle + 3D hero (F44, F47), so every later screen looks finished.
2. Registry clients + Verifier + Reference X-ray (F03, F04, F15, F18, F19). This is the core and needs no AI.
3. Library + APA/BibTeX/RIS export + SAMPLE ribbon (F21, F27, F43).
4. LLM client with Groq + fallback + Rules mode (F39), then Planner → Scribe → Skeptic with the 3 checkpoints (F01, F02, F05, F07, F08, F09, F13).
5. Receipts, Prompt Ledger, AI-use statement, Trust Center (F34–F36, F38).
6. P1 wave: Reader, Draft Checker, Certificate, Galaxy, Quality facts, Bias lens, Autonomy dial, Read-before-cite, Explain-it-back, Web + Wayback, Snowballing, Injection shield, PII scrubber.
7. P2 wave: anything left, in the order Z and A choose on Wednesday evening.
