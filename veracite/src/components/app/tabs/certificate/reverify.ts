/**
 * Live re-check of one certificate reference (K20), through the Verifier. A compact certificate leaves out titles of
 * DOI references; then the DOI is looked up and first author and year are compared by code.
 */
import type { CertRef, CertStatus } from "@/lib/integrity/certificate";
import type { Verification } from "@/lib/types";
import { sameSurname } from "@/lib/verify/text";

export function referenceText(r: CertRef): string {
  if (!r.title) return r.doi ?? r.url ?? "";
  return `${r.firstAuthor ?? ""} (${r.year ?? "n.d."}). ${r.title}.${r.doi ? ` https://doi.org/${r.doi}` : r.url ? ` ${r.url}` : ""}`.trim();
}

export function statusFrom(r: CertRef, v: Verification): CertStatus {
  if (r.title || !r.doi) return v.status;
  const m = v.matched;
  if (v.status !== "partial" || !m) return v.status;
  const agrees = (!r.firstAuthor || sameSurname(r.firstAuthor, m.authors[0]?.family)) && (!r.year || !m.year || Math.abs(r.year - m.year) <= 1);
  if (!agrees) return "mismatch";
  return v.registries.length >= 2 ? "verified" : "partial";
}

export async function reverifyRef(r: CertRef): Promise<{ status: CertStatus }> {
  const input = r.title ? { raw: referenceText(r), doi: r.doi, title: r.title, year: r.year, authors: r.firstAuthor ? [{ family: r.firstAuthor }] : undefined, etAl: true } : referenceText(r);
  const res = await fetch("/api/sources/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
  const json = (await res.json()) as { ok: boolean; verification?: Verification };
  if (!res.ok || !json.verification) throw new Error("check failed");
  return { status: statusFrom(r, json.verification) };
}
