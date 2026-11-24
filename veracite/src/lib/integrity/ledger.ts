/**
 * Prompt Ledger (task Z04, feature F35).
 *
 * Every prompt sent to an AI model in a session, with the model, time and outcome, exportable as
 * Markdown (to attach to an assignment), CSV (for a spreadsheet) or JSON (machine-readable, with a
 * SHA-256 digest for tamper evidence). Satisfies SP Jain §h(viii) ("identify AI models, tools and
 * prompts") and hackathon rule 8.
 *
 * Built only from receipts with `aiUsed: true` and a `model` (shared `Receipt`, src/lib/types.ts).
 * Prompts are scrubbed for personal data AGAIN here, as a second line of defence after the gateway.
 * `Receipt` has no separate response field, so the ledger shows `detail` as the step's result.
 */

import { isAiCall, type Receipt } from "./receipts";
import { scrubPII } from "./scrub";

export interface LedgerEntry {
  n: number;
  at: string;
  actor: string;
  action: string;
  model: string;
  prompt: string;
  /** From `Receipt.detail`: what the step produced, as logged by the orchestrator. */
  response: string;
  tokens?: { input: number; output: number };
  ms: number;
  ok: boolean;
  /** Personal-data items removed from prompt + response at export time (normally 0). */
  redactedAtExport: number;
}

export interface LedgerMeta {
  title?: string;
  tool?: string;
  timeZone?: string;
  /** ISO timestamp of the export; defaults to now. Pass a fixed value in tests. */
  exportedAt?: string;
  sample?: boolean;
}

export function buildLedger(receipts: Receipt[]): LedgerEntry[] {
  return [...receipts]
    .filter(isAiCall)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((r, i) => {
      const p = scrubPII(r.prompt ?? "");
      const o = scrubPII(r.detail ?? "");
      return {
        n: i + 1,
        at: r.at,
        actor: r.actor,
        action: r.action,
        model: r.model as string,
        prompt: p.text,
        response: o.text,
        tokens: r.tokens,
        ms: r.ms,
        ok: r.ok,
        redactedAtExport: p.total + o.total,
      };
    });
}

function fmtTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso));
}

/** Longest run of backticks in `s`, so a fence can always be one longer. */
function fenceFor(s: string): string {
  const runs = s.match(/`+/g) ?? [];
  const longest = runs.reduce((m, r) => Math.max(m, r.length), 0);
  return "`".repeat(Math.max(3, longest + 1));
}

const MAX_RESPONSE_MD = 600;

export function ledgerToMarkdown(entries: LedgerEntry[], meta: LedgerMeta = {}): string {
  const tz = meta.timeZone ?? "Asia/Dubai";
  const exportedAt = meta.exportedAt ?? new Date().toISOString();
  const models = Array.from(new Set(entries.map((e) => e.model))).sort();
  const lines: string[] = [];
  if (meta.sample) lines.push("> **SAMPLE**: generated from sample data.", "");
  lines.push(`# ${meta.title ?? "Prompt Ledger"}`, "");
  lines.push(
    `Tool: ${meta.tool ?? "Veracite"} · Exported: ${fmtTime(exportedAt, tz)} (${tz}) · ` +
      `${entries.length} AI request${entries.length === 1 ? "" : "s"} · Models: ${models.join(", ") || "none"}`,
    "",
    "Every prompt sent to an AI model during this session, in order. Personal data was removed before sending.",
    "",
  );
  if (entries.length === 0) {
    lines.push("_No AI model was called in this session._");
    return lines.join("\n") + "\n";
  }
  for (const e of entries) {
    const status = e.ok ? "ok" : "failed";
    const tokens = e.tokens !== undefined ? ` · ${e.tokens.input} in / ${e.tokens.output} out tokens` : "";
    lines.push(`## ${e.n}. ${e.actor} · ${e.action}`, "");
    lines.push(`${fmtTime(e.at, tz)} · \`${e.model}\` · ${e.ms} ms${tokens} · ${status}`, "");
    const pf = fenceFor(e.prompt);
    lines.push("**Prompt**", "", pf + "text", e.prompt, pf, "");
    const resp = e.response.length > MAX_RESPONSE_MD ? e.response.slice(0, MAX_RESPONSE_MD) + " …[truncated; full text in the JSON export]" : e.response;
    const rf = fenceFor(resp);
    lines.push("**Response**", "", rf + "text", resp, rf, "");
    if (e.redactedAtExport > 0) lines.push(`_${e.redactedAtExport} personal-data item(s) removed at export._`, "");
  }
  return lines.join("\n");
}

/** Quote a CSV cell; neutralise spreadsheet formulas (=, +, -, @, tab, CR) so opening the file is safe. */
function csvCell(v: unknown): string {
  let s = v === undefined || v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function ledgerToCSV(entries: LedgerEntry[]): string {
  const header = ["n", "at", "actor", "action", "model", "ok", "ms", "tokens_in", "tokens_out", "prompt", "response", "redacted_at_export"];
  const rows = entries.map((e) =>
    [e.n, e.at, e.actor, e.action, e.model, e.ok, e.ms, e.tokens?.input, e.tokens?.output, e.prompt, e.response, e.redactedAtExport].map(csvCell).join(","),
  );
  return [header.join(","), ...rows].join("\r\n") + "\r\n";
}

/** SHA-256 hex of a string (Web Crypto: works in the browser, Edge runtime and Node 20+). */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface LedgerJson {
  format: "veracite.prompt-ledger/1";
  tool: string;
  exportedAt: string;
  sample: boolean;
  entries: LedgerEntry[];
  /** SHA-256 of JSON.stringify(entries). Change any entry and this no longer matches. */
  sha256: string;
}

export async function ledgerToJSON(entries: LedgerEntry[], meta: LedgerMeta = {}): Promise<LedgerJson> {
  return {
    format: "veracite.prompt-ledger/1",
    tool: meta.tool ?? "Veracite",
    exportedAt: meta.exportedAt ?? new Date().toISOString(),
    sample: meta.sample === true,
    entries,
    sha256: await sha256Hex(JSON.stringify(entries)),
  };
}

/** Check that a ledger JSON file has not been edited since export. */
export async function verifyLedgerJSON(doc: LedgerJson): Promise<boolean> {
  return (await sha256Hex(JSON.stringify(doc.entries))) === doc.sha256;
}
