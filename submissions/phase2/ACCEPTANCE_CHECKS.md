# Phase 2 acceptance checks (Zedan · Z12)

Use with [`DAY_OF_NOTES.md`](DAY_OF_NOTES.md) and the playbook [`docs/09`](../../docs/09_PHASE2_PLAYBOOK.md).

## 13:15–13:30 · read the requirements
1. Copy each requirement **verbatim** into `DAY_OF_NOTES.md`.
2. **Underline every "must", "only", "at least", number and deadline.** Each one becomes a check.
3. Find the closest row below, copy its 3 checks into the *Acceptance checks* column and adjust them to the exact wording. A check is done only when you **saw it on the live link**, not when it works locally.

## 14:40 · standing checks on the live link (every time)
```bash
node submissions/phase2/smoke.mjs        # 15 checks: pages, registries, real/fake/retracted/chimera, X-ray stream, web check, SSRF guard
```
Then by hand, in an **incognito** window on `https://veracite.vercel.app`:
- [ ] X-ray: paste `fab-001` + one real + one retracted reference → chimera / verified / retracted, nothing fake marked Verified
- [ ] Library → APA 7 → the export gate appears → tick → file downloads
- [ ] Trust Center shows "0 fakes marked Verified" and the health line (registries + AI or Rules mode)
- [ ] The new feature works, **and** turning AI off (Rules mode) doesn't break it
- [ ] Phone width (375 px): no sideways scroll on the new screen

Baseline run, Wed 25 Nov 22:30: **15/15 passed**. Health said **AI: rules (no AI key configured)**, so AI agents won't run in the Research demo until the Groq key is set on Vercel.

## Prepared checks for the likely requirements (playbook list)
| If they ask for… | Check 1 | Check 2 | Check 3 |
|---|---|---|---|
| **Another citation style** (Harvard, IEEE, Chicago, Vancouver) | Pick the style → the list re-formats; compare one entry with the official style guide | In-text citation format matches the style | Switching back to APA 7 gives the original text exactly |
| **Web pages / news / YouTube** | Paste a live URL citation → **Partial** with the page title and "Retrieved … from" | Dead URL with an archive copy → Partial + Wayback link | Fake path on a real domain → never Verified |
| **Group / team projects** | Export a library as JSON on device A, import on device B → same sources | Each source shows who added it | Receipts / AI-use statement name each member's AI use |
| **Supervisor / faculty view** | Scan the certificate QR on a second phone → opens, re-checks live | Edit one character in the link → "doesn't match its fingerprint" | Faculty can see the AI-use statement + Prompt Ledger without the student's device |
| **Non-English / Arabic sources** | Search returns non-English works, labelled with their language | Arabic text displays right-to-left without breaking the layout | Bias lens counts the non-English sources |
| **Only open-access / peer-reviewed / date limits** | Turn on the filter → every result obeys it (spot-check 5) | The filter is shown on the plan (checkpoint 1) | Turning it off restores the full list |
| **Limit AI usage** (N calls / no AI) | Set the cap → the (N+1)th call is refused with a visible banner | Rules mode: X-ray, labels and export still work | The AI-use statement says "No generative AI model was used" |
| **Explain why a reference failed** | Chimera shows which real paper each part came from | Not found shows what was searched, where and when | The "why" text is template text, identical on a rerun (not AI) |
| **Accessibility** | Whole X-ray path by keyboard only (Tab / Enter / Esc) | Reduced-motion: no 3D animation; list view available | Contrast ≥ 4.5:1 on labels; screen reader reads status badges |
| **Mobile version** | 375 px: no sideways scroll on X-ray, Library, export gate | 3D hidden or light below 768 px; buttons ≥ 44 px | Paste + check + export works with touch only |
| **A specific discipline** (medicine, law, business) | A known paper from that field → Verified via the new source | The source is named in the field-by-field table | Retraction check still runs on those records |
| **Export to Word / PDF** | File opens in Word/Acrobat with italics correct | AI-use statement + tool reference included | The export gate still appears first |
| **Chatbot / Q&A over my library** | Every answer cites only library items (try asking for an outside paper → refused) | Each sentence carries a trust label | Prompts appear in the Prompt Ledger, PII scrubbed |
| **Show how AI was used** | AI-use statement lists models and what each did | Prompt Ledger downloads as Markdown / CSV / JSON with a hash | The statement never claims "I wrote this" unless the student typed it |
| **Plagiarism check** | Paste a copied sentence → "copied" with the passage highlighted | The same text in quotation marks → OK (and checked against the source) | Own-words paraphrase → OK |
| **Rate the reliability of a source** | Shows quality facts (peer review, open access, citations, retraction), not one score | Retracted source shows red whatever else is true | We can explain in one line why there is no single score |
| **Handle a retracted paper** | `ret-005` (Stapel 2011) → Retracted, though its title has no "RETRACTED" | It can't be added to the list | The retraction notice DOI is shown |
| **Data / privacy constraint** | DevTools → Network: no request carries the student's text to anything but our API | PII scrubber: an email typed into a prompt shows as `[EMAIL]` in the ledger | Certificate data stays after `#` (never sent to a server) |

## After 14:50
- [ ] Every underlined "must" has a ticked check in `DAY_OF_NOTES.md`
- [ ] Prompts used today are in `docs/PROMPT_LOG.md`, then: `node submissions/prompt-log/export.mjs` (Z13)
- [ ] Trust Center wording updated if the change touched data, AI use or policy (Z13)
