# Prompt log (hackathon rule 8)

The living log is [`../../docs/PROMPT_LOG.md`](../../docs/PROMPT_LOG.md). Everyone adds their prompts there as they go.

**Before submitting (Thursday ~14:55, Zedan):** export it as a PDF next to this file:
```bash
node submissions/prompt-log/export.mjs    # from the repo root; no installs needed
```
It first runs Veracite's own PII scrubber over the whole log and **refuses to export** if it finds an email, phone number, Emirates ID, student ID, card, IBAN or API key (it prints the line number and kind, never the value). Then it writes `Team7_Prompt_Log.html` and, using Chrome or Edge, `Team7_Prompt_Log.pdf`. Fake test addresses on `example.com` are allowed.

Last export: Thu 26 Nov 08:01, 85 entries, redaction check passed. **Re-run it on Thursday after the Phase 2 prompts are added.**
Redaction rule: no team code, passwords, API keys, phone numbers or other personal data.
