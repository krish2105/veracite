# Contributing (Team 7)

1. **Pull before you start:** `git checkout main && git pull`.
2. **Branch per task:** `git checkout -b zedan/Z01-golden-set`.
3. **Stay in your lane:** only files your task owns (`docs/OWNERSHIP.md`).
4. **Check before you push:** `npm run check`. It must end green.
5. **Tick your task** in `tasks/<you>.md`, and log your AI prompts in `docs/PROMPT_LOG.md`.
6. **Commit and push:** `git commit -m "Z01: golden set (30 real, 20 fake, 10 chimeras)"` → `git push -u origin HEAD` → open a PR into `main` (`gh pr create --fill`).
7. **Merge** when CI is green and (for shared files) the others gave a 👍. After merge, CI refreshes `docs/STATUS.md` automatically.

**Commit messages:** start with the task ID (`K03: …`). No AI co-author trailers; the `.githooks/commit-msg` hook removes them (run `npm run setup` once to enable it).

**Freeze rules on Thursday:** no feature merges after 11:00; Phase 2 work only on `phase2/*` branches; only Krishna merges and deploys; nothing after 14:55.
