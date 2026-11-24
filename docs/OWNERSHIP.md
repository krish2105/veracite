# File ownership: who may edit what (prevents merge conflicts)

Rule: **edit only files you own.** To change someone else's file, message them or open a PR that they review. Shared files need a 👍 from everyone before merging.

| Path | Owner | Notes |
|---|---|---|
| `veracite/src/lib/registries/**` | **Krishna** | Crossref, OpenAlex, arXiv clients |
| `veracite/src/lib/verify/**` | **Krishna** | Deterministic Verifier (tests use Zedan's golden set) |
| `veracite/src/lib/llm/**`, `veracite/src/lib/agents/**`, `veracite/src/lib/session/**` | **Krishna** | LLM gateway, agents, orchestrator |
| `veracite/src/app/api/sources/**`, `api/agents/**`, `api/draft/**`, `api/v1/**` | **Krishna** | Server routes |
| `veracite/src/components/app/tabs/research/**`, `tabs/xray/**`, `tabs/draft/**` (except `tabs/draft/Writer.tsx`) | **Krishna** | Wiring tabs to real data |
| `veracite/src/lib/types.ts`, `veracite/src/lib/flags.ts` | **Krishna** | Shared contracts (K18). Others import them; ask before changing a type |
| `veracite/next.config.ts`, `veracite/package.json`, Vercel settings | **Krishna** | Ask before adding dependencies |
| `veracite/tests/**` (golden set, eval runner, results) | **Zedan** | |
| `veracite/src/lib/integrity/**` | **Zedan** | AI-use statement, ledger, PII scrubber, injection detector, certificate, paraphrase, bias |
| `veracite/src/components/app/tabs/trust/**`, `tabs/certificate/**`, `components/app/ExportGate.tsx` | **Zedan** | Export gate = Z15 |
| `veracite/src/app/api/sources/wayback/**` | **Zedan** | Z16 (moved from K12) |
| `docs/05_ETHICS_GOVERNANCE_GUARDRAILS.md`, `docs/PROMPT_LOG.md`, `submissions/prompt-log/**` | **Zedan** | Everyone *adds* prompt rows; Zedan curates |
| `veracite/src/app/page.tsx`, `veracite/src/components/lab/**` | **Avighna** | Landing (Vault 3D) + 3D concepts |
| `veracite/src/app/app.css`, `veracite/src/app/globals.css`, `components/app/AppShell.tsx`, `components/app/ui.tsx` | **Avighna** | Design system |
| `veracite/src/components/app/three/**`, `tabs/library/**`, `veracite/src/lib/library/**`, `veracite/src/lib/cite/**`, `api/export/**` | **Avighna** | 3D, library, export |
| `veracite/src/components/app/tabs/draft/Writer.tsx`, `veracite/src/app/save/**` | **Avighna** | Write & cite (A14), one-click save (A15) |
| `veracite/src/lib/i18n/**`, `components/app/CommandPalette.tsx`, `veracite/src/lib/pdf/**` | **Avighna** | |
| `submissions/phase1/**`, `docs/04_*`, `docs/06_*`, `docs/08_*` | **Avighna** | Deck + demo |
| `tasks/<name>.md` | **that person only** | |
| `docs/STATUS.md` | **the bot** | Generated; never edit by hand |
| `veracite/src/components/app/data.ts` (sample data), `README.md`, `CLAUDE.md`, `docs/HANDOFF.md` | **Shared** | Change via PR with a 👍 from the other two |

**K01 split the tabs:** each tab now lives in `veracite/src/components/app/tabs/<tab>/` (`<Tab>Tab.tsx` + `index.ts`), and each page imports its own folder, e.g. `@/components/app/tabs/trust`. Add new files inside your own tab folder; there is no shared barrel file to edit.
