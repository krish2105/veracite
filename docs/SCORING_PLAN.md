# How we get 95+ out of 100

**Official rubric** (from the hackathon site): Phase 1 deck **30** · AI quiz **5** · Phase 2 website & presentation **65**. Ties go to the higher Phase 2 score, so **the live website matters most.**

| Criterion | Pts | What judges must *see* to give full marks | Our evidence | Tasks |
|---|---|---|---|---|
| **Deck · Workflow** | 8 | Who does what, in what order; where the student is in control; where answers are checked | Swimlane: 7 agents, 3 approval gates, 5 checks A–E | done (deck) |
| **Deck · Architecture** | 6 | Website, AI, sources, reference storage and how they connect | 5-box diagram using exactly those words; code vs AI colour key | done (deck) |
| **Deck · Ethics** | 5 | Invented citations, plagiarism, privacy, bias, over-reliance + responses | 6 risk → design cards | done (deck) |
| **Deck · Governance** | 5 | Who is accountable, how AI use is disclosed, which rules | RACI, 3-layer disclosure, SP Jain clause numbers | done (deck) |
| **Deck · Guardrails** | 6 | Specific mechanisms | 5 bands, strongest first; test-set pass bar | done (deck) |
| **AI quiz** | 5 | 1st place = 5 | Specialist-decides rule, `10_AI_QUIZ_PREP.md` | all |
| **Working MVP** | 15 | It runs on the live link with **real data**: no crashes, no "coming soon", fast | Real Crossref/OpenAlex verification, real Groq agents, deployed on Vercel, Rules-mode fallback | K02–K09, A05 |
| **Research & citation features** | 12 | Find, organise and cite: search, library, tags, export styles, snowballing | Multi-registry search, library with collections/tags/notes, APA/MLA/Harvard/IEEE/Chicago/BibTeX/RIS, snowball, web sources | K03, K08–K12, A05, A06, Z10 |
| **Honesty & verification in action** | 10 | **Live** proof that fakes get caught and Not found is honest | X-ray on a real ChatGPT bibliography; blocked-fabrication counter; quote match; retraction alert; certificate re-verify; measured test results | K04–K06, Z04–Z09 |
| **Day-of requirements** | 8 | Every new requirement visibly met by 15:00 | `09_PHASE2_PLAYBOOK.md`, feature flags, acceptance checks | K15–K16, Z12–Z13, A12 |
| **User experience** | 8 | Beautiful, clear, accessible, consistent | Hybrid 3D design, UV-lamp toggle, list fallbacks, keyboard paths, ⌘K, Arabic | A03, A04, A07–A09 |
| **Presentation & Q&A** | 12 | Tight 8-minute story; every member answers confidently | `08_DEMO_SCRIPT_AND_QA.md`, 3 rehearsals, 24 prepared answers | K17, Z11, Z14, A11, A13 |

## The five moments that win the room
1. **The X-ray catches a real ChatGPT bibliography live.** One chimera comes apart in 3D (Honesty 10).
2. **"Blocked fabrication" counter:** the Scribe tried to cite an ID that was never retrieved, and code stopped it (Honesty, Q&A).
3. **We turn the AI off** (Rules mode) and every check still works (MVP, Guardrails, Q&A).
4. **A professor scans the certificate QR** and it re-verifies live (Governance, Research).
5. **The Phase 2 requirement appears as a clean, flag-gated feature**, explained in one sentence (Day-of 8).

## Where points are usually lost (and our guard)
| Risk | Guard |
|---|---|
| Demo depends on Wi-Fi or free-tier quota | Cache + pre-warmed queries, Rules mode, 90-second backup video |
| "Sample" content presented as real (rule 9) | SAMPLE ribbons; demo uses live registry calls |
| One member can't answer a question | Every member memorises the 60-second pitch; Q&A owners per topic |
| Over-scoping breaks the demo spine | P0 first; P1/P2 only when every P0 is green in STATUS.md |
| Phase 2 change breaks the live link | Deploy by 14:40, smoke test in incognito, Vercel "promote previous" as rollback |
