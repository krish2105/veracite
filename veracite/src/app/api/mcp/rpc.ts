/**
 * Veracite as an MCP server (K13): one tool, verify_reference, so an AI assistant can check a reference
 * against Crossref, OpenAlex and arXiv BEFORE it cites it. Stateless JSON-RPC 2.0 over HTTP POST
 * (MCP Streamable HTTP, JSON responses only). Pure handler, unit-tested in rpc.test.ts; no dependencies.
 */
import type { Verification } from "@/lib/types";
import { parseQuery, publicVerdict } from "../v1/verify/shape";

const SUPPORTED = ["2025-11-25", "2025-06-18", "2025-03-26"];
const LATEST = "2025-06-18";

interface Deps {
  verify: (input: string) => Promise<Verification>;
}
type Msg = { jsonrpc?: unknown; id?: string | number | null; method?: unknown; params?: unknown };

const TOOL = {
  name: "verify_reference",
  title: "Verify a reference before citing it",
  description:
    "Checks one scholarly reference against Crossref, OpenAlex and arXiv with deterministic code (no AI). Give a DOI, or the full reference text. Returns whether a real record exists as cited, whether two registries agree (verified), whether it was retracted, or whether it was stitched together from different papers (chimera). Never cite a reference whose `exists` is false; prefer `verified` ones; cite the returned record, not your own memory.",
  inputSchema: {
    type: "object",
    properties: {
      doi: { type: "string", description: "A DOI such as 10.1038/nature14539 (with or without https://doi.org/)." },
      reference: { type: "string", description: "The full reference text, e.g. an APA reference." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
};

const ok = (id: Msg["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const err = (id: Msg["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

export async function handleRpc(raw: unknown, deps: Deps): Promise<object | null> {
  const msg = (raw ?? {}) as Msg;
  if (typeof raw !== "object" || Array.isArray(raw) || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return err(msg.id, -32600, "Invalid request: send one JSON-RPC 2.0 message.");
  const isNotification = !("id" in msg) || msg.id === undefined;
  if (isNotification) return null; // notifications/initialized and friends need no answer
  const params = (msg.params ?? {}) as Record<string, unknown>;

  switch (msg.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return ok(msg.id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "veracite", title: "Veracite reference checker", version: "1.0.0" },
        instructions: "Call verify_reference for every paper before you cite it. Cite only references whose result says exists: true, and use the returned record.",
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, { tools: [TOOL] });
    case "tools/call": {
      if (params.name !== TOOL.name) return err(msg.id, -32602, `Unknown tool: ${String(params.name)}`);
      const args = (params.arguments ?? {}) as { doi?: unknown; reference?: unknown };
      const q = new URLSearchParams();
      if (typeof args.doi === "string" && args.doi.trim()) q.set("doi", args.doi);
      else if (typeof args.reference === "string" && args.reference.trim()) q.set("ref", args.reference);
      const parsed = parseQuery(q);
      if (!parsed.ok) return ok(msg.id, { isError: true, content: [{ type: "text", text: `${parsed.error} Pass "doi" or "reference".` }] });
      try {
        const verdict = publicVerdict(parsed.echo, await deps.verify(parsed.input));
        const head = `${verdict.label}. exists: ${verdict.exists} · verified: ${verdict.verified} · retracted: ${verdict.retracted}`;
        const rec = verdict.record ? `\nRegistry record: ${verdict.record.authors.slice(0, 3).join("; ")} (${verdict.record.year ?? "n.d."}). ${verdict.record.title}. ${verdict.record.venue ?? ""} ${verdict.record.doi ? `https://doi.org/${verdict.record.doi}` : ""}`.trimEnd() : "";
        return ok(msg.id, { isError: false, content: [{ type: "text", text: `${head}${rec}\n${verdict.reasons.join(" ")}` }], structuredContent: verdict });
      } catch {
        return ok(msg.id, { isError: true, content: [{ type: "text", text: "The registries could not be reached. Try again; do not cite the reference until it is checked." }] });
      }
    }
    default:
      return err(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}
