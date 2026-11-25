import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openalexRelated } from "./openalex";

const kestin = JSON.parse(readFileSync(new URL("./__fixtures__/openalex-kestin.json", import.meta.url), "utf8"));

describe("citation snowballing", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks OpenAlex for the right direction and returns works with the total", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(decodeURIComponent(url));
      return new Response(JSON.stringify(url.includes("filter=") ? { meta: { count: 25 }, results: [kestin] } : { ...kestin, id: "https://openalex.org/W111" }), { status: 200 });
    });
    const refs = await openalexRelated("10.1073/pnas.2422633122", "references");
    expect(urls[1]).toContain("filter=cited_by:W111");
    expect(refs.data?.total).toBe(25);
    expect(refs.data?.works[0].doi).toBe("10.1038/s41598-025-97652-6");
    await openalexRelated("10.1073/pnas.2422633122", "cited_by");
    expect(urls.at(-1)).toContain("filter=cites:W111");
  });

  it("returns null, not an empty list, when OpenAlex does not know the DOI", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    expect((await openalexRelated("10.9999/unknown.doi", "references")).data).toBeNull();
  });
});
