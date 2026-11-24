# Tasks: how this works

- **One file per person:** [`krishna.md`](krishna.md) · [`zedan.md`](zedan.md) · [`avighna.md`](avighna.md). **Edit only your own file**, so we never get merge conflicts.
- When you start a task, change `[ ]` to `[~]`. When it's done, `[x]`. If you're stuck, `[!]` and add a note after `blocked:`.
- Push. GitHub Actions regenerates [`docs/STATUS.md`](../docs/STATUS.md) (overall %, per person, per rubric criterion, build status) on every push to `main`. Locally: `npm run status`.
- Every task names the **files it owns**. Don't touch files owned by someone else's open task. Ask them in the chat. Ownership map: [`docs/OWNERSHIP.md`](../docs/OWNERSHIP.md).

## Line format (the status script parses this, so keep it exact)
```
- [ ] **K02** · P0 · Short title · `paths/owned/**` · due Wed 10:00 · #mvp #honesty
```
| Part | Meaning |
|---|---|
| `[ ]` `[~]` `[x]` `[!]` | todo · doing · done · blocked |
| `**K02**` | ID: K = Krishna, Z = Zedan, A = Avighna |
| `P0` / `P1` / `P2` / `DAY` / `PRES` | P0 = demo spine (must work) · P1 = differentiator · P2 = polish · DAY = Thursday · PRES = presentation |
| `` `paths` `` | the files this task owns (optional) |
| `due …` | target time, Dubai |
| `#tags` | rubric criteria it earns: `#mvp` (15) `#research` (12) `#honesty` (10) `#dayof` (8) `#ux` (8) `#pres` (12) `#deck` (30) `#quiz` (5) |

Indented lines under a task are notes or acceptance criteria. The script ignores them.
