/**
 * POST /api/sources/xray (K05): verify a whole pasted bibliography. Code only, no AI.
 * Body: { text: string }  →  NDJSON stream (application/x-ndjson):
 *   {"type":"start","total":N,"refs":[…]}          the references as split by the server
 *   {"type":"line","n":3,"raw":"…","verification":{…}}  one per reference, as each finishes (any order)
 *   {"type":"summary","total":N,"byStatus":{…},"ms":…}
 * At most 30 references (MAX_REFERENCES), three checked at a time; the registry limiters keep us inside each registry's limits.
 */
import type { ApiError, RefStatus, Verification, XrayLine, XrayRequest, XrayStart, XraySummary } from "@/lib/types";
import { splitBibliography, verifyReference } from "@/lib/verify";

export const maxDuration = 60;

const MAX_CHARS = 20_000;
const CONCURRENCY = 3;
const bad = (error: string) => Response.json({ ok: false, error, code: "bad_input" } satisfies ApiError, { status: 400 });

/** If something unexpected breaks one reference, report it honestly for that line instead of failing the list. */
function couldNotCheck(startedAt: number): Verification {
  return {
    status: "partial",
    checks: [],
    registries: [],
    updates: [],
    reasons: ["This reference could not be checked because of an internal error. Try it again on its own."],
    searched: [],
    checkedAt: new Date().toISOString(),
    ms: Date.now() - startedAt,
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: XrayRequest;
  try {
    body = (await request.json()) as XrayRequest;
  } catch {
    return bad('Send JSON like { "text": "1. Author, A. (2025). Title. Journal." }');
  }
  if (typeof body?.text !== "string" || !body.text.trim()) return bad("Paste a reference list to X-ray.");
  if (body.text.length > MAX_CHARS) return bad(`The list can be at most ${MAX_CHARS.toLocaleString()} characters.`);
  const refs = splitBibliography(body.text);
  if (!refs.length) return bad("No references found. Put each reference on its own line or number them.");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: XrayStart | XrayLine | XraySummary) => controller.enqueue(encoder.encode(`${JSON.stringify(o)}\n`));
      const t0 = Date.now();
      const byStatus: Record<RefStatus, number> = { verified: 0, chimera: 0, mismatch: 0, notfound: 0, retracted: 0, partial: 0 };
      send({ type: "start", total: refs.length, refs });

      let next = 0;
      const worker = async () => {
        while (next < refs.length) {
          const i = next++;
          const started = Date.now();
          let verification: Verification;
          try {
            verification = await verifyReference(refs[i]);
          } catch (e) {
            console.error("xray line failed", e);
            verification = couldNotCheck(started);
          }
          byStatus[verification.status]++;
          send({ type: "line", n: i + 1, raw: refs[i], verification });
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, refs.length) }, worker));
      send({ type: "summary", total: refs.length, byStatus, ms: Date.now() - t0 });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

