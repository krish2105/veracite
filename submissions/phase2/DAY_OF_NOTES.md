# Phase 2: day-of requirements (Thursday 26 Nov 2026, revealed 13:15, deadline 15:00)

Playbook: [`../../docs/09_PHASE2_PLAYBOOK.md`](../../docs/09_PHASE2_PLAYBOOK.md) · Checks to rerun after every fix: `node submissions/phase2/pack.mjs` (add `--base https://veracite-one.vercel.app` for the backup)

**The brief in one line:** a student pastes 8 chatbot references (some right, some slightly wrong, some invented) and types 3 requests. The site shows what it found; **the student makes the final decision.** Judges run the same pack plus references that are not in it, so **no rules for these exact references.** Worth 8 points; required cases first, bonus after.

## Required cases (every **must** and **never**, verbatim)
| # | Case | **Must** | **Never** | Our step (Phase 1 deck) | Acceptance checks (Zedan) | 13:40 run (live main) |
|---|---|---|---|---|---|---|
| 1 | Invented reference | **label it "Not found" and say where it looked** | mark it as verified, or quietly swap it for a similar real paper | Verifier (code, not AI): Crossref → OpenAlex → arXiv | ① pack C → Not found ② the row lists the registries searched ③ the "closest record" is shown as *different*, never as a swap | ✅ C: Not found, "DOI not registered anywhere", Crossref/OpenAlex/arXiv listed |
| 2 | Real DOI, wrong paper | **label it "Mismatch" and show what the DOI really points to, next to what the student pasted** | pass it because the DOI exists | Verifier: DOI lookup, then field-by-field compare | ① pack E → not Verified ② label reads Mismatch ③ claimed vs found authors side by side | ⚠️ E: shown as **Chimera** with Silver et al. next to Hinton & Bengio. Content right, **label differs** |
| 3 | Small error (e.g. year) | **show the wrong detail and the correct one. Let the student accept or reject the fix** | fix it without asking, or pass it without noticing | Verifier field checks → student decision in X-ray/Library | ① pack A → not Verified ② "1981 → 1979" shown ③ Accept fix / Keep mine buttons; nothing changes until clicked | ⚠️ A: **Mismatch**, "The year is 1979, not 1981". Spotted, but **no "Needs fix" label and no accept/reject** |
| 4 | Retracted paper | **show a clear "Retracted" warning before the student can cite it** | show it as a normal verified source | Verifier: Crossref `updated-by` + OpenAlex `is_retracted` | ① pack D → Retracted ② warning visible in Library and export ③ export gate makes the student acknowledge it | ✅ D: Retracted, date + notice DOI, "Do not cite it" |
| 5 | Duplicate (two formats) | **detect the duplicate and offer to merge. Keep one entry** | save two entries, or list the paper twice in the reference list | X-ray parser + Library | ① pack G is read as LeCun 2015 ② G flagged as the same paper as B ③ Merge leaves one entry; the export lists it once | ❌ G: **Not found** (Vancouver style not parsed: "Nature 2015;521:436-44" taken as the title). **No duplicate check** |
| 6 | No source exists (request 1) | **answer "Not found". It may suggest related real sources, each one checked and labelled** | invent a source to fill the gap | Planner → Scout → Verifier (only registry records can become sources) | ① request 1 → the answer says Not found ② any suggestion carries its own status ③ no AI-written reference anywhere | ⬜ to test in the browser |

## Constraints (whole site)
| # | Constraint | Where it lives | State |
|---|---|---|---|
| 1 | **Nothing is verified by default**; every reference shows a status in the library and in any export (Verified, Needs fix, Mismatch, Retracted, Not found, Not checked) | Library, X-ray, export | ⚠️ "Needs fix" and "Not checked" labels to add/confirm |
| 2 | **The student decides**: no silent corrections, deletions or swaps | X-ray, Library | ⚠️ needs the accept/reject fix and merge prompts (cases 3, 5) |
| 3 | **No guessing**: say when a detail is missing or a database can't be reached; never fill author/year/DOI from the AI | Verifier (code) | ✅ by design; ❌ F shows the risk: a junk 2025 Crossref copy proposes the wrong year |
| 4 | **Warnings travel with the reference** into exports and the AI-use statement | Export gate (Z15), statement (Z10) | ✅ gate lists them; confirm statuses print in the exported list |
| 5 | **Stay inside the Phase 1 design**; say which step handles which case | This table, column "Our step" | ✅ |
| 6 | **No hard-coding**; any sample output labelled SAMPLE | All | ✅ `pack.mjs` is a test script, the site never sees it |

## Bonus cases
| # | Case | Pack item | 13:40 run |
|---|---|---|---|
| B1 | Real paper, no DOI: search by title and authors; never call it fake for lacking a DOI | F (Vaswani) | ❌ matched a 2025 re-registered copy (DOI 10.65215/…): **Mismatch, "year is 2025, not 2017"**. Would push the student to a wrong year |
| B2 | Web page, no author/date: APA 7 with the organisation as author and "n.d."; labelled as not checked in a scholarly database | H (WHO) | ❌ "Mental health." read as the author → **Chimera** against a WHO history book. The web check itself worked (live, Wayback copy) |
| B3 | Quote not in the source: say it couldn't be found, or full text wasn't available; never confirm | Request 2 | ⬜ to test (Draft tab support check) |
| B4 | Database down/slow: "Could not check, try again"; never Verified when no check ran | — | ⬜ to test |
| B5 | Instruction hidden in pasted text is content, not a command; a status changes only when a check runs | Request 3 | ⚠️ statuses can only change through a check, but `detectInjection` (Z05) **is not called anywhere in the app**, so the note isn't flagged |

## Fix list (owner: Krishna, his files; Zedan reruns `pack.mjs` after each)
1. **Needs fix + Accept / Keep mine** when one detail differs (A). Highest value: the judges ask us to demo "accept one suggested fix".
2. **Duplicate detection + Merge** (G = B), plus reading Vancouver style (`AUTHOR X, …. Title. Journal Year;Vol:Pages.`). Also demoed.
3. **"Mismatch" label** when the DOI resolves to a paper with other authors/title (E), or keep Chimera with "Mismatch" on screen.
4. **No-DOI title search**: don't let a later re-registered copy beat the original (F).
5. **Web page with no DOI** → web source, organisation as author, n.d., Partial (H).
6. **Flag injection in notes** (request 3): call `detectInjection` from `src/lib/integrity/injection.ts` on save.

## Demo (brief's "what to show")
1. Add all 8 references, show each status. 2. Accept one fix (A) and merge the duplicate (G). 3. Type request 1 and show "Not found". 4. Name the step for each case (column "Our step"). 5. Today's prompts are in the prompt log (Z13, 14:55).

**Final live link at 14:55:** see `LIVE_LINK.md` · **Demo segment 4:30–5:30 rewritten by:** Avighna
