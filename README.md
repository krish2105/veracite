# Veracite

**The AI research assistant that can't make up a reference.**
*Every reference real. Every claim traceable. You stay in charge.*

Team 7 · SP Jain AI Club Hackathon 2026 · Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane

> 📊 **Live status:** [`docs/STATUS.md`](docs/STATUS.md) (auto-updated on every push) · 🌐 **Live link:** see [`submissions/phase2/LIVE_LINK.md`](submissions/phase2/LIVE_LINK.md)

## What it does
Students use AI to find sources, and AI invents references: a real author with the wrong paper, a DOI that doesn't exist. Veracite combines a reference manager with a crew of AI agents (Planner, Scout, Reader, Scribe, Skeptic). They **can only cite records fetched from public registries** (Crossref, OpenAlex, arXiv), and a **code-only Verifier** cross-checks every reference in two registries.
- Every sentence is labelled **Verified · Reported, not checked · AI reasoning · Not found**.
- The student approves the plan, the sources and the claims.
- Export gives you APA 7 (and more), an AI-use statement generated from the logs, and a certificate a professor can re-verify by QR.

## Run it
```bash
npm run setup                                   # install + enable the commit hook
cp veracite/.env.example veracite/.env.local    # add your free Groq / OpenAlex keys
npm run dev                                     # http://localhost:3000
npm run check                                   # type-check + build + refresh STATUS.md
```

## Repo map
| Folder | What |
|---|---|
| `veracite/` | Next.js 16 app · React Three Fiber 3D · Tailwind 4 |
| `docs/` | Research, features, architecture, 3D UI directions, ethics/governance, deck plan, team plan, demo script, Phase 2 playbook, quiz prep, **handoff**, **ownership**, **scoring plan**, **status** |
| `tasks/` | Per-person task lists (source of truth for STATUS.md) |
| `submissions/` | Phase 1 deck (PPTX + PDF + generator), Phase 2 live link and notes, prompt log, quiz |
| `scripts/` | Status generator and local check |

## Honesty notes
- All demo content in previews is labelled **SAMPLE** and uses fictional references (DOI prefix 10.5555 is Crossref's test prefix).
- AI prompts used to build this project are logged in [`docs/PROMPT_LOG.md`](docs/PROMPT_LOG.md), as hackathon rule 8 and SP Jain policy §h(viii) require.
