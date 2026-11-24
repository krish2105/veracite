# Golden test set (owner: Zedan · task Z01)

Used to measure the Verifier and Reference X-ray. Its results go on the Trust Center and back the "0 fakes marked Verified" claim. **Every record is test data (`"sample": true`). No personal data.**

## Files
| File | Count | What |
|---|---|---|
| `real.json` | 30 | Real references across disciplines (business, management, AI, health). Check every DOI by hand at doi.org |
| `fabricated.json` | 20 | References invented by ChatGPT/Gemini, **unedited**. Log the exact prompts in `docs/PROMPT_LOG.md` |
| `chimeras.json` | 10 | Real title + wrong authors/year (or real authors + someone else's title) |
| `retracted.json` | 5 | Real, retracted papers (find via Retraction Watch / Crossref `update-type:retraction`) |
| `web.json` | 5 | Web pages (for the web-source + Wayback check) |

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
`expected` is one of: `verified` · `chimera` · `mismatch` · `not_found` · `retracted` · `partial`.
