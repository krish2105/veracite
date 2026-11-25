/**
 * POST /api/mcp (K13): Veracite as a remote MCP server (Streamable HTTP, stateless, JSON responses).
 * Add https://veracite.vercel.app/api/mcp as a custom connector in an MCP client; its one tool,
 * verify_reference, checks a reference against Crossref, OpenAlex and arXiv before the AI cites it.
 * Read-only, no key, no session state, code only (no AI on our side).
 */
import { verifyReference } from "@/lib/verify";
import { handleRpc } from "./rpc";

export const maxDuration = 30;

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
};

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: HEADERS });
}

/** This server only answers POSTs; it opens no event stream. */
export function GET(): Response {
  return new Response(JSON.stringify({ error: "Use POST with a JSON-RPC 2.0 message. Tool: verify_reference." }), { status: 405, headers: { ...HEADERS, Allow: "POST, OPTIONS", "Content-Type": "application/json" } });
}

export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > 20_000) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large." } }, { status: 413, headers: HEADERS });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: send JSON." } }, { status: 400, headers: HEADERS });
  }
  const answer = await handleRpc(body, { verify: (input) => verifyReference(input) });
  if (answer === null) return new Response(null, { status: 202, headers: HEADERS });
  return Response.json(answer, { headers: HEADERS });
}
