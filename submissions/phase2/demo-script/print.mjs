#!/usr/bin/env node
// Print the demo script to A4 PDF with headless Chrome (no dependencies).
//   node submissions/phase2/demo-script/print.mjs
// Uses the brand fonts installed on this machine (Archivo, Archivo Expanded, Literata, Martian Mono; Google Fonts, OFL).
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = pathToFileURL(join(here, "script.html")).href;
const out = join(here, "..", "Team7_Demo_Script.pdf");
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const r = spawnSync(chrome, ["--headless=new", "--no-pdf-header-footer", "--disable-gpu", "--run-all-compositor-stages-before-draw", "--virtual-time-budget=4000", `--print-to-pdf=${out}`, src], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log("wrote", out);
