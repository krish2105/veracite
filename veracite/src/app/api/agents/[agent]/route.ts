/**
 * POST /api/agents/[agent] (K08): planner | reader | scribe | skeptic | explain (K30: one saved source, optional question).
 * Stateless: the browser's orchestrator (K09) sends what the agent needs and logs the returned receipt fields.
 * When AI is off, unconfigured or busy, the answer is a rules-mode result with a reason, never an error page.
 *
 * Body: { sessionId, aiOff?, question?, sources?, evidence?, claims?, round? }
 * Honest limitation: sources come from the student's own library on their device, so labels trust that library;
 * the certificate (Z08) re-verifies every reference live.
 */
import { z } from "zod";
import { runExplainer, runPlanner, runReader, runScribe, runSkeptic, applyChallenges } from "@/lib/agents";
import type { ApiError, Claim, EvidenceCard, SourceRecord } from "@/lib/types";

export const maxDuration = 60;

const MAX_BODY = 200_000;
const Body = z.object({
  sessionId: z.string().min(1).max(80),
  aiOff: z.boolean().optional(),
  question: z.string().max(500).optional(),
  sources: z.array(z.record(z.string(), z.unknown())).max(20).optional(),
  evidence: z.array(z.record(z.string(), z.unknown())).max(40).optional(),
  claims: z.array(z.record(z.string(), z.unknown())).max(12).optional(),
  round: z.union([z.literal(1), z.literal(2)]).optional(),
});

const bad = (error: string, status = 400) => Response.json({ ok: false, error, code: "bad_input" } satisfies ApiError, { status });

export async function POST(request: Request, ctx: RouteContext<"/api/agents/[agent]">): Promise<Response> {
  const { agent } = await ctx.params;
  const raw = await request.text();
  if (raw.length > MAX_BODY) return bad("Request too large.", 413);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return bad("Send JSON.");
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return bad("Missing or invalid fields.");
  const b = parsed.data;
  const run = { sessionId: b.sessionId, aiOff: b.aiOff };
  const sources = (b.sources ?? []) as unknown as SourceRecord[];
  const question = b.question?.trim() ?? "";

  try {
    switch (agent) {
      case "planner":
        if (question.length < 5) return bad("Ask a research question first.");
        return Response.json({ ok: true, ...(await runPlanner(question, run)) });
      case "reader":
        if (!sources.length) return bad("Approve at least one source first.");
        return Response.json({ ok: true, ...(await runReader(question, sources, run)) });
      case "explain":
        if (sources.length !== 1) return bad("Send exactly one saved source to explain.");
        return Response.json({ ok: true, ...(await runExplainer(sources[0], question || undefined, run)) });
      case "scribe":
        return Response.json({ ok: true, ...(await runScribe(question, (b.evidence ?? []) as unknown as EvidenceCard[], sources, run)) });
      case "skeptic": {
        const claims = (b.claims ?? []) as unknown as Claim[];
        const r = await runSkeptic(claims, sources, { ...run, round: b.round });
        return Response.json({ ok: true, ...r, claims: applyChallenges(claims, r.data, sources) });
      }
      default:
        return bad(`Unknown agent "${agent}".`, 404);
    }
  } catch (e) {
    console.error(`agent ${agent} failed`, e);
    return Response.json({ ok: false, error: "The agent could not finish. Please try again.", code: "upstream_down" } satisfies ApiError, { status: 502 });
  }
}
