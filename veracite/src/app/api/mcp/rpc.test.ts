import { describe, expect, it } from "vitest";
import type { Verification } from "@/lib/types";
import { handleRpc } from "./rpc";

const verified: Verification = {
  status: "verified", checks: [], registries: ["crossref", "openalex"], updates: [], reasons: ["Crossref and OpenAlex both have this paper."], searched: [], checkedAt: "2026-11-26T08:00:00.000Z", ms: 90,
  matched: { registry: "crossref", id: "10.1038/nature14539", doi: "10.1038/nature14539", title: "Deep learning", authors: [{ family: "LeCun", given: "Yann" }], year: 2015, venue: "Nature", type: "article", updates: [], fetchedAt: "2026-11-26T08:00:00.000Z" },
};
const seen: string[] = [];
const deps = { verify: async (input: string) => (seen.push(input), verified) };
const rpc = (method: string, params?: unknown, id: number | undefined = 1) => handleRpc({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, ...(params ? { params } : {}) }, deps);

describe("MCP server (K13): verify_reference for AI assistants", () => {
  it("initialize returns the protocol version, tools capability and server info", async () => {
    const r = (await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } })) as { result: { protocolVersion: string; capabilities: { tools: unknown }; serverInfo: { name: string } } };
    expect(r.result.protocolVersion).toBe("2025-06-18");
    expect(r.result.capabilities.tools).toBeDefined();
    expect(r.result.serverInfo.name).toBe("veracite");
  });

  it("answers an unknown protocol version with its own", async () => {
    const r = (await rpc("initialize", { protocolVersion: "1999-01-01" })) as { result: { protocolVersion: string } };
    expect(r.result.protocolVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.result.protocolVersion).not.toBe("1999-01-01");
  });

  it("lists one tool with an input schema", async () => {
    const r = (await rpc("tools/list")) as { result: { tools: { name: string; inputSchema: { type: string } }[] } };
    expect(r.result.tools.map((t) => t.name)).toEqual(["verify_reference"]);
    expect(r.result.tools[0].inputSchema.type).toBe("object");
  });

  it("verifies a DOI and returns text plus structured content", async () => {
    const r = (await rpc("tools/call", { name: "verify_reference", arguments: { doi: "10.1038/nature14539" } })) as { result: { isError: boolean; content: { type: string; text: string }[]; structuredContent: { verified: boolean; status: string } } };
    expect(seen.at(-1)).toBe("https://doi.org/10.1038/nature14539");
    expect(r.result.isError).toBe(false);
    expect(r.result.structuredContent).toMatchObject({ verified: true, status: "verified" });
    expect(r.result.content[0].text).toMatch(/^Verified/);
  });

  it("reports bad arguments as a tool error, not a crash", async () => {
    const r = (await rpc("tools/call", { name: "verify_reference", arguments: {} })) as { result: { isError: boolean; content: { text: string }[] } };
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toMatch(/doi|reference/i);
  });

  it("returns nothing for a notification, and errors for unknown methods, tools and bad messages", async () => {
    expect(await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, deps)).toBeNull();
    expect(await rpc("nope")).toMatchObject({ error: { code: -32601 } });
    expect(await rpc("tools/call", { name: "nope", arguments: {} })).toMatchObject({ error: { code: -32602 } });
    expect(await handleRpc({ id: 1, method: "ping" }, deps)).toMatchObject({ error: { code: -32600 } });
    expect(await rpc("ping")).toMatchObject({ result: {} });
  });
});
