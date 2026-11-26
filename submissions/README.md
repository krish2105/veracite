# Submissions: everything we hand in

| # | Deliverable | Due (Dubai) | File / place | Owner | Status |
|---|---|---|---|---|---|
| 1 | **Phase 1 ideation deck** (≤ 6 slides, PPTX or PDF) | **Thu 26 Nov 09:00** (team target Wed 23:00) | [`phase1/Team7_Veracite_Phase1_Deck.pptx`](phase1/Team7_Veracite_Phase1_Deck.pptx) (uploaded) · [`.pdf`](phase1/Team7_Veracite_Phase1_Deck.pdf) copy | Krishna uploaded | ✅ submitted Thu 26 Nov, 02:19 |
| 2 | **Live website link** (we present from it) | Thu 15:00 | [`phase2/LIVE_LINK.md`](phase2/LIVE_LINK.md) | Krishna | ✅ live: https://veracite.vercel.app |
| 3 | **Phase 2 adaptation** (day-of requirements) | Thu 15:00 | [`phase2/DAY_OF_NOTES.md`](phase2/DAY_OF_NOTES.md) | Krishna + Zedan | ⬜ Thursday |
| 4 | **Record of AI prompts** (rule 8) | at the event | [`prompt-log/`](prompt-log/) → source [`../docs/PROMPT_LOG.md`](../docs/PROMPT_LOG.md) | Zedan | 🟡 exported Thu 08:01 (85 entries); re-export after Phase 2 |
| 5 | **8-min demo + 2-min Q&A** | Thu 15:20–16:40 | [`../docs/08_DEMO_SCRIPT_AND_QA.md`](../docs/08_DEMO_SCRIPT_AND_QA.md) | all | ⬜ rehearse |
| 6 | **AI quiz** | Thu 15:15 | [`../docs/10_AI_QUIZ_PREP.md`](../docs/10_AI_QUIZ_PREP.md) | all | ⬜ revise |

## Phase 1 deck: how to rebuild after edits
```bash
cd submissions/phase1/deck && npm install          # first time only
node build-deck.cjs                                 # → ../Team7_Veracite_Phase1_Deck.pptx
# PDF with embedded fonts (needs the brand fonts installed, see build-deck.cjs header):
soffice --headless --convert-to pdf --outdir .. ../Team7_Veracite_Phase1_Deck.pptx
```
Upload the **PDF**: its fonts are embedded, so it looks identical on any judge's laptop. Re-uploading replaces the earlier upload; the latest before 09:00 counts.

## Upload checklist
- [ ] Exactly 6 pages; open the PDF on a second laptop
- [ ] Names, team number and stats sources visible; no placeholder text
- [ ] Uploaded on the hackathon site; screenshot of "uploaded" posted in the team chat
