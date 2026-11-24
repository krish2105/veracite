/**
 * GET /api/health (K06): which registries answer, whether AI is on (or Rules mode), the model chain per agent and
 * today's AI budget. Used by the Trust Center and the "turn the AI off" demo moment. Never returns keys.
 */
import { connection } from "next/server";
import { gateway } from "@/lib/llm";
import type { Health, RegistryName } from "@/lib/types";

export const maxDuration = 15;

const PROBES: Record<RegistryName, () => string> = {
  crossref: () => `https://api.crossref.org/works?rows=0${process.env.CROSSREF_MAILTO ? `&mailto=${encodeURIComponent(process.env.CROSSREF_MAILTO)}` : ""}`,
  openalex: () => `https://api.openalex.org/works?per_page=1&select=id${process.env.OPENALEX_API_KEY ? `&api_key=${process.env.OPENALEX_API_KEY}` : ""}`,
  arxiv: () => "https://export.arxiv.org/api/query?id_list=2506.08872&max_results=1",
};

async function probe(url: string): Promise<"up" | "slow" | "down"> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000), headers: { "User-Agent": "Veracite/0.1 health check" } });
    if (!res.ok) return "down";
    return Date.now() - t0 > 2000 ? "slow" : "up";
  } catch {
    return "down";
  }
}

export async function GET(): Promise<Response> {
  await connection(); // always measure at request time, never at build
  const names = Object.keys(PROBES) as RegistryName[];
  const results = await Promise.all(names.map((n) => probe(PROBES[n]())));
  const s = gateway.status();
  const body: Health & { aiReason?: string; chains: typeof s.chains } = {
    registries: Object.fromEntries(names.map((n, i) => [n, results[i]])) as Health["registries"],
    ai: s.ai.mode,
    aiReason: s.ai.mode === "rules" ? s.ai.reason : undefined,
    budget: { callsToday: s.budget.callsToday, callCap: s.budget.callsPerDay, tokensToday: s.budget.tokensToday },
    chains: s.chains,
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
