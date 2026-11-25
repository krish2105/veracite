/**
 * Web-source check (task Z16, feature F12, docs/03 §3 "Partial").
 *
 * For a reference that is a web page (no DOI): is the URL live, is there a Wayback Machine copy,
 * what is the page's title, and what APA 7 retrieval line should the student use?
 *
 * Status rule (docs/03): a web page without a DOI can be at most **partial** (found as a live or
 * archived URL only); if it is neither live nor archived it is **notfound**. Never "verified".
 *
 * Safety: the server fetches a URL the user typed, so this is a server-side request forgery risk.
 * Only http(s) on ports 80/443, hostnames that resolve to public addresses only, redirects followed
 * by hand with every hop re-checked, 8 s timeouts, and at most 256 KB read.
 */
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { RefStatus } from "@/lib/types";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 256 * 1024;
const MAX_REDIRECTS = 5;
const UA = "Veracite/0.1 (web source check; +https://github.com/krish2105/veracite)";

export interface LiveResult {
  /** HTTP status of the final response, or 0 if the page could not be reached. */
  status: number;
  ok: boolean;
  finalUrl?: string;
  title?: string;
  error?: string;
}

export interface ArchiveResult {
  available: boolean;
  /** Snapshot URL on web.archive.org. */
  url?: string;
  /** ISO date of the snapshot. */
  capturedAt?: string;
}

export interface WebCheck {
  url: string;
  status: Extract<RefStatus, "partial" | "notfound">;
  live: LiveResult;
  archive: ArchiveResult;
  /** ISO timestamp of this check (the APA retrieval date). */
  accessedAt: string;
  /** e.g. "Retrieved November 25, 2026, from https://…" */
  retrieval: string;
  /** Link the student can open to ask the Wayback Machine to save the page now. */
  saveUrl: string;
  reasons: string[];
}

// ---------- URL safety ----------

/** True for loopback, private, link-local, CGNAT, multicast, reserved and unspecified addresses. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
    if (s === "::" || s === "::1") return true;
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s);
  }
  return true; // not an IP at all → treat as unsafe
}

export type SafeUrl = { ok: true; url: URL } | { ok: false; reason: string };

/** Syntax-level checks (no network). */
export function parsePublicUrl(input: string): SafeUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, reason: "That is not a valid web address." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, reason: "Only http and https links can be checked." };
  if (url.username || url.password) return { ok: false, reason: "Links with a username or password are not checked." };
  if (url.port && url.port !== "80" && url.port !== "443") return { ok: false, reason: "Only standard web ports (80, 443) are checked." };
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) {
    return { ok: false, reason: "Private or local addresses are not checked." };
  }
  if (isIP(host) && isPrivateAddress(host)) return { ok: false, reason: "Private or local addresses are not checked." };
  return { ok: true, url };
}

export type Resolver = (host: string) => Promise<string[]>;
const dnsResolver: Resolver = async (host) => (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);

/** Syntax checks + DNS: every address the host resolves to must be public. */
export async function assertPublicUrl(input: string, resolve: Resolver = dnsResolver): Promise<URL> {
  const parsed = parsePublicUrl(input);
  if (!parsed.ok) throw new Error(parsed.reason);
  const host = parsed.url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return parsed.url;
  let addrs: string[];
  try {
    addrs = await resolve(host);
  } catch {
    throw new Error("That website's address could not be found.");
  }
  if (addrs.length === 0 || addrs.some(isPrivateAddress)) throw new Error("Private or local addresses are not checked.");
  return parsed.url;
}

// ---------- fetching ----------

type Fetch = typeof fetch;

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, MAX_BYTES));
  let off = 0;
  for (const c of chunks) {
    const n = Math.min(c.length, buf.length - off);
    buf.set(c.subarray(0, n), off);
    off += n;
    if (off >= buf.length) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Page title from og:title, then <title>. Plain text, trimmed, at most 300 characters. */
export function extractTitle(html: string): string | undefined {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
  const t = og ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!t) return undefined;
  const clean = decodeEntities(t.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 300) : undefined;
}

/** Fetch a page, following redirects by hand so every hop is re-checked for safety. */
export async function checkLive(input: string, deps: { fetch?: Fetch; resolve?: Resolver } = {}): Promise<LiveResult> {
  const f = deps.fetch ?? fetch;
  let current: URL;
  try {
    current = await assertPublicUrl(input, deps.resolve);
  } catch (e) {
    return { status: 0, ok: false, error: (e as Error).message };
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await f(current.toString(), {
        redirect: "manual",
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      return { status: 0, ok: false, finalUrl: current.toString(), error: timedOut ? "The page did not respond in time." : "The page could not be reached." };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel().catch(() => {});
      try {
        current = await assertPublicUrl(new URL(res.headers.get("location")!, current).toString(), deps.resolve);
      } catch (e) {
        return { status: res.status, ok: false, finalUrl: current.toString(), error: (e as Error).message };
      }
      continue;
    }
    const type = res.headers.get("content-type") ?? "";
    const title = res.ok && /html/i.test(type) ? extractTitle(await readCapped(res)) : (await res.body?.cancel().catch(() => {}), undefined);
    return { status: res.status, ok: res.ok, finalUrl: current.toString(), title };
  }
  return { status: 0, ok: false, finalUrl: current.toString(), error: "Too many redirects." };
}

/** Closest Wayback Machine snapshot (archive.org availability API). Never throws. */
export async function checkWayback(url: string, deps: { fetch?: Fetch } = {}): Promise<ArchiveResult> {
  const f = deps.fetch ?? fetch;
  try {
    const res = await f(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { available: false };
    const j = (await res.json()) as { archived_snapshots?: { closest?: { available?: boolean; url?: string; timestamp?: string; status?: string } } };
    const c = j.archived_snapshots?.closest;
    if (!c?.available || !c.url || (c.status && !c.status.startsWith("2"))) return { available: false };
    const ts = c.timestamp ?? "";
    const capturedAt = /^\d{14}$/.test(ts) ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z` : undefined;
    return { available: true, url: c.url.replace(/^http:/, "https:"), capturedAt };
  } catch {
    return { available: false };
  }
}

// ---------- verdict + APA ----------

/** APA 7 retrieval line for an undated or changing web page. */
export function apaRetrieval(url: string, accessedAt: string): string {
  const d = new Date(accessedAt);
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Dubai" }).format(d);
  return `Retrieved ${date}, from ${url}`;
}

export function webVerdict(live: LiveResult, archive: ArchiveResult): { status: WebCheck["status"]; reasons: string[] } {
  const reasons: string[] = [];
  if (live.ok) reasons.push(`The page is live (HTTP ${live.status})${live.title ? `: "${live.title}"` : ""}.`);
  else reasons.push(live.error ?? `The page did not load (HTTP ${live.status}).`);
  if (archive.available) reasons.push(`The Wayback Machine has a copy${archive.capturedAt ? ` from ${archive.capturedAt.slice(0, 10)}` : ""}.`);
  else reasons.push("No Wayback Machine copy was found.");
  if (live.ok || archive.available) {
    reasons.push("A web page has no DOI or registry record, so it can only be Partial: check the author, date and content yourself.");
    return { status: "partial", reasons };
  }
  return { status: "notfound", reasons };
}

/** Full check for one URL. */
export async function checkWebSource(url: string, deps: { fetch?: Fetch; resolve?: Resolver; now?: () => string } = {}): Promise<WebCheck> {
  const accessedAt = (deps.now ?? (() => new Date().toISOString()))();
  const [live, archive] = await Promise.all([checkLive(url, deps), checkWayback(url, deps)]);
  const { status, reasons } = webVerdict(live, archive);
  return {
    url,
    status,
    live,
    archive,
    accessedAt,
    retrieval: apaRetrieval(url, accessedAt),
    saveUrl: `https://web.archive.org/save/${url}`,
    reasons,
  };
}
