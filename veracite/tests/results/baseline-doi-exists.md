> **BASELINE, not Veracite: a naive DOI-exists checker, for comparison only. SAMPLE data.**

# Golden-set evaluation · Baseline: DOI-exists check (Crossref lookup / URL status only), NOT Veracite

Run: 2026-11-24T18:40:10.902Z · golden set as of this commit · 51 references · 1 error

**Tested on 51 references (30 real, 1 fabricated, 10 chimeras, 5 retracted, 5 web) · 4/11 fakes caught · 12 fakes marked Verified · 100% of real references verified · 0/5 retractions flagged · median 0.2 s per reference · 1 could not be checked (errors)**

| Metric | Result | Target |
|---|---|---|
| Fakes caught (fabricated + chimeras) | 4/11 (36.4%) | 100% |
| **Fakes marked Verified** | **12** (chim-001, chim-002, chim-004, chim-005, chim-006, chim-007, chim-009, ret-001, ret-002, ret-003, ret-004, ret-005) | **0** |
| Real references verified | 30/30 (100%) | ≥ 90% |
| Retractions flagged | 0/5 | 5/5 |
| Web sources as expected | 3/5 | 5/5 |
| Exact status agreement | 33 (66%) | — |
| Median time per reference | 202 ms (p95 1387 ms) | < 2000 ms |

## Per set (expected → got)

- **real** (30/30 exact): verified→verified ×30
- **fabricated** (0/1 exact): chimera→notfound ×1
- **chimeras** (0/10 exact): chimera→verified ×7, chimera→notfound ×3
- **retracted** (0/5 exact): retracted→verified ×5
- **web** (3/5 exact, 1 errors): verified→verified ×2, verified→error ×1, partial→notfound ×1, notfound→notfound ×1

Retractions missed: ret-001:verified, ret-002:verified, ret-003:verified, ret-004:verified, ret-005:verified
