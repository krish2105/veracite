"""docs/PROMPT_LOG.md → the text the Phase 2 submission form asks for. Run from the repo root.
Every prompt is printed exactly as it was typed (typos included); only the grouping and the headings are added here."""
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

PHASES = [
    ("PHASE A · Research, rules and planning (24 Nov)", "Read the brief and rubric, researched the problem, chose the design, wrote the plan and the Phase 1 deck before any code."),
    ("PHASE B · Building the MVP (25 Nov)", "One task per prompt and per branch: registries, the code Verifier, the agents, the library, exports, the test set. Tests first; a human approved every merge."),
    ("PHASE C · Live AI, testing and fixes (26 Nov, before 09:00)", "Turned the AI on, ran real sessions, measured results on the live site and fixed what the runs showed."),
    ("PHASE D · Audit and demo preparation (26 Nov, 09:00 to 13:30)", "End-to-end audit against the rules, deploy backup, demo script, judges' questions, rehearsal plan."),
    ("PHASE E · Phase 2 day-of requirements (26 Nov, from 13:30)", "Ran the judges' test pack first to see what failed, then fixed by general rule (never for one reference), tested beyond the pack, and checked that every link opens."),
]
def phase_of(when, prev):
    if "24 Nov" in when: return 0
    if "25 Nov" in when: return 1
    m = re.search(r"26 Nov 2026,\s*~?(\d{1,2}):(\d{2})", when)
    if not m: return prev
    t = int(m.group(1)) * 60 + int(m.group(2))
    return 2 if t < 9 * 60 else 3 if t < 13 * 60 + 30 else 4

out = [
    "TEAM 7 · VERACITE · PROMPT LOG",
    "Every prompt we used, in order, exactly as typed, including the ones that did not work. Full table: https://github.com/krish2105/veracite/blob/main/docs/PROMPT_LOG.md",
    "",
    "HOW WE WORKED WITH AI",
    "1. One task per prompt. Each task had its own branch and pull request, and a human approved every merge.",
    "2. The AI never decides what is true. References come only from Crossref, OpenAlex and arXiv records; the Verifier is code, and its results are unit-tested.",
    "3. Test first, then fix. We ran the real thing (our 51-reference set, live AI sessions, today's test pack), read what failed, and only then asked for a fix.",
    "4. Fix by rule, never for one example. Each fix has a test that uses different references.",
    "5. Failures stay in the log. Results marked Changed or Dropped, and notes such as 'one wrong first attempt', are prompts that did not work the first time.",
    "6. Tools: Claude Code (Claude Opus 5.5 and Fable 5.2) for building; the app itself runs free Groq models (gpt-oss, Qwen).",
    "",
]
# Rows were numbered as each person added them, so a few are out of time order. Group them by phase (time), then number.
prev = 0; tagged = []
for r in rows:
    prev = phase_of(r[1], prev); tagged.append((prev, r))
tagged.sort(key=lambda x: (x[0], x[1][0]))
cur = None
for ph, (n, when, who, tool, prompt, result, kept) in tagged:
    if ph != cur:
        cur = ph
        out += ["=" * 60, PHASES[ph][0], PHASES[ph][1], "=" * 60, ""]
    out.append(f"Prompt {n} · {when} · {who} · {tool}\nPrompt (as typed): {prompt}\nWhat came back: {result}{(' [' + kept + ']') if kept else ''}\n")
open("submissions/prompt-log/Team7_Prompt_Log_for_form.txt", "w").write("\n".join(out))
print(len(rows), "prompts,", sum(len(x) + 1 for x in out), "characters")
