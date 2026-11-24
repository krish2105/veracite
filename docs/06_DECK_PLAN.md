# 06 · Phase 1 deck plan (6 slides, judged without us in the room)

**Deadline: Thu 26 Nov, 9:00 AM Dubai. Our internal deadline is Wed 25 Nov, 11:00 PM** (upload early; re-uploading replaces it).
**Judged on:** Workflow 8 · Architecture 6 · Ethics 5 · Governance 5 · Guardrails 6 = **30 points**. Slides after the 6th are not read.
**Owner:** Avighna (design and story) · Zedan (slides 4–6 content) · Krishna (slides 2–3 accuracy). Claude Code builds the .pptx.

## Principles (because nobody will be there to explain it)
1. **One slide per criterion**, titled so the judge sees which criterion it answers: slides 2–6 map 1:1 to the rubric, in rubric order.
2. **Slide titles are full-sentence takeaways**, not labels. A judge who reads only the titles should understand the whole idea.
3. **Diagrams over paragraphs.** ≤ 90 words of body text per slide, ≥ 14 pt everywhere.
4. **Same visual language as the website** (chosen UI direction), plus **2 real screenshots** of the working site, which signals "we already built it".
5. **Every number has a tiny source note** in the footer. No invented results (rule 9). If a test number isn't measured yet, don't print it.
6. **Upload as PDF exported from the .pptx** (both formats are accepted) so fonts and layout can't break on a judge's laptop. Keep the .pptx as backup.

---

## Slide 1 · Overview: "Veracite: the AI research assistant that can't make up a reference"
**Purpose:** problem → our answer → how to read the deck.
- **Left:** three hook stats (big numbers, small labels, sources in the footer):
  - **78–90 %**: share of citations GPT-4o fabricated when asked to cite recent literature (*Nature*, 2026)
  - **100+**: hallucinated citations found in papers *accepted* at NeurIPS 2025
  - **§h(ix)**: SP Jain's own integrity policy now warns about AI references "fabricated from components of actual references"
- **Right:** hero screenshot (X-ray catching a ChatGPT bibliography), labelled "Live prototype · sample input".
- **Bottom band, the promise:** *"The AI may plan, search and explain. Only public registries may cite. Only the student may decide."*
- **Footer:** Team 7 · Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane · live link · slides 2–6 = Workflow · Architecture · Ethics · Governance · Guardrails.

## Slide 2 · Workflow (8 pts): "The student approves three times; the AI is checked five times"
**Purpose:** how a student moves through the site, which agent does what and in what order, where the student is in control, where answers are checked.
- **Swimlane diagram** (3 lanes: Student · AI agents · Checks):
  `Ask (+ autonomy dial)` → 🧭 Planner → **✋ Approve plan** → 🔭 Scout → 🛡️ Verifier **(✔A registry cross-match, ✔B retraction check)** → **✋ Approve sources** → 📖 Reader **(✔C quote match)** → ✍️ Scribe **(✔D only approved IDs)** → ⚖️ Skeptic **(✔E challenge + counter-evidence)** → **✋ Approve claims** → 🧾 Integrity Clerk → Export (APA 7 + AI-use statement + certificate)
- **Small inset, "two side doors":** Reference X-ray (paste any bibliography) · Draft Checker (paste a paragraph).
- **Legend:** the four trust labels with their shapes (● ◐ ◆ ○).
- **Micro-copy:** "Nothing is searched before the plan is approved. Nothing is exported before every claim is reviewed."

## Slide 3 · Architecture (6 pts): "AI suggests, registries prove, your browser keeps your data"
**Purpose:** the parts of the system and how they connect (website, AI, sources, reference storage). Use exactly those four words as box titles; they're the judge's checklist.
- **Layered diagram, left to right:**
  1. **Website (browser):** Next.js app · workflow state machine · 3 checkpoints · Receipts log
  2. **Serverless tools (Vercel):** agent endpoints · verifier · formatter (CSL) · LLM gateway (schema check, PII scrub, injection shield, budget caps)
  3. **AI (Groq, free):** a different open model per agent → fallback model → **Rules mode (no AI)**
  4. **Sources:** Crossref (+ Retraction Watch) · OpenAlex · arXiv · Semantic Scholar · DOAJ · Unpaywall/Europe PMC · Wayback
  5. **Reference storage:** on-device IndexedDB → export BibTeX / RIS / CSL-JSON (opens in Zotero/Mendeley) · certificate data travels inside its link
- **Colour key:** *deterministic code* vs *AI model*. Make it visible that the Verifier is code, not AI.
- **Callout:** "0 AI calls are needed to verify a reference. AI is used ~6 times per research session."

## Slide 4 · Ethical considerations (5 pts): "We designed out the risks instead of warning about them"
**Two-column table, 6 rows** (from `05_…` Part A): invented citations · plagiarism · privacy · biased sources · over-reliance · false accusation (why we refuse AI-detection). Each row = *risk in 6 words → design response in 12 words → feature icon*.
- **Callout:** "We verify sources. We don't accuse people." (Stanford: detectors flagged 61 % of non-native English essays as AI.)

## Slide 5 · Governance (5 pts): "The student is accountable, and Veracite makes that easy to prove"
- **Top left, accountability strip:** Student = author, owns every decision · Veracite = owns the truth of its checks · Faculty = can re-verify via QR · Team 7 = maintains models, prompts, thresholds; publishes test results.
- **Top right:** the auto-generated **AI-use statement** sample (5 lines, labelled SAMPLE).
- **Bottom, "Rules we follow" chips:** SP Jain Academic Integrity Policy v2 §h(vi) §h(viii) §h(ix) §g(vi) · APA 7 + APA GenAI guidance (2025) · UNESCO GenAI guidance · UAE AI Charter · UAE PDPL · EU AI Act Art. 50 · COPE/ICMJE.

## Slide 6 · Guardrails (6 pts): "Some failures are impossible, not just unlikely"
- **Five stacked bands, strongest first** (from `05_…` Part C): 🔒 Structural (G1–G4) → 🔍 Deterministic (G5–G9) → ⚖️ Adversarial (G10–G11) → ✋ Human gates (G12–G13) → 🛡️ Safety and transparency (G14–G17). One line per guardrail.
- **Proof strip:** the measured test-set results (from Zedan's Wednesday run), **or** "Test set of 70 references, results on our live Trust Center" if not finished.
- **Closing line:** *"Every reference real. Every claim traceable. You stay in charge."*

---

## Production checklist
- [ ] UI direction chosen (`04_…`) → deck uses its palette and fonts
- [ ] 2 screenshots from the live site (X-ray result + Research workspace with labels)
- [ ] All stats double-checked against `01_RESEARCH_REPORT.md` sources
- [ ] Test numbers on slide 6 are measured, not estimated
- [ ] Live link on slide 1 works in an incognito window
- [ ] Exported to PDF; opened on a second laptop; exactly 6 slides
- [ ] Uploaded by **Wed 11 PM**; screenshot of the "uploaded" status posted in the team chat
- [ ] Re-upload by Thu 8:30 AM only if something important changed
