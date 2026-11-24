# 05 · Ethics, governance and guardrails

*These three criteria are worth **16 of the 30 deck points** (Ethics 5 · Governance 5 · Guardrails 6). This file is the source for deck slides 4, 5 and 6 and for the Trust Center page. Owner: **Zedan**.*

---

## Part A · Ethical considerations: risk → how the design handles it (Deck slide 4)

| Risk (named in the brief) | What could go wrong | Veracite's design response | Feature IDs |
|---|---|---|---|
| **Invented citations** | AI writes a plausible reference that doesn't exist, or a "chimera" of real parts (SP Jain §h(ix)) | The AI **cannot output a reference**. It can only point to records we fetched. Every source is cross-checked in 2 registries; chimeras are exploded into their real parts | F04, F07, F15 |
| **Invented quotes / claims** | A quote that isn't in the paper; a guess stated as fact | Quotes must string-match the source text. Every sentence gets a label; guesses are labelled **AI reasoning**; unsupported claims are labelled **Not found** | F06, F18, F13 |
| **Plagiarism** | Student pastes AI summaries or copies the source too closely | Paraphrase guard flags close copying; the Scribe writes a labelled *evidence brief*, never an essay; explain-it-back makes the student write their own line | F33, F31 |
| **Privacy** | Student data, drafts or identity sent to AI providers or stored on servers | No accounts; the library stays on the device; PII scrubbed before any AI call; Groq does not train on API data; certificates carry their data inside the link, not in our database | F21, F41, F37 |
| **Biased sources** | All-Western, all-old, all-one-publisher evidence; paywalls exclude Global South research | Bias & diversity lens (country, year, open access, publisher) with plain warnings; open-access filter; quality *facts* not opaque scores, so small journals aren't silently down-ranked | F22, F23 |
| **Over-reliance on AI** | The student stops thinking (MIT 2025: LLM-only writers had the weakest engagement and couldn't quote their own work) | Autonomy dial (AI can be fully off); 3 approval checkpoints; read-before-you-cite; explain-it-back; Socratic Coach; Debate mode where the student judges | F29–F32, F10 |
| **False accusation** | "AI detectors" flag honest students; 61 % of non-native English essays were flagged (Stanford) | We **verify sources, we don't accuse people**. No AI-writing detection, on purpose | Policy |
| **Manipulated sources** | A web page or abstract contains hidden instructions ("ignore previous instructions") | All source text is wrapped as untrusted data; injection attempts are flagged and counted | F40 |
| **Retracted / unreliable science** | Citing retracted papers or treating a preprint as settled | Retraction and correction alerts (Retraction Watch via Crossref); preprint badge; Watchdog re-checks saved sources | F19, F24 |
| **Accessibility and equity** | Fancy 3D excludes screen-reader or low-end-device users; paid tools exclude students | Every 3D view has a list twin; reduced-motion mode; free to use; Arabic/English interface | F47, F45 |

**Slide-4 headline:** *"We designed out the five risks instead of warning about them."*

---

## Part B · Governance: who is accountable, how AI use is disclosed, which rules we follow (Deck slide 5)

### B1. Accountability (RACI)

| Decision / output | Student | Veracite (AI + code) | Faculty | Team 7 (maintainers) |
|---|---|---|---|---|
| What gets cited and claimed | **Accountable + Responsible** | Consulted (suggests, checks) | Informed (via certificate) | — |
| Whether a reference is real | Informed | **Responsible** (deterministic Verifier) | Can re-verify (QR) | **Accountable** for verifier correctness |
| AI-use disclosure | **Accountable** (signs it) | Responsible (drafts it from logs) | Informed | — |
| Model/provider choice, prompts, policies | Informed (Trust Center) | — | — | **Accountable** |
| Errors in verification | Reports via "Report a wrong verdict" | Logged | — | Fix and publish in changelog |

**One-liner:** *The student is the author and owns every decision; Veracite owns the truth of its checks; faculty can audit both.* AI is never an author (COPE/ICMJE).

### B2. How AI use is disclosed (three layers)

1. **In the product, always:** every AI-written sentence carries a label; the AI-generated brief has an "AI-drafted" watermark until the student edits and approves it (EU AI Act Art. 50 spirit: tell people when content is AI-generated).
2. **On export:** an auto-generated **AI-use statement** built from the session log, never typed from memory. It names the tools, models and dates, what the AI did, what the student decided, the autonomy level, and the count of sources opened. It follows APA Style's generative-AI guidance (updated Sept 2025) and SP Jain §h(viii). Example:
   > *"I used Veracite (Team 7, 2026) in Assist mode on 25 Nov 2026 to plan searches and check references. Its AI agents (Groq-hosted open models: gpt-oss-120b, Llama 3.3 70B, Qwen) proposed search terms and drafted a labelled evidence summary. All 12 references were verified against Crossref and OpenAlex; I reviewed and approved every source and claim, opened all 12 sources, and wrote the final text myself. The full prompt ledger is attached."*
3. **For faculty:** the **Verification Certificate** (QR + hash) re-runs the checks live, plus the **Prompt Ledger** (every prompt sent to AI, redacted). This makes SP Jain §g(vi), faculty verifying references, a 30-second job.

### B3. Rules and policies the website follows

| Rule / policy | What it requires | How Veracite complies |
|---|---|---|
| **SP Jain Academic Integrity Policy v2 (24 Feb 2026)** §h(vi) | APA referencing | APA 7 is the default export |
| §h(viii) | Identify AI models, tools and prompts | Prompt Ledger + AI-use statement |
| §h(ix) | Beware fabricated references built from real components | Chimera detection in X-ray |
| §g(vi) | Faculty verify references | Verification Certificate |
| **APA Style GenAI guidance (Sept 2025)** | Disclose and cite AI use | Auto statement + APA reference for Veracite |
| **UNESCO GenAI guidance (2023)** | Human agency; institutions validate tools | Checkpoints, autonomy dial, published test results |
| **UAE AI Charter (2024)** | Human oversight, transparency, algorithmic-bias mitigation, data privacy, accountability | Checkpoints, labels, bias lens, local-first data, RACI |
| **UAE PDPL (FDL 45/2021)** | Lawful, minimal personal-data processing | No accounts, no server storage, PII scrubbing |
| **EU AI Act Art. 50 (applicable Aug 2026)** | Transparency that content is AI-generated | Every AI sentence labelled; AI-drafted watermark |
| **COPE / ICMJE** | AI can't be an author | Student is author of record; Scribe writes briefs, not essays |
| **Crossref / OpenAlex / Wayback terms** | Polite use, attribution | Polite pool, caching, rate limits, source credits on the Trust Center |
| **Hackathon rules 8, 9, 10** | Prompt record; label samples; no personal data | Prompt Ledger; SAMPLE ribbon; test data contains no personal data |

### B4. Governance operations (show on the Trust Center)
- **Model card:** which models, which agent, what they may and may not do, known limitations.
- **Published test results** with date and test-set size (see `03_…` §10). Never claim more than we measured.
- **Incident path:** "Report a wrong verdict" button → logged → fixed → changelog entry.
- **Change control:** prompts and thresholds are versioned in the repo; any change re-runs the golden test set.
- **Data retention:** nothing stored server-side; registry responses cached for 24 h without user identifiers.

---

## Part C · Guardrails: the specific mechanisms that keep it honest (Deck slide 6)

Grouped from strongest (can't happen) to softest (nudges). **The strongest guardrails are structural: they don't depend on the AI behaving.**

### 🔒 Structural: impossible by design
| # | Guardrail | Mechanism |
|---|---|---|
| G1 | **Retrieval-only citations** | The LLM's output schema only allows source IDs; any ID not in the retrieved and approved set is rejected by code and logged as a *blocked fabrication* |
| G2 | **The verifier can't be talked into anything** | The Verifier is pure code with no prompt, so it can't be prompt-injected or persuaded |
| G3 | **No AI numbers** | Models never output scores or confidence; labels are computed by rules |
| G4 | **No export without approval** | Export is disabled until every claim is kept, edited or dropped |

### 🔍 Deterministic checks: verified by code
| # | Guardrail | Mechanism |
|---|---|---|
| G5 | **Two-registry cross-match** | DOI + title (≥ 0.90) + first author + year (±1) must agree in Crossref **and** OpenAlex/arXiv |
| G6 | **Chimera detector** | Finds when the title, authors and year belong to *different* real papers |
| G7 | **Quote match** | Quotes must appear in the abstract or open full text (normalised, fuzzy ≥ 0.92) |
| G8 | **Retraction and correction check** | Crossref `update-to` (incl. Retraction Watch) + OpenAlex `is_retracted`, on save and again on library open |
| G9 | **Honest Not-found** | "Not found" is a real result type with search receipts; the AI is never asked to fill a gap |

### ⚖️ Adversarial review: AI checking AI
| # | Guardrail | Mechanism |
|---|---|---|
| G10 | **Independent Skeptic** | A different model family, no shared memory with the Scribe, 8 named rejection criteria, max 2 rounds, rejections shown not hidden |
| G11 | **Counter-evidence search** | The Skeptic searches for contradicting papers; opposing-view cards are shown |

### ✋ Human gates: the student decides
| # | Guardrail | Mechanism |
|---|---|---|
| G12 | **Three checkpoints** | Approve plan → approve sources → approve claims |
| G13 | **Autonomy dial + read-before-cite + explain-it-back** | Students choose how much AI does, and must engage before exporting |

### 🛡️ Safety and transparency
| # | Guardrail | Mechanism |
|---|---|---|
| G14 | **Injection shield + PII scrubber** | Source text wrapped as untrusted; instructions flagged; personal data removed before AI calls |
| G15 | **Receipts + Prompt Ledger** | Every step, call, prompt and decision logged with time; downloadable; replayable |
| G16 | **Fail honest, not silent** | Provider fallback → Rules mode with a visible banner; budget caps stop runaway loops |
| G17 | **SAMPLE ribbon** | Any demo or test content is visibly labelled (rule 9) |

**Slide-6 proof line (fill after testing on Wednesday):**
> *"Tested on N references (N real, N fabricated, N chimeras, N retracted): X/X fabricated caught · **0 fakes marked Verified** · Y % of real references verified."*

⚠️ Only put numbers on the slide that Zedan actually measured. If testing isn't finished, write "Test set: 70 references (results on our Trust Center)" instead. Never estimate.
