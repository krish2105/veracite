/**
 * Verification Certificate (task Z08, feature F37, SP Jain §g(vi): faculty verify references).
 *
 * A certificate is the student's verified bibliography packed into a link + QR code:
 *   https://<site>/certificate#v1.<compressed data>.<hash prefix>
 *
 * - The data sits after the `#`, which browsers never send to a server, so nothing is stored
 *   anywhere: the link IS the certificate. No student name is included.
 * - It is deflate-compressed + base64url so a 30-reference bibliography fits in a QR code.
 * - `certificateHash` is a SHA-256 over a canonical form of the data. It is printed on the
 *   certificate, so a printed copy and a link can be matched, and a garbled scan is detected.
 * - Honest limit: a hash is not a signature. Someone could edit the data and recompute it.
 *   The real protection is `reverifyCertificate`: the professor's browser re-checks every DOI
 *   against the registries live, so editing a status in the link achieves nothing.
 *
 * Decoded data is untrusted input: it is validated here and must be rendered as text only.
 */

import QRCode from "qrcode";

export const CERT_STATUSES = ["verified", "partial", "mismatch", "chimera", "notfound", "retracted"] as const;
export type CertStatus = (typeof CERT_STATUSES)[number];

export interface CertRef {
  /** DOI without the https://doi.org/ prefix (journal articles). */
  doi?: string;
  /** URL for web sources without a DOI. */
  url?: string;
  /** Always present for URL sources. May be left out for DOI sources in a compact certificate. */
  title?: string;
  /** Family name of the first author. */
  firstAuthor?: string;
  year?: number;
  /** Status when the certificate was issued. */
  status: CertStatus;
}

export interface Certificate {
  v: 1;
  /** ISO timestamp when the references were checked. */
  issuedAt: string;
  /** Essay title or research question (optional; no student name, ever). */
  title?: string;
  autonomy?: "off" | "assist" | "copilot";
  registries?: string[];
  sample?: boolean;
  refs: CertRef[];
}

export const MAX_REFS = 200;
/** Byte capacity of a version-40 QR code at error-correction level M. */
export const QR_MAX_BYTES = 2331;

// ---------- canonical form + hash ----------

/** JSON with keys sorted at every level and `undefined` dropped, so the same data → same hash. */
export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? "null" : canonicalJSON(v))).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(obj[k])}`).join(",")}}`;
}

async function sha256Hex(text: string): Promise<string> {
  const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 (hex) of the certificate's canonical form. Printed on the certificate. */
export function certificateHash(cert: Certificate): Promise<string> {
  return sha256Hex(canonicalJSON(cert));
}

// ---------- compression + base64url ----------

async function pipeBytes(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- validation (decoded data is untrusted) ----------

const str = (v: unknown, max: number) => typeof v === "string" && v.length > 0 && v.length <= max;

/** Throws with a plain reason if `data` is not a well-formed certificate. */
export function validateCertificate(data: unknown): Certificate {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("certificate is not an object");
  const c = data as Record<string, unknown>;
  if (c.v !== 1) throw new Error("unsupported certificate version");
  if (!str(c.issuedAt, 40) || Number.isNaN(Date.parse(c.issuedAt as string))) throw new Error("bad issue date");
  if (c.title !== undefined && !str(c.title, 300)) throw new Error("bad title");
  if (c.autonomy !== undefined && !["off", "assist", "copilot"].includes(c.autonomy as string)) throw new Error("bad autonomy");
  if (c.registries !== undefined && (!Array.isArray(c.registries) || c.registries.length > 20 || !c.registries.every((r) => str(r, 60)))) throw new Error("bad registries");
  if (c.sample !== undefined && typeof c.sample !== "boolean") throw new Error("bad sample flag");
  if (!Array.isArray(c.refs) || c.refs.length === 0) throw new Error("no references");
  if (c.refs.length > MAX_REFS) throw new Error(`more than ${MAX_REFS} references`);
  c.refs.forEach((r, i) => {
    const ref = r as Record<string, unknown>;
    const where = `reference ${i + 1}`;
    if (!ref || typeof ref !== "object") throw new Error(`${where} is not an object`);
    if (ref.doi === undefined && ref.url === undefined) throw new Error(`${where} has no DOI or URL`);
    if (ref.doi !== undefined && !(str(ref.doi, 300) && /^10\.\d{4,9}\/\S+$/.test(ref.doi as string))) throw new Error(`${where} has a bad DOI`);
    if (ref.url !== undefined && !(str(ref.url, 2000) && /^https?:\/\//i.test(ref.url as string))) throw new Error(`${where} has a bad URL`);
    if (ref.title !== undefined ? !str(ref.title, 500) : ref.doi === undefined) throw new Error(`${where} has no title`);
    if (ref.firstAuthor !== undefined && !str(ref.firstAuthor, 120)) throw new Error(`${where} has a bad author`);
    if (ref.year !== undefined && !(Number.isInteger(ref.year) && (ref.year as number) >= 1500 && (ref.year as number) <= 2100)) throw new Error(`${where} has a bad year`);
    if (!CERT_STATUSES.includes(ref.status as CertStatus)) throw new Error(`${where} has an unknown status`);
  });
  return data as Certificate;
}

// ---------- encode / decode ----------

const HASH_PREFIX = 16;

/** Pack a certificate into a URL-safe token: `v1.<deflate+base64url>.<16 hex of SHA-256>`. */
export async function encodeCertificate(cert: Certificate): Promise<string> {
  validateCertificate(cert);
  const json = canonicalJSON(cert);
  const packed = await pipeBytes(new TextEncoder().encode(json), new CompressionStream("deflate-raw"));
  const hash = await sha256Hex(json);
  return `v1.${toBase64Url(packed)}.${hash.slice(0, HASH_PREFIX)}`;
}

export type DecodeResult =
  | { ok: true; cert: Certificate; hash: string }
  | { ok: false; error: string };

/** Unpack a token (or a full certificate URL). Never throws. */
export async function decodeCertificate(tokenOrUrl: string): Promise<DecodeResult> {
  try {
    const hashIdx = tokenOrUrl.indexOf("#");
    const token = (hashIdx >= 0 ? tokenOrUrl.slice(hashIdx + 1) : tokenOrUrl).trim();
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return { ok: false, error: "This is not a Veracite certificate link." };
    if (parts[1].length > 20000) return { ok: false, error: "Certificate link is too long." };
    const bytes = await pipeBytes(fromBase64Url(parts[1]), new DecompressionStream("deflate-raw"));
    if (bytes.length > 200_000) return { ok: false, error: "Certificate data is too large." };
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const hash = await sha256Hex(json);
    if (hash.slice(0, HASH_PREFIX) !== parts[2].toLowerCase()) {
      return { ok: false, error: "The certificate data doesn't match its fingerprint. The link may be damaged or edited." };
    }
    const cert = validateCertificate(JSON.parse(json));
    // Re-hash the validated object canonically so the printed hash is independent of key order.
    return { ok: true, cert, hash: await certificateHash(cert) };
  } catch (e) {
    return { ok: false, error: `Could not read this certificate (${e instanceof Error ? e.message : "unknown error"}).` };
  }
}

/** The same certificate without titles for DOI references (titles come back on live re-check). */
export function compactCertificate(cert: Certificate): Certificate {
  return { ...cert, refs: cert.refs.map((r) => (r.doi ? { ...r, title: undefined } : r)) };
}

export interface CertificateLink {
  url: string;
  /** SHA-256 of exactly what is in the link. Print this on the certificate. */
  hash: string;
  /** True if titles of DOI references were left out so the link fits in a QR code. */
  compact: boolean;
  bytes: number;
  fitsQr: boolean;
}

/**
 * Link for the QR code, e.g. certificateLink("https://veracite.vercel.app", cert).
 * Uses the full certificate if it fits in a QR code, otherwise the compact one.
 */
export async function certificateLink(origin: string, cert: Certificate): Promise<CertificateLink> {
  const base = `${origin.replace(/\/+$/, "")}/certificate#`;
  const size = (u: string) => new TextEncoder().encode(u).length;
  let chosen = cert;
  let url = base + (await encodeCertificate(cert));
  let compact = false;
  if (size(url) > QR_MAX_BYTES) {
    chosen = JSON.parse(canonicalJSON(compactCertificate(cert)));
    url = base + (await encodeCertificate(chosen));
    compact = true;
  }
  const bytes = size(url);
  return { url, hash: await certificateHash(chosen), compact, bytes, fitsQr: bytes <= QR_MAX_BYTES };
}

/** QR code as a data URL (PNG). Throws if the link is too long for a QR code. */
export async function certificateQR(url: string, width = 240): Promise<string> {
  const bytes = new TextEncoder().encode(url).length;
  if (bytes > QR_MAX_BYTES) throw new Error(`Certificate link is ${bytes} bytes; a QR code holds at most ${QR_MAX_BYTES}. Split the bibliography.`);
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width });
}

// ---------- building one ----------

/** Structurally compatible with `SourceRecord` (docs/03 §7). */
export interface CertSourceInput {
  doi?: string;
  url?: string;
  title: string;
  authors?: { family: string; given?: string }[];
  year?: number;
  verification: { status: string; registries?: string[] };
  sample?: boolean;
}

/** Build a certificate from the student's final library items. */
export function certificateFromSources(
  sources: CertSourceInput[],
  opts: { issuedAt: string; title?: string; autonomy?: Certificate["autonomy"]; sample?: boolean },
): Certificate {
  const registries = Array.from(new Set(sources.flatMap((s) => s.verification.registries ?? []))).sort();
  const cert: Certificate = {
    v: 1,
    issuedAt: opts.issuedAt,
    title: opts.title?.trim() || undefined,
    autonomy: opts.autonomy,
    registries: registries.length ? registries : undefined,
    sample: opts.sample || sources.some((s) => s.sample) || undefined,
    refs: sources.map((s) => ({
      doi: s.doi ? s.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : undefined,
      url: s.doi ? undefined : s.url,
      title: s.title,
      firstAuthor: s.authors?.[0]?.family,
      year: s.year,
      status: (CERT_STATUSES as readonly string[]).includes(s.verification.status) ? (s.verification.status as CertStatus) : "notfound",
    })),
  };
  return validateCertificate(JSON.parse(canonicalJSON(cert)));
}

// ---------- summary + live re-verification ----------

export function summariseCertificate(cert: Certificate): { total: number; byStatus: Record<CertStatus, number>; allVerified: boolean } {
  const byStatus = Object.fromEntries(CERT_STATUSES.map((s) => [s, 0])) as Record<CertStatus, number>;
  for (const r of cert.refs) byStatus[r.status]++;
  return { total: cert.refs.length, byStatus, allVerified: byStatus.verified === cert.refs.length };
}

/** The registry check, supplied by Krishna's Verifier (K04). Must hit the registries live. */
export type VerifyFn = (ref: CertRef) => Promise<{ status: CertStatus }>;

export interface ReverifyItem {
  ref: CertRef;
  then: CertStatus;
  /** Status now, or "error" if the live check failed (network etc.). */
  now: CertStatus | "error";
  changed: boolean;
}

export interface ReverifyResult {
  checkedAt: string;
  items: ReverifyItem[];
  /** Every reference verified now (nothing failed or changed for the worse). */
  stillVerified: boolean;
  changed: number;
  errors: number;
}

/** Re-check every reference live, a few at a time. Never throws for a single failed lookup. */
export async function reverifyCertificate(cert: Certificate, verify: VerifyFn, opts: { concurrency?: number; now?: () => string } = {}): Promise<ReverifyResult> {
  const limit = Math.max(1, opts.concurrency ?? 4);
  const items: ReverifyItem[] = new Array(cert.refs.length);
  let next = 0;
  async function worker() {
    while (next < cert.refs.length) {
      const i = next++;
      const ref = cert.refs[i];
      let now: CertStatus | "error";
      try {
        now = (await verify(ref)).status;
        if (!CERT_STATUSES.includes(now)) now = "error";
      } catch {
        now = "error";
      }
      items[i] = { ref, then: ref.status, now, changed: now !== "error" && now !== ref.status };
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, cert.refs.length) }, worker));
  return {
    checkedAt: (opts.now ?? (() => new Date().toISOString()))(),
    items,
    stillVerified: items.every((x) => x.now === "verified"),
    changed: items.filter((x) => x.changed).length,
    errors: items.filter((x) => x.now === "error").length,
  };
}
