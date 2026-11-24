/**
 * POST /api/sources/verify (K05): verify ONE reference. Code only, no AI.
 * Body: { input: string | ReferenceInput }  →  VerifyResponse
 * Used by: the one-click save page (A15), the eval runner (Z06), the certificate re-check (Z08).
 */
import type { ApiError, ReferenceInput, VerifyRequest, VerifyResponse } from "@/lib/types";
import { verifyReference } from "@/lib/verify";

export const maxDuration = 30;

const MAX_CHARS = 2000;
const bad = (error: string, status = 400) => Response.json({ ok: false, error, code: "bad_input" } satisfies ApiError, { status });

export async function POST(request: Request): Promise<Response> {
  let body: VerifyRequest;
  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return bad('Send JSON like { "input": "Author, A. (2025). Title. Journal." }');
  }
  const input = body?.input;
  const raw = typeof input === "string" ? input : (input as ReferenceInput | undefined)?.raw;
  if (typeof raw !== "string" || raw.trim().length < 6) return bad("Paste a reference or a DOI to verify.");
  if (raw.length > MAX_CHARS) return bad(`One reference can be at most ${MAX_CHARS} characters.`);

  try {
    const verification = await verifyReference(input as string | ReferenceInput);
    return Response.json({ ok: true, verification } satisfies VerifyResponse, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("verify failed", e);
    return Response.json({ ok: false, error: "The check could not be completed. Please try again.", code: "upstream_down" } satisfies ApiError, { status: 502 });
  }
}
