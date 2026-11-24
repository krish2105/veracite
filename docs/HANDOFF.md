# Handoff: pick up the work in 10 minutes

*For Zedan, Avighna, or anyone (or any Claude Code session) joining mid-way.*

## 1. What we're building
**Veracite**: a reference manager with an AI research crew that *cannot* invent references. The AI may plan, search and explain; only public registries (Crossref, OpenAlex, arXiv) may cite; only the student decides. Full story: `docs/00_START_HERE.md`. Points plan: `docs/SCORING_PLAN.md`.

## 2. Where things are
```
docs/            ← all planning docs (00–10), STATUS.md (auto), this file, OWNERSHIP, SCORING_PLAN, PROMPT_LOG
tasks/           ← one task list per person (tick yours; STATUS.md updates itself)
submissions/     ← everything we hand in: phase1 deck, phase2 live link + notes, prompt log, quiz prep
veracite/        ← the Next.js 16 app (React 19, R3F 3D, Tailwind 4)
  src/app/                  routes: / · /research · /xray · /draft · /library · /trust · /certificate · /lab/vault · /lab/neural
  src/components/app/       app shell, tabs, 3D widgets, sample data
  src/components/lab/       the two full-3D concepts (Vault, Neural)
  .env.example              copy to .env.local and paste your own keys (never commit)
scripts/         ← status.mjs (STATUS generator), check.mjs (type-check + build + status)
.githooks/       ← commit-msg hook that strips AI co-author lines
.github/workflows/status.yml ← CI: type-check + build + refresh STATUS.md on every push
```

## 3. First-time setup (once per laptop)
```bash
git clone https://github.com/krish2105/veracite.git
cd veracite
npm run setup                 # installs the app + turns on the commit-msg hook
cp veracite/.env.example veracite/.env.local   # then paste your keys into .env.local
npm run dev                   # http://localhost:3000
```

## 4. Current state (24 Nov, ~12:00 Dubai)
| Area | State |
|---|---|
| Docs, research, deck | ✅ Done. The deck PDF is ready in `submissions/phase1/` |
| 3D concepts | ✅ `/lab/vault` and `/lab/neural` work (Hybrid chosen: Vault landing + Neural Mission Control, Watermark colours) |
| App tabs | 🟡 All 6 tabs exist as **UI previews with SAMPLE data**. No real API calls yet |
| Real MVP (registries, Verifier, agents, library, export) | ⬜ Not started: see `tasks/*.md` |
| Deploy | ⬜ Not deployed. Vercel project to be created (K02/K07) |
| Known gotcha | R3F re-connects events on every `<Canvas>` render, which breaks drei `ScrollControls`. Keep Canvas components memoised and pass UI state through stores (`src/components/lab/store.ts`) |

Live progress: **`docs/STATUS.md`**.

## 5. How we work
- **Branch per task:** `krishna/K03-registries`, `zedan/Z01-golden-set`, `avighna/A03-landing`. Open a PR into `main`; small and often.
- **Before pushing:** `npm run check` (type-check + build + status). CI does the same on GitHub.
- **Tick your task** in `tasks/<you>.md` (`[~]` doing, `[x]` done, `[!]` blocked + `blocked:` note).
- **Log every AI prompt** you use for the hackathon in `docs/PROMPT_LOG.md` (rule 8: we must submit it).
- **Label any sample/simulated content as SAMPLE** (rule 9). Never commit personal data or keys.
- **No AI co-author lines in commits.** The hook removes them automatically; please don't add them.

## 6. Using Claude Code on this repo
Open the repo folder in Claude Code. It reads `CLAUDE.md` automatically. Start with:
> "Read CLAUDE.md, docs/HANDOFF.md and tasks/<your-name>.md. Do task <ID> only, stay inside the paths that task owns, run `npm run check`, then tick the task and show me the diff."

## 7. Contacts and decisions
Decisions are logged in the team chat as "DECIDED: …". Organiser questions: Aftaab Kazi or Rakshanda Dhote (numbers in the rules PDF, which is not in the repo).
