/**
 * Polite HTTP for the registries (K03).
 * - One limiter per endpoint class, so we stay inside each registry's published limits.
 * - 8 s timeout, one retry on 429 / 5xx / timeout.
 * - Caching through Next's fetch data cache (`next.revalidate`), which persists across Vercel instances and
 *   deploys. That is what lets us pre-warm the demo queries on Thursday morning. (`"use cache"` would not:
 *   its default store is per-instance memory on serverless.) Outside Next, e.g. in tests, `next` is ignored.
 * - Identical requests already in flight share one network call.
 */
import type { RegistryName, SearchReceipt } from "../types";

export const CACHE_SECONDS = 60 * 60 * 24;
const TIMEOUT_MS = 8000;

export class RegistryError extends Error {
  constructor(
    public registry: RegistryName,
    public kind: "rate_limited" | "upstream_down" | "timeout" | "bad_response",
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

/** What every registry call returns: the data plus a receipt of what was searched (for honest "Not found"). */
export interface RegistryResult<T> {
  data: T;
  receipt: SearchReceipt;
}

export function receipt(registry: RegistryName, query: string, hits: number): SearchReceipt {
  return { registry, query, hits, at: new Date().toISOString() };
}

/** At most `concurrency` calls at once, and at least `minIntervalMs` between call starts. */
export function createLimiter(concurrency: number, minIntervalMs: number) {
  let active = 0;
  let lastStart = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const queue: (() => void)[] = [];
  const pump = () => {
    if (timer || active >= concurrency || queue.length === 0) return;
    const wait = lastStart + minIntervalMs - Date.now();
    if (wait > 0) {
      timer = setTimeout(() => {
        timer = undefined;
        pump();
      }, wait);
      return;
    }
    active++;
    lastStart = Date.now();
    queue.shift()!();
    pump();
  };
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
      pump();
    });
    try {
      return await fn();
    } finally {
      active--;
      pump();
    }
  };
}

export type Limiter = ReturnType<typeof createLimiter>;

/** Identifies us to the registries. A contact email (CROSSREF_MAILTO) puts us in Crossref's polite pool. */
export function userAgent(): string {
  const mail = process.env.CROSSREF_MAILTO;
  return `Veracite/0.1 (+https://github.com/krish2105/veracite${mail ? `; mailto:${mail}` : ""})`;
}

const inflight = new Map<string, Promise<string | null>>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a URL as text through a limiter. Returns null on 404 (the honest "this record does not exist").
 * Throws RegistryError on rate limits, outages, timeouts.
 */
export function getText(registry: RegistryName, url: string, limiter: Limiter, accept = "application/json"): Promise<string | null> {
  const key = `${accept} ${url}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = limiter(() => fetchWithRetry(registry, url, accept)).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export async function getJson<T>(registry: RegistryName, url: string, limiter: Limiter): Promise<T | null> {
  const text = await getText(registry, url, limiter);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RegistryError(registry, "bad_response", `${registry} returned invalid JSON`);
  }
}

async function fetchWithRetry(registry: RegistryName, url: string, accept: string): Promise<string | null> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: accept, "User-Agent": userAgent() },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: CACHE_SECONDS },
      });
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      if (attempt === 0) {
        await sleep(800);
        continue;
      }
      throw new RegistryError(registry, timedOut ? "timeout" : "upstream_down", `${registry} did not respond (${timedOut ? "timeout" : "network error"})`);
    }
    if (res.status === 404) return null;
    if (res.ok) return res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt === 0) {
      const after = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(after) && after > 0 ? Math.min(after, 3) * 1000 : 1000);
      continue;
    }
    if (res.status === 429) throw new RegistryError(registry, "rate_limited", `${registry} rate limit reached`, 429);
    if (res.status >= 500) throw new RegistryError(registry, "upstream_down", `${registry} is having problems (HTTP ${res.status})`, res.status);
    throw new RegistryError(registry, "bad_response", `${registry} rejected the request (HTTP ${res.status})`, res.status);
  }
}
