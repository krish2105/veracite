# Live link and submission links

Production URL: https://veracite.vercel.app

*(STATUS.md reads the first URL in this file, so keep the production URL on the line above.)*

## What we submit (Thursday 26 Nov, by 15:00)
| Item | Link or file |
|---|---|
| Live app | https://veracite.vercel.app |
| Source code (public) | https://github.com/krish2105/veracite |
| Prompt log (rule 8) | [`submissions/prompt-log/Team7_Prompt_Log.pdf`](../prompt-log/Team7_Prompt_Log.pdf) · living source: [`docs/PROMPT_LOG.md`](../../docs/PROMPT_LOG.md) |
| Phase 1 deck | [`submissions/phase1/Team7_Veracite_Phase1_Deck.pdf`](../phase1/Team7_Veracite_Phase1_Deck.pdf) |
| Day-of requirements and how we met them | [`DAY_OF_NOTES.md`](DAY_OF_NOTES.md) |

## Try it in two minutes (no account, no install)
1. Open **Reference X-ray** (`/xray`) → **Load test list** → **X-ray**. The test list is labelled and includes deliberate fakes: watch them come back *Chimera*, *Not found* or *Retracted*, never *Verified*.
2. **Add to my list** on a verified paper → open **Library** (`/library`) → export **APA 7**. The export gate asks you to confirm before the file downloads, and adds an AI-use statement written from the log.
3. Open **Trust Center** (`/trust`) for the measured results on 51 test references, and **Certificate** (`/certificate`) for a QR link that re-checks a bibliography live.

## For other tools and AI assistants
- `GET /api/v1/verify?doi=…` or `?ref=…` returns Veracite's verdict as JSON, and `POST /api/mcp` is an MCP server with one tool, `verify_reference`, so an AI can check a reference before it cites it. Details: [`docs/API.md`](../../docs/API.md).

## Health and modes
- `https://veracite.vercel.app/api/health` reports the registries (Crossref, OpenAlex, arXiv) and whether the AI agents are on.
- **Rules mode:** if no AI key is set, or the AI is switched off or unavailable, every reference check still runs. Those checks are deterministic code; the AI never writes a reference.

## Demo safety (Thursday)
- **Before 11:00 and again at ~12:20:** `node scripts/prewarm.mjs` opens every page and runs the exact demo checks once (X-ray test list, research searches, one-click save, web check). 13/13 on Wed 25 Nov, 23:40.
- **If Wi-Fi or the AI is slow during the demo:** Research → **No Wi-Fi or AI? Show the SAMPLE session**. It replays a real recorded session under a SAMPLE banner and never touches the list. *Record it once the AI keys are in:* run the demo question live, open `/research?record=1`, press **Copy this session for the SAMPLE fallback**, paste it into `veracite/src/components/app/tabs/research/sampleSession.ts`.
- **If a step fails:** the banner says which step, what happened and what to do, with **Try again**. Setting AI autonomy to Off keeps every reference check running.
- **Measured on the live site** (Wed 25 Nov, 23:50): same results as the committed run: 11/11 fakes caught, 0 fakes marked Verified, 30/30 real, 5/5 retractions, web 3/5; median 0.66 s per reference with network latency (0.46 s locally). File: `veracite/tests/results/live-site.md`.

## Deploy notes (team)
- Vercel project root directory: `veracite`. Every merge to `main` deploys to production.
- Environment variables on Vercel: everything in `veracite/.env.example` (values only in your own `.env.local`, never in the repo).
- Rollback: Vercel → Deployments → previous deployment → **Promote to Production**.
- Before submitting: `node submissions/phase2/smoke.mjs` (15 live checks) and `node submissions/prompt-log/export.mjs` (prompt log → HTML + PDF, with a personal-data check).
