/**
 * POST /api/sources/search (K09): the Scout. Body { queries: string[], yearFrom?: number }.
 * Returns registry candidates, each already checked by the Verifier. Code only, no AI.
 */
import { z } from "zod";
import { scout } from "@/lib/agents/scout";
import type { ApiError } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  queries: z.array(z.string().trim().min(3).max(160)).min(1).max(6),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Send 1 to 6 search queries.", code: "bad_input" } satisfies ApiError, { status: 400 });
  try {
    const r = await scout(parsed.data.queries, { yearFrom: parsed.data.yearFrom });
    return Response.json({ ok: true, ...r }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("scout failed", e);
    return Response.json({ ok: false, error: "The search could not be completed. Please try again.", code: "upstream_down" } satisfies ApiError, { status: 502 });
  }
}
