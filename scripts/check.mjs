#!/usr/bin/env node
/** Local "am I green?" check: type-check + production build, record the result, refresh docs/STATUS.md. */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd) => { try { execSync(cmd, { cwd: join(ROOT, "veracite"), stdio: "inherit" }); return "success"; } catch { return "failure"; } };
const typecheck = run("npx tsc --noEmit");
const build = typecheck === "success" ? run("npx next build") : "skipped";
mkdirSync(join(ROOT, ".status"), { recursive: true });
const at = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) + " local";
writeFileSync(join(ROOT, ".status", "build.json"), JSON.stringify({ typecheck, build, at }));
execSync("node scripts/status.mjs", { cwd: ROOT, stdio: "inherit" });
process.exit(typecheck === "success" && build === "success" ? 0 : 1);
