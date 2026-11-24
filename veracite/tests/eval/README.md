# Golden-set evaluation (owner: Zedan · Z06)

Runs a reference checker over `tests/golden/*.json` and reports the numbers docs/03 §10 promises to publish. **Only `tests/results/latest.*` (Veracite's own X-ray) may go on the Trust Center or a slide.**

```bash
cd veracite
# Veracite's X-ray (needs `npm run dev` and Krishna's POST /api/sources/xray, K05)
node tests/eval/run.mjs --adapter xray                       # → tests/results/latest.json + latest.md
node tests/eval/run.mjs --adapter xray --base https://<live-link>

# Comparison: a naive "does the DOI exist?" checker (NOT Veracite)
node tests/eval/run.mjs --adapter baseline                   # → tests/results/baseline-doi-exists.json + .md

# Options: --sets real,chimeras · --limit 3 (per set, smoke run) · --concurrency 3
node --test "tests/eval/*.test.mjs"                          # scoring unit tests
```

## Metrics
| Metric | Meaning | Target |
|---|---|---|
| **Fakes marked Verified** | anything not really verified (fabricated, chimera, retracted, dead web page) that came out `verified` | **0** |
| Fakes caught | fabricated + chimeras **not** marked `verified` | 100% |
| Real references verified | `real.json` records marked `verified` | ≥ 90% |
| Retractions flagged | `retracted.json` records marked `retracted` | 5/5 |
| Median time per reference | wall-clock per check | < 2 s |

Errors (network, timeouts) are counted and shown, and left out of the rates; a run where **nothing** could be checked writes **no file**, so "0 fakes marked Verified" can never come from an empty run.

## X-ray contract (for Krishna, K05)
The runner sends one reference at a time, so it can time each one:
```http
POST /api/sources/xray
{ "text": "<one raw APA reference>" }
→ { "results": [ { "status": "verified" | "chimera" | "mismatch" | "notfound" | "retracted" | "partial", … } ] }
```
It also accepts `verdicts[0].status`, `references[0].status` or a top-level `status`. If K05 ends up different, change `ADAPTERS.xray` in `run.mjs`.

## Baseline result (24 Nov 2026, live Crossref)
`tests/results/baseline-doi-exists.md`. A naive DOI-exists checker verified **30/30 real** references but also marked **12 fakes as Verified**: 7 of 10 chimeras and all 5 retracted papers. It "caught" only the 3 chimeras without a DOI, because it had nothing to look up. That is the gap Veracite's two-registry cross-match, chimera detector and retraction check exist to close. (Fabricated set not yet collected: Z01.)

*Say it like this:* "A checker that only asks 'does this DOI exist?' passed 12 of our 15 fake or retracted references." Don't present baseline numbers as Veracite's.
