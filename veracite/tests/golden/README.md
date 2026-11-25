# Golden test set (owner: Zedan · task Z01)

Used to measure the Verifier and Reference X-ray. Its results go on the Trust Center and back the "0 fakes marked Verified" claim. **Every record is test data (`"sample": true`). No personal data.**

## Files
| File | Count | What | State |
|---|---|---|---|
| `real.json` | 30 | Real references across disciplines (business, management, AI, health, education) | ✅ All 30 DOIs matched in Crossref (title, journal, volume, authors) on 24 Nov 2026. 20 are ChatGPT output kept **unedited** (`origin: chatgpt-2026-11-24`); 10 hand-picked |
| `fabricated.json` | **1** (planned 20) | References invented by ChatGPT/Gemini, **unedited**. Prompts logged in `docs/PROMPT_LOG.md` | ✅ **Final: 1.** 7 prompts across ChatGPT and Gemini (24 Nov) produced 15 references and exactly 1 provable fabrication (`fab-001`). **Decision (Zedan, 24 Nov): keep 1 genuine fake rather than pad the set with hand-made ones.** See "What happened" below |

**Total: 51 records** (30 real · 1 fabricated · 10 chimeras · 5 retracted · 5 web). 30 should come out `verified` (the real set); the other **21 must never be marked Verified** (1 fabricated, 10 chimeras, 5 retracted, 5 web pages: a page without a DOI is at most `partial`, docs/03 §3).
| `chimeras.json` | 10 | Real title + wrong authors/year (or real authors + someone else's title, or a real DOI on the wrong citation) | ✅ Built by hand from records in `real.json` (`built_from`, `altered`) |
| `retracted.json` | 5 | Real, retracted papers | ✅ Each confirmed retracted via Crossref `updated-by` (Retraction Watch data) on 24 Nov 2026 |
| `web.json` | 5 | Web pages (for the web-source + Wayback check) | ✅ 3 live + 1 dead with a Wayback copy → all `partial`; 1 fake path → `notfound`. (Corrected 25 Nov: the 3 live pages were wrongly `verified` before.) Checked by `GET /api/sources/wayback` (Z16): 5/5 match live |

## Record format
```json
{
  "id": "real-001",
  "sample": true,
  "raw": "Rahman, S., & Okafor, T. (2021). Title… Journal, 12(3), 44–59. https://doi.org/…",
  "expected": "verified",
  "doi": "10.xxxx/xxxxx",
  "notes": "Checked by hand at doi.org on 25 Nov"
}
```
`expected` is one of: `verified` · `chimera` · `mismatch` · `notfound` · `retracted` · `partial`.

Optional extra fields (the Verifier ignores them; the eval runner may report on them):
- `origin`: where the `raw` text came from (`chatgpt-2026-11-24`, `hand-picked`, `gemini-…`).
- `built_from` / `altered` (chimeras): which real records were mixed, and which field was changed.
- `url` (web): the URL to check. `doi` is `null` when the citation has no DOI.

## Edge cases the Verifier must handle (found while building this set)
| Record | What makes it hard |
|---|---|
| `real-020` | Crossref has the **given and family names swapped** (`family: "Jing", given: "Zhang"`). The citation is correct. A strict surname match wrongly calls it a chimera |
| `real-013` | Advance online: **no volume, issue or pages** in Crossref. Missing fields must not mean `notfound` |
| `real-001`, `-005`, `-008`, `-015`, `-019` | Online year ≠ issue year (1-year gap). The year rule must accept either |
| `real-024` | Crossref title has a stray footnote digit (`Unified View1`) |
| `real-025` | SICI DOI with `( ) < > : ;`. Needs safe extraction and URL-encoding |
| `real-029` | 23 authors, APA ellipsis; `Seßler` vs Crossref `Sessler` (fold ß→ss) |
| `real-003` | Crossref gives only the first page; the end page can't be checked |
| `chim-001` | One author overlaps (Bengio). "Any author matches" must not pass it |
| `chim-006` | A correct citation with **someone else's real DOI**. Existence alone is not enough |
| `chim-010` | Crossref bibliographic search ranks by author names and returns Teece's *real* paper, not the borrowed title's paper. Compare titles; don't trust the top hit |
| `ret-005` | Retracted, but the Crossref title has **no "RETRACTED" prefix**. Read `updated-by` |
| `web-001` | Page is rendered by JavaScript; raw HTML has no `<title>` |

## What happened when we ran these prompts (24 Nov 2026)
**Gemini** (signed in, "Hydrogen") also refused, both to a direct request and to a realistic "write a literature-review paragraph with 8 citations" request (it used `[Author, Year]` placeholders). It named one study we could not find in Crossref or OpenAlex (Basri, 2024, *Eurasian Journal of Educational Research*); not provably fake, so not used.

Logged-out ChatGPT **refused all 5** ("I don't want to give you five fabricated academic references") and offered 13 "related" references instead. Crossref: 12 real, **1 invented** (`fab-001`: real authors, a title/journal/DOI that don't exist). Two lessons:
1. Current ChatGPT is much more careful on narrow topics than in 2023, but it still slipped once, inside an answer that loudly promised not to fabricate. That's a better demo story than an obviously fake list.
2. **Demo risk:** docs/08 plans to paste "a ChatGPT-made bibliography" with fakes in it. ChatGPT may not produce one on the day. Use `fab-001` + the chimeras + the retracted set for the X-ray demo instead.

### Why we kept 1 instead of 20
- The set measures **real AI behaviour**. Hand-made fakes would test our own imagination, not ChatGPT's, and we already have 10 hand-built chimeras for that.
- The finding itself is the honest headline: *"In November 2026 ChatGPT and Gemini mostly refuse to invent references. The danger is the one that slips through anyway, inside an answer that promises not to fabricate."*
- **How to report it:** always say "1 AI-fabricated reference" (never "20"), and quote the proof line from `tests/results/latest.md`, which counts what is actually in the files.

## Adding more later (optional, ~15 min)
An AI coding assistant must not write these: the point is to capture **real** hallucinations from the tools students use. The ChatGPT list of 24 Nov (now in `real.json`) produced **0 fakes in 20**, because broad topics have plenty of real papers. Narrow, demanding prompts make models invent. Run each prompt in a fresh chat (ChatGPT, and Gemini if possible, **web search / browsing turned off**):

1. `Give me 5 peer-reviewed journal articles from 2019–2024 on the use of AI tutors specifically in MBA programmes in the UAE or Saudi Arabia. APA 7, with DOI, volume, issue and pages.`
2. `List 5 empirical studies on the effect of the UAE 4.5-day work week on employee productivity in Dubai free zones, with APA 7 references and DOIs.`
3. `Give me 5 references with exact page numbers and a direct quote from each, on mindfulness apps reducing exam stress among Emirati university students. APA 7 with DOIs.`
4. `Cite 5 papers by Hofstede or Barney published after 2020 on AI adoption in family businesses in the GCC. APA 7 with DOIs.`
5. `Give me 5 APA 7 references, with DOIs, for systematic reviews on TikTok use and sleep among Arab adolescents published in 2023.`

Then:
1. Paste each reference **exactly as produced** into a new record (`"id": "fab-001"…`, `"origin": "chatgpt-<date>"` or `"gemini-<date>"`, `"expected": "notfound"` for now, `"doi"` as given or `null`).
2. Check each DOI at doi.org and the title in Crossref. Change `expected` to what is really true: `notfound` (no such paper), `chimera` (real paper, wrong authors/year), `mismatch` (DOI resolves to a different paper), or `verified` if it turns out to be real (then move it to `real.json` instead). Write what you found in `notes`.
3. Keep going until there are 20 records that are **not** real.
4. Log every prompt verbatim in `docs/PROMPT_LOG.md` with the tool, model and date.

Claude Code can do step 2 for you: paste the output and ask it to check the records against Crossref.
