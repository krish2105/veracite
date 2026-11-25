# Golden-set evaluation · Veracite Reference X-ray (http://localhost:3100/api/sources/xray)

Run: 2026-11-25T17:06:39.868Z · golden set as of this commit · 51 references · 0 errors

**Tested on 51 references (30 real, 1 fabricated, 10 chimeras, 5 retracted, 5 web) · 11/11 fakes caught · 0 fakes marked Verified · 100% of real references verified · 5/5 retractions flagged · median 0.5 s per reference**

| Metric | Result | Target |
|---|---|---|
| Fakes caught (fabricated + chimeras) | 11/11 (100%) | 100% |
| **Fakes marked Verified** | **0** | **0** |
| Real references verified | 30/30 (100%) | ≥ 90% |
| Retractions flagged | 5/5 | 5/5 |
| Web sources as expected | 3/5 | 5/5 |
| Exact status agreement | 48 (94.1%) | — |
| Median time per reference | 460 ms (p95 2711 ms) | < 2000 ms |

## Per set (expected → got)

- **real** (30/30 exact): verified→verified ×30
- **fabricated** (1/1 exact): chimera→chimera ×1
- **chimeras** (9/10 exact): chimera→chimera ×9, chimera→mismatch ×1
- **retracted** (5/5 exact): retracted→retracted ×5
- **web** (3/5 exact): partial→partial ×3, partial→chimera ×1, notfound→mismatch ×1
