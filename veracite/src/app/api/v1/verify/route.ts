/**
 * GET /api/v1/verify?doi=10.xxxx/… or ?ref=<full reference> (K13): Veracite's verdict as a small JSON answer,
 * for other tools and AI assistants ("check before you cite"). Open CORS, no key, code only, no AI.
 * DOI answers are cached at the edge for an hour; the registries' own limits are respected by the clients.
 */
import type { ApiError } from "@/lib/types";
import { verifyReference } from "@/lib/verify";
import { parseQuery, publicVerdict } from "./shape";

export const maxDuration = 30;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request): Promise<Response> {
  const q = parseQuery(new URL(request.url).searchParams);
  if (!q.ok) return Response.json({ ok: false, error: q.error, code: "bad_input" } satisfies ApiError, { status: 400, headers: CORS });
  try {
    const v = await verifyReference(q.input);
    const cache = q.echo.doi ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store";
    return Response.json(publicVerdict(q.echo, v), { headers: { ...CORS, "Cache-Control": cache } });
  } catch (e) {
    console.error("v1 verify failed", e);
    return Response.json({ ok: false, error: "The check could not be completed. Please try again.", code: "upstream_down" } satisfies ApiError, { status: 502, headers: CORS });
  }
}
