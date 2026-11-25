/**
 * POST /api/sources/snowball (K11): citation snowballing. Body { doi, direction: "references" | "cited_by", since?: "YYYY-MM-DD" (K41), perPage? }.
 * OpenAlex lists the related works; each one goes through the Verifier. Code only, no AI.
 */
import { z } from "zod";
import { verifyRecords } from "@/lib/agents/scout";
import { normalizeDoi, openalexRelated, RegistryError } from "@/lib/registries";
import type { ApiError } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({ doi: z.string().min(6).max(300), direction: z.enum(["references", "cited_by"]), since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), perPage: z.number().int().min(1).max(8).optional() });
const fail = (error: string, code: ApiError["code"], status: number) => Response.json({ ok: false, error, code } satisfies ApiError, { status });

export async function POST(request: Request): Promise<Response> {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const doi = parsed.success ? normalizeDoi(parsed.data.doi) : undefined;
  if (!parsed.success || !doi) return fail('Send { "doi": "10.…", "direction": "references" or "cited_by" }.', "bad_input", 400);
  try {
    const { data } = await openalexRelated(doi, parsed.data.direction, parsed.data.perPage ?? 8, parsed.data.since);
    if (!data) return fail("OpenAlex has no record for this DOI, so its citations cannot be listed.", "bad_input", 404);
    const candidates = await verifyRecords(data.works.map((record) => ({ record, hits: 1 })));
    return Response.json({ ok: true, total: data.total, candidates }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof RegistryError && e.kind === "rate_limited") return fail("OpenAlex is rate-limiting us right now. Try again in a minute.", "rate_limited", 429);
    console.error("snowball failed", e);
    return fail("The citation list could not be loaded. Please try again.", "upstream_down", 502);
  }
}
