/**
 * GET /api/sources/wayback?url=<page> (Z16): is a web source live, archived, and how to cite it.
 * Code only, no AI. Responds { ok: true, check: WebCheck } or ApiError.
 * Status is "partial" (live or archived) or "notfound" (neither); a web page is never "verified".
 */
import type { ApiError } from "@/lib/types";
import { checkWebSource, parsePublicUrl } from "./check";

export const maxDuration = 30;

const bad = (error: string) => Response.json({ ok: false, error, code: "bad_input" } satisfies ApiError, { status: 400 });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url) return bad("Add ?url=https://… to check a web page.");
  if (url.length > 2000) return bad("That link is too long.");
  const parsed = parsePublicUrl(url);
  if (!parsed.ok) return bad(parsed.reason);
  try {
    const check = await checkWebSource(parsed.url.toString());
    return Response.json({ ok: true, check }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("wayback check failed", e);
    return Response.json({ ok: false, error: "The check could not be completed. Please try again.", code: "upstream_down" } satisfies ApiError, { status: 502 });
  }
}
