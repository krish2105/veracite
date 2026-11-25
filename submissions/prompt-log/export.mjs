#!/usr/bin/env node
// Export the prompt log for submission (hackathon rule 8, task Z13). Run from the repo root:
//   node submissions/prompt-log/export.mjs
// 1. Redaction gate: scans docs/PROMPT_LOG.md with Veracite's own PII scrubber and STOPS if it finds
//    emails, phone numbers, Emirates IDs, student IDs, cards, IBANs or API keys/tokens.
// 2. Writes submissions/prompt-log/Team7_Prompt_Log.html (printable) and, if Chrome or Edge is
//    installed, Team7_Prompt_Log.pdf next to it.
// No dependencies. Uses Node 24's TypeScript support to load the scrubber.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const SRC = join(ROOT, "docs", "PROMPT_LOG.md");
const HTML = join(HERE, "Team7_Prompt_Log.html");
const PDF = join(HERE, "Team7_Prompt_Log.pdf");

const { findPII } = await import(pathToFileURL(join(ROOT, "veracite", "src", "lib", "integrity", "scrub.ts")).href);
const md = readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");

// ---------- 1. redaction gate ----------
// Fake addresses used as test data in the log (example.com / example.org) are allowed on purpose.
const ALLOWED = /@example\.(com|org|net)\b|@example\.ac\.ae\b/i;
const hits = findPII(md).filter((s) => !(s.kind === "email" && ALLOWED.test(md.slice(s.start, s.end))));
if (hits.length) {
  console.error(`✖ Redaction check failed: ${hits.length} item(s) look like personal data or secrets.`);
  for (const h of hits) {
    const line = md.slice(0, h.start).split("\n").length;
    console.error(`  line ${line}: ${h.kind}`); // never print the value itself
  }
  console.error("Remove or redact them in docs/PROMPT_LOG.md, then run this again.");
  process.exit(1);
}
console.log("✓ Redaction check passed (no emails, phone numbers, IDs, cards or keys).");

// ---------- 2. Markdown → HTML (just what the log uses: headings, tables, lists, quotes, inline marks) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  const codes = [];
  let t = esc(s).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  t = t
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, href) => `<a href="${href.replace(/"/g, "&quot;")}">${txt}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s.,;:)]|$)/g, "$1<em>$2</em>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}
const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

const out = [];
const lines = md.split("\n");
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l.trim()) continue;
  if (/^---+$/.test(l.trim())) { out.push("<hr>"); continue; }
  const h = l.match(/^(#{1,4})\s+(.*)$/);
  if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
  if (l.trim().startsWith("|") && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
    const head = cells(l);
    i++;
    const body = [];
    while (lines[i + 1]?.trim().startsWith("|")) body.push(cells(lines[++i]));
    if (body.length === 0) continue; // an empty template table
    out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    continue;
  }
  if (/^\s*[-*]\s+/.test(l)) {
    const items = [l];
    while (lines[i + 1] && /^\s*[-*]\s+/.test(lines[i + 1])) items.push(lines[++i]);
    out.push(`<ul>${items.map((x) => `<li>${inline(x.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`);
    continue;
  }
  if (l.startsWith(">")) { out.push(`<blockquote>${inline(l.replace(/^>\s?/, ""))}</blockquote>`); continue; }
  out.push(`<p>${inline(l)}</p>`);
}

const rows = (md.match(/^\| \d+ \|/gm) ?? []).length;
const exportedAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Dubai" }).format(new Date());
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Team 7 · Veracite · Prompt log</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font: 10.5px/1.45 "Segoe UI", system-ui, sans-serif; color: #0e2a23; background: #fff; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 6px; } h2 { font-size: 14px; margin: 14px 0 6px; } h3 { font-size: 12px; }
  .meta { color: #41574f; margin: 0 0 10px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 6px 0 12px; }
  th, td { border: 1px solid #c9d6d0; padding: 4px 5px; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
  th { background: #eef4f1; font-weight: 600; }
  th:nth-child(1), td:nth-child(1) { width: 3%; } th:nth-child(2), td:nth-child(2) { width: 9%; }
  th:nth-child(3), td:nth-child(3) { width: 6%; } th:nth-child(4), td:nth-child(4) { width: 11%; }
  th:nth-child(5), td:nth-child(5) { width: 33%; } th:nth-child(6), td:nth-child(6) { width: 22%; }
  tr { break-inside: avoid; }
  code { font: 9.5px Consolas, monospace; background: #f2f5f4; padding: 0 2px; }
  blockquote { margin: 6px 0; padding-left: 8px; border-left: 3px solid #c9d6d0; color: #41574f; }
  a { color: #0e5c46; }
</style></head><body>
<p class="meta">Team 7 · Veracite · SP Jain AI Club Hackathon 2026 · Record of AI prompts (rule 8) · ${rows} entries · exported ${exportedAt} (Dubai) · source: docs/PROMPT_LOG.md · redaction check passed</p>
${out.join("\n")}
</body></html>
`;
writeFileSync(HTML, html);
console.log(`✓ ${rows} prompt entries → submissions/prompt-log/Team7_Prompt_Log.html`);

// ---------- 3. PDF via headless Chrome / Edge ----------
const browsers = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = browsers.find((b) => existsSync(b));
if (!browser) {
  console.log("No Chrome/Edge found: open the .html file in a browser and print it to PDF.");
} else {
  execFileSync(browser, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${PDF}`, pathToFileURL(HTML).href], { stdio: "ignore", timeout: 60000 });
  console.log(existsSync(PDF) ? "✓ PDF → submissions/prompt-log/Team7_Prompt_Log.pdf" : "✖ PDF was not created; print the .html to PDF by hand.");
}
