# Instructions for Claude Code (and any AI assistant) working in this repo

This is Team 7's entry for the SP Jain AI Club Hackathon 2026: **Veracite**, an honest AI research assistant. Three people (Krishna, Zedan, Avighna) each run their own sessions, so **staying inside your lane is what keeps us conflict-free.**

## Before you change anything
1. Read `docs/HANDOFF.md`, `docs/OWNERSHIP.md` and the person's task file in `tasks/`.
2. Work on **one task ID at a time**, and **only edit the paths that task owns** (listed in the task line and in OWNERSHIP.md). If you need a change in someone else's file, stop and say so.
3. The app is Next.js **16** (`veracite/`). Its APIs differ from older versions: read the relevant guide in `veracite/node_modules/next/dist/docs/` before writing Next-specific code (see `veracite/AGENTS.md`).

## Hard rules
- **Never add AI attribution** to commits, PRs or code: no `Co-Authored-By:` lines naming Claude or any AI, and no "Generated with Claude Code". Commits are authored by the human running you. (A commit-msg hook also strips these.)
- **Never commit secrets** (`.env.local`, keys) or personal data. Keys live only in `veracite/.env.local`.
- **The AI must never write a reference.** References only come from registry records; the Verifier is deterministic code (see `docs/03_AGENTS_AND_ARCHITECTURE.md`). Don't break this guarantee.
- **Label sample or simulated data as SAMPLE** in the UI (hackathon rule 9).
- **Keep the 3D `<Canvas>` components memoised.** Pass UI state through stores (`veracite/src/components/lab/store.ts`), never through props that re-render the Canvas (it breaks drei ScrollControls).
- Use the free tiers only (Groq, OpenAlex, Crossref, arXiv). No paid services.

## When you finish a task
1. Run `npm run check` from the repo root (type-check + production build + refresh `docs/STATUS.md`). Fix anything red.
2. Tick the task in `tasks/<name>.md` (`[x]`), add a one-line row to `docs/PROMPT_LOG.md` for the prompts used, and show the diff.
3. Commit on a branch named `<name>/<task-id>-short-title`, push, and open a PR into `main`.
