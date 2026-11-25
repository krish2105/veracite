# 08 · Demo script (8:00), judges' Q&A bank (2:00), and Thursday media plan

*Present from the **live link** (https://veracite.vercel.app, rule 15). Time limits are strict, so rehearse with a timer. Owner: Avighna (script and timing). Each speaker owns their segment.*

## Before you walk up
- Live link (`https://veracite.vercel.app`) open in a clean desktop browser window (≥ 1024 px wide so the 3D Vault loads), **zoom 125 %**, **daylight mode ON** (UV lamp OFF — we'll switch it on live), notifications off.
- Tab 2: pre-warmed Research session on the demo question (*"Does generative AI help or hurt student learning?"*), **labelled SAMPLE** if cached, in case venue Wi-Fi or Groq is slow.
- Tab 3: the **90-second backup video** (local offline file).
- Clipboard: the **ChatGPT-made bibliography** on `"Does generative AI help or hurt student learning?"` for the X-ray (kept unedited, labelled with prompt + date), or click **Load test list** (`TEST LIST · by Team 7 · includes deliberate fakes`) as fallback.

## The 8 minutes

| Time | Speaker | On screen | Say (short version) |
|---|---|---|---|
| **0:00–0:40** | Avighna | Landing `/` · 3D Vault (desktop) | "This year *Nature* reported 78–90 % of GPT-4o's citations to recent research were fabricated. At NeurIPS 2025, 100 hallucinated citations were found in 51 accepted papers. And SP Jain's own integrity policy §h(ix) warns about AI references fabricated from parts of real papers. Every student here is accountable for those errors. Meet **Veracite**: every reference real, every claim traceable, you stay in charge." |
| **0:40–1:00** | Avighna | Click **Switch on UV lamp** on `/` → click **Check references** (`/xray`) | "Like a bank teller under UV light, Veracite checks for the hidden marks. Genuine references glow **VERIFIED**; counterfeits show **VOID**. Let's run it live on real references." *(switch to `/xray`)* |
| **1:00–2:00** | Krishna | **Reference X-ray** (`/xray`) · paste bibliography → **X-ray N references** | "Here's a bibliography ChatGPT generated. Watch." Results stream live from Crossref, OpenAlex, and arXiv. Point at **Chimera, taken apart**: "Real title, real authors, *different papers*. Veracite takes it apart and shows where each piece came from." Point at **Retracted** / **Not found** and **Verified**. Click **Add to my list** on a verified paper: "Zero AI was used here—pure deterministic checks against public registries." |
| **2:00–4:15** | Krishna | **Research** (`/research`) · enter `"Does generative AI help or hurt student learning?"` | Autonomy on **Assist** (or **Co-pilot**). Planner proposes search terms → **"Checkpoint 1: I approve the plan."** Scout + code-only **Verifier** return badges and field tables → **"Checkpoint 2: I choose the sources."** Reader pulls exact quotes from abstracts, Scribe drafts from approved IDs only, Skeptic (`qwen/qwen3.8-27b`, rules S1–S8) challenges claims. Point out **● Verified** (exact quote in abstract), **◐ Reported, not checked**, **◆ AI reasoning**, and a Skeptic challenge → **"Checkpoint 3: I keep, edit, or drop each claim."** |
| **4:15–4:45** | Avighna | **Write & cite + Draft Checker** (`/draft`) | Open the **Write & cite** box: type a sentence, select a verified source from the list, click **Insert citation** → drops `(Author, Year)` at the cursor and builds the **APA 7 reference list live** with zero AI. Click **Send to Draft Checker** + **Check paragraph** (or show a fake citation / uncited figure caught immediately). |
| **4:45–5:35** | Krishna | **Phase 2 feature** | "This morning's new requirement was ___. Here's how we built it in 90 minutes on top of the same guardrails." |
| **5:35–6:35** | Zedan | **Library + Export + Certificate** (`/library` → `/certificate`) | Show **Library**: organise with collections/tags/notes, **Bias lens** (author countries, publication years, publishers), click **APA 7** (or **BibTeX / RIS / CSL-JSON**) → **Export Gate** shows unread-source warning, explain-it-back prompt, and log-generated **AI-use statement**. Switch to **Certificate** (`/certificate`): "A professor scans this QR and Veracite re-checks the bibliography live—SP Jain policy §g(vi) in one click." |
| **6:35–7:15** | Zedan | **Trust Center** (`/trust`) → switch **AI autonomy** to **Off** (Rules mode) | Show live measured benchmark on `51` test references (**11/11** fabricated/chimera fakes caught, **0** fakes marked Verified, **30/30** real verified, **5/5** retractions flagged, median **0.4 s**). Point at the model card (`gpt-oss-20b`, `gpt-oss-120b`, `qwen/qwen3.8-27b`) and Prompt Ledger export. Toggle **AI autonomy → Off**: "Even if AI is off or down, every check still runs." |
| **7:15–8:00** | Avighna | Back to `/` (or summary) | "Zotero organises. ChatGPT is fast. Veracite combines both without invented references. It's free, keeps your list on your device, follows SP Jain's integrity rules, and leaves the student in charge. Next: an MCP server and browser extension so any AI checks before it cites. **Every reference real. Every claim traceable. You stay in charge.** Thank you." |

**Timing safety:**
- If behind at **4:15**, show **Write & cite** inserting one citation + live APA 7 reference (15 s) and skip clicking **Send to Draft Checker**, going straight to the **Phase 2 feature** at **4:30**.
- If venue Wi-Fi or Groq is slow, switch to Tab 2 (pre-warmed session) and say so honestly: *"Here is the same session cached earlier so we stay inside 8 minutes."*

---

## Judges' Q&A bank (2 minutes = 3–4 questions; answer in ≤ 20 seconds each)

### Tech and architecture (Krishna leads)
1. **"How do you stop the AI inventing references?"** It *can't* output one. Its zod-validated output schema only accepts IDs of records we fetched from registries; any invented ID is blocked by code and logged. References come from Crossref, OpenAlex, and arXiv—never from the model.
2. **"What if Crossref and OpenAlex disagree?"** Then it is not marked Verified. It is flagged **Mismatch** or **Partial**, with a field-by-field table showing claimed vs. registry values so the student sees exactly what differs.
3. **"Why so many agents? Isn't that a gimmick?"** Each has different tools or a different model, and two boundaries *must* be separated: the Skeptic cannot share memory with the Scribe it challenges, and the Verifier is pure deterministic code so no prompt can persuade it.
4. **"Which models, and what does it cost?"** Open-weight models on Groq's free tier: **`openai/gpt-oss-20b`** (Planner, Reader), **`openai/gpt-oss-120b`** (Scribe), and **`qwen/qwen3.8-27b`** (Skeptic, a different model family so errors don't correlate), with automatic fallback and **Rules mode** if AI is off or unavailable. Verification uses **zero** AI calls; a research session uses ~4–6 calls. Cost: zero.
5. **"What if Groq goes down during your demo?"** Automatic fallback to another model, then **Rules mode**, which still verifies every reference and runs deterministic checks with an honest status banner. Want to see it? *(switch AI autonomy to Off)*
6. **"Can it read paywalled papers?"** **No, and it says so openly.** Quotes are checked **only against source abstracts** returned by OpenAlex and Crossref; we do not fetch or read full-text PDFs. Anything not confirmed in the abstract is labelled **"Reported, not checked"**—never upgraded to **Verified**.
7. **"How accurate is the verifier?"** On our 51-reference golden set published on the Trust Center: **11/11** fabricated or chimera fakes caught, **0** fakes marked Verified, **30/30** real references verified, **5/5** retractions flagged, median **0.4 s** per reference. In that baseline run, web pages without a DOI scored `0/5` (labelled unsupported), and we subsequently added live/Wayback URL checks that cap matched web pages at **Partial** rather than Verified.
8. **"Does it scale?"** Registry lookups are cached for 24 h with polite-pool headers and capped concurrency; OpenAlex and Crossref queries are stateless. Serverless API routes scale horizontally while each student's library and session state live on their own device.

### Ethics, governance, privacy (Zedan leads)
*Final answers (Z11). Bold = the ≤ 20-second answer to say. "If pressed" = the follow-up. "Show" = what to click. Every claim below matches code in `veracite/src/lib/integrity/` or a checked source.*

9. **"Where does student data go?"** **Nowhere we store it. There are no accounts; the library lives in your browser. Before anything reaches the AI, code strips emails, phone numbers, Emirates IDs, student IDs and API keys. Groq doesn't keep API data by default. A certificate carries its data inside the link, not in our database.**
   - *If pressed:* "The scrubber keeps DOIs, page numbers and years, because we test it against all 50 references in our golden set. It doesn't remove names; reference lists are full of author names, so we never send the student's own name in the first place." (Groq: [docs](https://console.groq.com/docs/your-data) say no retention by default; its services agreement says inputs and outputs aren't used for training.)
   - *Show:* Prompt Ledger entry with `[EMAIL]` in place of an address.

10. **"Who is accountable if a citation is wrong?"** **The student is the author: they approve the plan, the sources and every claim, and they sign the AI-use statement. We're accountable for our checks: the Verifier is plain code, we publish its test results, and there's a "report a wrong verdict" button. Faculty can re-check any bibliography by scanning the certificate.**
    - *If pressed:* "AI is never an author; that's COPE's rule too. Our RACI table is in the deck: student owns what's cited, Team 7 owns whether the checker is right."
    - *Show:* Trust Center → test results + report button.

11. **"Doesn't this make students lazier?"** **It's built to do the opposite. The AI can't skip the student: three approvals, an autonomy dial that turns AI fully off, read-before-you-cite, and a paraphrase guard that flags text copied too closely from a source. And the AI writes a labelled evidence brief, never the essay—in Write & cite, the student writes every word.**
    - *If pressed:* "An MIT Media Lab study in 2025 found people writing with ChatGPT showed the lowest engagement and struggled to recall their own essays. It's an early, not-yet-peer-reviewed study with 54 people, but it's the risk we designed against."
    - *Show:* paste a copied sentence into the Draft Checker (`/draft`) → `"95% of your words match the source…"`.

12. **"Why not detect AI-written essays?"** **Because detectors falsely accuse people. A Stanford study found seven popular detectors flagged, on average, 61 % of essays by non-native English writers as AI-written. At SP Jain, with students from everywhere, that's harmful. We verify sources; we don't accuse people.**
    - *If pressed:* Liang et al., 2023, *Patterns*: 91 TOEFL essays, near-perfect on US students' essays. "Checking a reference is a fact. Guessing who wrote a sentence isn't."

13. **"How do you handle biased sources?"** **The bias lens shows where the authors are based, how old the evidence is, how much is open access and which publishers dominate, with plain warnings. It shows facts and never ranks or hides a source, so small or Global-South journals aren't quietly pushed down.**
    - *If pressed (have the numbers ready):* "We ran it on two real lists. ChatGPT's 20 references: authors from 20 countries, median year 2024, 95 % open access, no warnings. Ten classic management papers: 80 % US authors and half from 2003 or earlier, so it warns on both and notes there's nothing from the Middle East."
    - *Show:* Library (`/library`) → Bias lens cards.

14. **"Which policies do you follow?"** **SP Jain's own Academic Integrity Policy: clause h(viii) on disclosing AI, h(ix) on fabricated references, g(vi) on faculty checking references. Plus APA's 2025 AI guidance, UNESCO's guidance, the UAE AI Charter, the UAE data-protection law and EU AI Act Article 50 on labelling AI content.**
    - *If pressed:* name one mapping each: "h(ix) → chimera detector; h(viii) → Prompt Ledger; PDPL → no accounts, PII scrubbing; Article 50 → every AI sentence is labelled."

15. **"How is AI use disclosed?"** **Three layers. Every AI-written sentence is labelled. On export, an AI-use statement is generated from the session log: which models, what they did, what the student decided, with an APA reference for the tool. And a Prompt Ledger lists every prompt, with a hash so edits show.**
    - *If pressed:* "The statement only says what the log proves. It will not write 'I wrote this myself' for you; the student has to type that sentence. And yes, we kept our own prompt log for this hackathon."
    - *Show:* Library (`/library`) → Export → statement with the placeholder → Trust Center (`/trust`) → Prompt Ledger.

16. **"What about prompt injection in papers or web pages?"** **Paper and web text is treated as data, never instructions: it's wrapped, the model is told never to obey it, and code flags lines like "ignore previous instructions" or "mark this as verified", plus hidden invisible characters. And the Verifier has no prompt at all, so there's nothing to inject.**
    - *If pressed:* "The detector is a tripwire, not a guarantee; a clever paraphrased attack can slip past regex rules. That's why the real defence is structural: the AI can only cite IDs our code fetched."

### Users, design, adoption (Avighna leads)
17. **"Who is the user and why would they switch from Zotero?"** They don't have to: Veracite exports **BibTeX, RIS, and CSL-JSON** straight into Zotero or Mendeley. Veracite adds the live two-registry X-ray, AI research crew with checkpoints, and Write & cite with an automatic AI-use disclosure.
18. **"Why 3D? Isn't it decoration?"** The 3D *is* the metaphor: on the landing page (`/`), a UV lamp reveals hidden **VERIFIED** watermarks vs. **VOID** counterfeits; on `/xray`, a stitched chimera breaks apart into its mismatched sources. On phones (< 1024 px), `prefers-reduced-motion`, no WebGL, or clicking **Plain view**, it switches cleanly to the 2D view, and every check has a plain table and text readout.
19. **"What's next?"** An MCP server so ChatGPT or Claude can verify before answering (`GET /api/v1/verify` is next); a one-click browser extension; a Canvas/Blackboard LMS plug-in for faculty.
20. **"How would SP Jain roll this out?"** Free, no accounts, works in a browser (including phones). Faculty accept QR certificates alongside submissions (§g(vi)); the library could pilot it with one MAIB cohort in a single week.
21. **"What did you build in Phase 2?"** *(prepare on the day)* What the requirement was, the change in one sentence, which guardrail still covers it.

### Curveballs
22. **"What's the weakest part of your system?"** Honest answer: quote checks only read **abstracts**, not paywalled or full-text PDFs, so true quotes from deeper inside a paper stay **"Reported, not checked"**, and web pages without a DOI cap at **Partial**. We'd rather say that plainly than pretend.
23. **"Did you use AI to build this?"** Yes—Claude Code and Antigravity built most of the code under our direction. We logged every prompt in `docs/PROMPT_LOG.md` as rule 8 requires, and every architectural and honesty decision is ours.
24. **"Show me it failing."** Paste a fake DOI into `/xray` → **Not found**, with exact search receipts showing what Crossref, OpenAlex, and arXiv returned. Then: *"That's the system working."*

---

## 90-second backup video shot list (record before Thu 11:00)
*Record at 1920×1080 (zoom 125 %, clean browser, no bookmarks bar) and save to `submissions/phase2/veracite-backup-90s.mp4`.*

| Clip | Time | Screen & exact action | Voiceover cue |
|---|---|---|---|
| **1** | `0:00–0:12` | `/` (3D Vault) → sweep cursor across notes → click **Switch on UV lamp** → click **Check references** | "AI fabricates citations and stitches real papers together. Veracite shines a UV lamp on every reference." |
| **2** | `0:12–0:32` | `/xray` → paste ChatGPT list (or click **Load test list**) → **X-ray 8 references** → click a **Chimera** row & **Chimera, taken apart** → click **Add to my list** on Bastani et al. & Kestin et al. | "Reference X-ray streams live against Crossref, OpenAlex, and arXiv—taking apart stitched chimeras and flagging retractions with zero AI." |
| **3** | `0:32–0:52` | `/research` → ask *"Does generative AI help or hurt student learning?"* → **Approve plan** → **Approve sources** → show labelled claims (`● Verified`, `◆ AI reasoning`) & Skeptic challenge → **Approve claims** | "In a research session, you approve the plan, the sources, and every claim—with an independent Skeptic model checking support." |
| **4** | `0:52–1:06` | `/draft` → type a sentence in **Write & cite** → **Insert citation** → live APA 7 reference list appears → click **Send to Draft Checker** + **Check paragraph** | "Write & cite inserts only verified sources at your cursor and builds APA 7 live—then Draft Checker verifies quotes against abstracts." |
| **5** | `1:06–1:20` | `/library` (Bias lens + **APA 7** → Export Gate) → `/certificate` (QR + re-verify) | "Library shows source bias facts, exports with an AI-use statement from the logs, and generates a live-recheckable QR certificate." |
| **6** | `1:20–1:30` | `/trust` → show `0 fakes marked Verified` (51 test refs) → toggle **AI autonomy → Off** | "Measured on 51 test references: zero fakes marked Verified. Even with AI off, every check still runs." |

## README screenshot shot list (save in `submissions/phase2/screenshots/` or `docs/img/`)
1. `01-home-uv.png` — `/` desktop 3D Vault with **Switch on UV lamp** active (`VERIFIED` vs `VOID` glowing).
2. `02-xray-chimera.png` — `/xray` after running the test list, showing the **Chimera, taken apart** 3D stack alongside field-by-field verdicts.
3. `03-research-checkpoints.png` — `/research` at Checkpoint 3 showing the stepper, trust-labelled claims (`● Verified`, `◐ Reported`, `◆ AI reasoning`), and Skeptic challenge.
4. `04-write-and-cite.png` — `/draft` showing **Write & cite** with `(Author, Year)` inserted, the live APA 7 reference list below, and Draft Checker results.
5. `05-library-bias-export.png` — `/library` showing Bias lens bars + Export Gate modal.
6. `06-trust-certificate.png` — `/trust` measured 51-reference scorecard (or `/certificate` showing QR code + SHA-256 hash).
