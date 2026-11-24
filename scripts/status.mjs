#!/usr/bin/env node
/**
 * Generates docs/STATUS.md from tasks/*.md (+ build results). No dependencies.
 * Usage: node scripts/status.mjs [--build=success|failure|skipped] [--typecheck=success|failure|skipped]
 * CI (.github/workflows/status.yml) runs this on every push to main; locally run `npm run status` or `npm run check`.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));

const PEOPLE = { krishna: "Krishna Mathur", zedan: "Zedan Nasir Parol", avighna: "Avighna Gavhane" };
const RUBRIC = [
  ["mvp", "Working MVP", 15], ["research", "Research & citation features", 12], ["honesty", "Honesty & verification in action", 10],
  ["dayof", "Day-of requirements", 8], ["ux", "User experience", 8], ["pres", "Presentation & Q&A", 12], ["deck", "Phase 1 deck", 30], ["quiz", "AI quiz", 5],
];
const DEADLINES = [
  ["Deck upload (team target)", "2026-11-25T23:00:00+04:00"],
  ["Deck upload (official, hard)", "2026-11-26T09:00:00+04:00"],
  ["Arrive at the Simulation Lab", "2026-11-26T13:15:00+04:00"],
  ["Phase 2 submissions close", "2026-11-26T15:00:00+04:00"],
];
const STATE = { " ": "todo", "~": "doing", x: "done", X: "done", "!": "blocked" };
const LINE = /^- \[([ xX~!])\] \*\*([A-Z]\d+)\*\* · ([A-Z0-9]+) · (.+)$/;

/* ---------- parse tasks ---------- */
const tasks = [];
for (const file of readdirSync(join(ROOT, "tasks")).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const who = file.replace(".md", "");
  const lines = readFileSync(join(ROOT, "tasks", file), "utf8").split("\n");
  lines.forEach((l, i) => {
    const m = l.match(LINE);
    if (!m) return;
    const rest = m[4];
    const tags = [...rest.matchAll(/#(\w+)/g)].map((x) => x[1]);
    const due = (rest.match(/ · due ([^·#]+)/) || [])[1]?.trim() || "";
    const title = rest.split(" · ")[0].trim();
    const note = (lines[i + 1] || "").trim().startsWith("blocked:") ? lines[i + 1].trim() : "";
    tasks.push({ who, state: STATE[m[1]], id: m[2], tier: m[3], title, due, tags, note });
  });
}

/* ---------- build info ---------- */
let build = { typecheck: args.typecheck || "not run", build: args.build || "not run", at: "" };
const local = join(ROOT, ".status", "build.json");
if (!args.build && existsSync(local)) build = JSON.parse(readFileSync(local, "utf8"));
const sh = (c) => { try { return execSync(c, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };
const sha = (process.env.GITHUB_SHA || sh("git rev-parse HEAD")).slice(0, 7) || "uncommitted";
const lastCommit = sh("git log -1 --pretty=%an · %s").slice(0, 90);
const live = (existsSync(join(ROOT, "submissions/phase2/LIVE_LINK.md")) && (readFileSync(join(ROOT, "submissions/phase2/LIVE_LINK.md"), "utf8").match(/https?:\/\/\S+/) || [])[0]) || "not deployed yet";

/* ---------- helpers ---------- */
const now = new Date();
const dubai = now.toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const pct = (d, t) => (t ? Math.round((100 * d) / t) : 0);
const bar = (p) => "█".repeat(Math.round(p / 10)) + "░".repeat(10 - Math.round(p / 10));
const icon = { done: "✅", doing: "🔨", todo: "⬜", blocked: "⛔" };
const badge = (s) => (s === "success" ? "🟢 passing" : s === "failure" ? "🔴 failing" : s === "skipped" ? "⚪ skipped" : "⚪ not run");
const count = (list, st) => list.filter((t) => t.state === st).length;
const left = (iso) => { const ms = new Date(iso) - now; if (ms <= 0) return "passed"; const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4); return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`; };

const total = tasks.length, done = count(tasks, "done");
let md = `# 📊 Veracite · live project status

> **Auto-generated** from \`tasks/*.md\` by \`scripts/status.mjs\`. Don't edit by hand: tick your task file and push.
> Last updated **${dubai} (Dubai)** · commit \`${sha}\`${lastCommit ? ` · ${lastCommit}` : ""}

## At a glance
| | |
|---|---|
| **Overall progress** | ${bar(pct(done, total))} **${pct(done, total)}%** (${done}/${total} tasks) |
| **P0 demo spine** | ${bar(pct(count(tasks.filter((t) => t.tier === "P0"), "done"), tasks.filter((t) => t.tier === "P0").length))} ${count(tasks.filter((t) => t.tier === "P0"), "done")}/${tasks.filter((t) => t.tier === "P0").length} |
| **Build** | Type-check ${badge(build.typecheck)} · Production build ${badge(build.build)}${build.at ? ` · ${build.at}` : ""} |
| **Live link** | ${live} |
| **In progress / blocked** | ${count(tasks, "doing")} 🔨 · ${count(tasks, "blocked")} ⛔ |

## ⏱️ Deadlines
| What | When (Dubai) | Time left |
|---|---|---|
${DEADLINES.map(([n, iso]) => `| ${n} | ${new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", hour: "2-digit", minute: "2-digit" })} | **${left(iso)}** |`).join("\n")}

## 👥 By person
| Person | Progress | ✅ | 🔨 | ⬜ | ⛔ |
|---|---|---|---|---|---|
${Object.entries(PEOPLE).map(([k, n]) => { const l = tasks.filter((t) => t.who === k); return `| [${n}](../tasks/${k}.md) | ${bar(pct(count(l, "done"), l.length))} ${pct(count(l, "done"), l.length)}% | ${count(l, "done")} | ${count(l, "doing")} | ${count(l, "todo")} | ${count(l, "blocked")} |`; }).join("\n")}

## 🎯 Readiness by judging criterion (out of 100)
*Share of tasks tagged with each criterion that are done. A progress signal, not a predicted score.*
| Criterion | Points | Readiness |
|---|---|---|
${RUBRIC.map(([tag, n, pts]) => { const l = tasks.filter((t) => t.tags.includes(tag)); return `| ${n} | ${pts} | ${l.length ? `${bar(pct(count(l, "done"), l.length))} ${pct(count(l, "done"), l.length)}% (${count(l, "done")}/${l.length})` : "n/a"} |`; }).join("\n")}

## 🔨 Doing now
${tasks.filter((t) => t.state === "doing").map((t) => `- **${t.id}** ${t.title} · ${PEOPLE[t.who]}${t.due ? ` · due ${t.due}` : ""}`).join("\n") || "_Nothing marked in progress._"}

## ⛔ Blocked
${tasks.filter((t) => t.state === "blocked").map((t) => `- **${t.id}** ${t.title} · ${PEOPLE[t.who]}${t.note ? ` · ${t.note}` : ""}`).join("\n") || "_Nothing blocked._"}

## 📋 Remaining (by person)
${Object.entries(PEOPLE).map(([k, n]) => { const l = tasks.filter((t) => t.who === k && t.state !== "done"); return `### ${n}\n${l.map((t) => `- ${icon[t.state]} **${t.id}** · ${t.tier} · ${t.title}${t.due ? ` · _due ${t.due}_` : ""}`).join("\n") || "_All done._"}`; }).join("\n\n")}

## ✅ Done
${tasks.filter((t) => t.state === "done").map((t) => `- **${t.id}** ${t.title} · ${PEOPLE[t.who]}`).join("\n") || "_Nothing yet._"}
`;
writeFileSync(join(ROOT, "docs", "STATUS.md"), md);
console.log(`STATUS.md updated · ${done}/${total} done · build ${build.build}`);
