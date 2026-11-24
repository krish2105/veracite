# 09 · Phase 2 playbook: the 90 minutes on Thursday

*Requirements are revealed at 1:15 PM; we build 1:30–3:00. Owner: Krishna at the keyboard; Zedan on rules and tests; Avighna on the clock, script and screenshots.*

## Minute-by-minute
| Clock | Who | Do |
|---|---|---|
| 1:15–1:30 | All | Read the requirements twice. Zedan underlines every **must** and **constraint**. Avighna writes them on one shared note |
| 1:30–1:40 | All | **Triage:** map each requirement to (a) already done → just demo it; (b) a feature flag or small change; (c) new build. Pick the **smallest change that fully meets it**. One-line "DECIDED:" in chat |
| 1:40–2:30 | Krishna | Build with Claude Code using the prompts below. Commit every 15 min |
| 1:40–2:30 | Zedan | Write 3 acceptance checks per requirement; update the Trust Center and governance copy if the change touches data, AI use or policy; add the prompts to `PROMPT_LOG.md` |
| 1:40–2:30 | Avighna | Rewrite demo segment 4:30–5:30 around the new feature; prep the 1-sentence "how we met it" line per requirement |
| 2:30–2:40 | Krishna | **Deploy to Vercel** |
| 2:40–2:50 | Zedan + Avighna | Smoke test **the live link** in incognito: golden path + new feature + Rules mode |
| 2:50–2:55 | All | Fix only show-stoppers. Otherwise **freeze** |
| 3:00 | — | Submissions close. Anything after this doesn't count |

**Rules:** never break the P0 demo spine for a new feature (put new code behind a flag); if a build fails at 2:45, roll back to the last good deploy (Vercel → Deployments → Promote).

## Likely Phase 2 requirements, and our prepared move

| If they ask for… | Our move (usually 15–40 min with Claude Code) |
|---|---|
| A **different citation style** (Harvard, IEEE, Chicago, Vancouver) | Add the official CSL file to `src/lib/cite/styles/` + dropdown option |
| **Web pages / news / YouTube as sources** | F20 web-source flow: URL check + Wayback snapshot + APA retrieval date |
| **Group / team projects** | Shared library via export/import JSON + "added by" field + per-member contribution log in Receipts |
| **A supervisor / faculty view** | Certificate page as a "faculty mode": re-verify, see disclosure + ledger, flag a reference |
| **Non-English or Arabic sources** | OpenAlex `language` filter + Planner suggests bilingual keywords (labelled) + RTL UI |
| **Only open-access / only peer-reviewed / date limits** | Filters already in the Planner schema → expose as toggles |
| **Limit AI usage** (e.g. max N calls, or no AI at all) | Budget caps in the gateway + Rules mode / autonomy dial = Off |
| **Explain why a reference failed** | Field-by-field table already exists → add a plain-English "why" line (template, not AI) |
| **Accessibility** | Keyboard path + list twin for 3D + reduced-motion + contrast check |
| **Mobile version** | Responsive pass on X-ray + library; hide 3D below 768 px |
| **A specific discipline** (medicine, law, business) | Add a discipline source: Europe PMC (medicine), SSRN via Crossref (business), CourtListener (law) |
| **Export to Word / PDF** | `docx` export of bibliography + statement, or browser print-to-PDF stylesheet |
| **A chatbot / Q&A over my library** | Chat restricted to library items: the same whitelist + labels (a chat that cannot cite outside the library) |
| **Show how AI was used** | Already done: AI-use statement + Prompt Ledger + Receipts |
| **Plagiarism check** | Paraphrase guard (F33): n-gram overlap vs. source text |
| **Rate the reliability of a source** | Quality *facts* panel (F22). Explain why we don't output a single score |
| **Handle a retracted paper** | F19 already does it. Demo with a known retracted DOI from the golden set |
| **Data / privacy constraint** (e.g. "no data may leave the browser") | Rules mode + local-only processing; show the PII scrubber |

## Claude Code prompt template for Phase 2 (copy, fill the blanks)
```
New hackathon requirement (verbatim): "<paste>"
Constraints: must be live on Vercel by 2:40 PM; do not break the X-ray, the research workflow,
the 3 checkpoints, trust labels, Rules mode or export. Put the new behaviour behind a feature
flag in src/lib/flags.ts. Reuse existing registries, verifier and labels; the AI must still never
output a reference it didn't retrieve. Add one test. Then give me a 3-step manual test I can run
on the live link, and a one-sentence explanation for the judges.
```

## Phase 2 checklist (print it)
- [ ] Every "must" in the requirements has a visible feature or answer
- [ ] P0 spine still works on the **live link** (X-ray, research, labels, export)
- [ ] Prompts used today added to `PROMPT_LOG.md`
- [ ] Trust Center updated if data or AI use changed
- [ ] Demo segment 4:30–5:30 rehearsed once
- [ ] Final live link posted in the team chat at 2:55
