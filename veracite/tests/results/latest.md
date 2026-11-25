# Golden-set evaluation · Veracite Reference X-ray (http://localhost:3000/api/sources/xray)

Run: 2026-11-25T10:58:23.755Z · golden set as of this commit · 51 references · 0 errors

**Tested on 51 references (30 real, 1 fabricated, 10 chimeras, 5 retracted, 5 web) · 11/11 fakes caught · 0 fakes marked Verified · 100% of real references verified · 5/5 retractions flagged · median 0.4 s per reference**

| Metric | Result | Target |
|---|---|---|
| Fakes caught (fabricated + chimeras) | 11/11 (100%) | 100% |
| **Fakes marked Verified** | **0** | **0** |
| Real references verified | 30/30 (100%) | ≥ 90% |
| Retractions flagged | 5/5 | 5/5 |
| Web sources as expected | 0/5 | 5/5 |
| Exact status agreement | 45 (88.2%) | — |
| Median time per reference | 441 ms (p95 6883 ms) | < 2000 ms |

## Per set (expected → got)

- **real** (30/30 exact): verified→verified ×30
- **fabricated** (1/1 exact): chimera→chimera ×1
- **chimeras** (9/10 exact): chimera→chimera ×9, chimera→mismatch ×1
- **retracted** (5/5 exact): retracted→retracted ×5
- **web** (0/5 exact): verified→mismatch ×1, verified→chimera ×1, verified→notfound ×1, partial→notfound ×1, notfound→mismatch ×1
