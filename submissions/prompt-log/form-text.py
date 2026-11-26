"""docs/PROMPT_LOG.md → the plain "Prompt N:" text the Phase 2 submission form asks for. Run from the repo root."""
import re
rows = []
for l in open("docs/PROMPT_LOG.md").read().split("\n"):
    if not re.match(r"^\| \d+ \|", l):
        continue
    c = [x.strip() for x in l.strip().strip("|").split(" | ")]
    if len(c) < 6:
        c = [x.strip() for x in l.strip().strip("|").split("|")]
    rows.append((int(c[0]), c[1], c[2], c[3], c[4], c[5] if len(c) > 5 else "", c[6] if len(c) > 6 else ""))
rows.sort(key=lambda r: r[0])
out = ["Team 7 · Veracite · prompt log (every prompt in order, including the ones that did not work). Full table with results: https://github.com/krish2105/veracite/blob/main/docs/PROMPT_LOG.md", ""]
for n, when, who, tool, prompt, result, kept in rows:
    out.append(f"Prompt {n} ({when}, {who}, {tool}):\n{prompt}\nResult: {result}{(' [' + kept + ']') if kept else ''}\n")
open("submissions/prompt-log/Team7_Prompt_Log_for_form.txt", "w").write("\n".join(out))
print(len(rows), "prompts")
