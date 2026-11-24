/**
 * K03 live smoke test against the real registries, on the demo papers (docs/11 §11).
 * Skipped by default (CI stays offline). Run from veracite/:  LIVE=1 npx vitest run registries.live
 * Uses CROSSREF_MAILTO / OPENALEX_API_KEY from the environment when set.
 */
import { describe, expect, it } from "vitest";
import { arxivById, crossrefByDoi, crossrefMatchReference, lookupDoi, openalexByDoi, openalexSearch } from "./index";

describe.skipIf(!process.env.LIVE)("registries (live)", { timeout: 30_000 }, () => {
  it("Crossref: Wang & Fan (2025) is retracted", async () => {
    const { data, receipt } = await crossrefByDoi("https://doi.org/10.1057/s41599-025-04787-y");
    expect(receipt.hits).toBe(1);
    expect(data?.updates.some((u) => u.kind === "retraction")).toBe(true);
  });

  it("Crossref: a fabricated DOI is an honest null, not an error", async () => {
    const { data, receipt } = await crossrefByDoi("10.1057/s41599-025-99999-x");
    expect(data).toBeNull();
    expect(receipt.hits).toBe(0);
  });

  it("Crossref: reference matching flags the correction notice above the paper", async () => {
    const { data } = await crossrefMatchReference("Bastani, H. et al. (2025). Generative AI without guardrails can harm learning. PNAS.");
    const firstWork = data.find((r) => !r.noticeFor);
    expect(firstWork?.doi).toBe("10.1073/pnas.2422633122");
  });

  it("OpenAlex: Kestin et al. has an abstract", async () => {
    const { data } = await openalexByDoi("10.1038/s41598-025-97652-6");
    expect(data?.abstract?.length).toBeGreaterThan(200);
  });

  it("arXiv: Kosmyna et al. by DataCite DOI", async () => {
    const { data } = await arxivById("10.48550/arXiv.2506.08872");
    expect(data?.title).toMatch(/^Your Brain on ChatGPT/);
  });

  it("lookupDoi: an arXiv DOI goes to arXiv + OpenAlex, not Crossref", async () => {
    const r = await lookupDoi("10.48550/arXiv.2506.08872");
    expect(r.errors).toEqual([]);
    expect(Object.keys(r.records).sort()).toEqual(["arxiv", "openalex"]);
    expect(r.records.arxiv?.title).toMatch(/^Your Brain on ChatGPT/);
    expect(r.records.openalex).not.toBeNull();
  });

  it("OpenAlex: topic search on the demo question returns real works", async () => {
    const { data } = await openalexSearch("generative AI student learning outcomes", { perPage: 10, fromYear: 2023 });
    expect(data.length).toBeGreaterThan(5);
    expect(data.every((r) => r.title && r.registry === "openalex")).toBe(true);
  });
});
