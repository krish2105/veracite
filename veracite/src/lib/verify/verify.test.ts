/**
 * K04 Verifier tests. Offline: the orchestrator runs against a fake registry made of REAL records saved from
 * Crossref, OpenAlex and arXiv on 24 Nov 2026 (src/lib/registries/__fixtures__). One test per status, plus the
 * traps we found (a correction notice ranked above the paper, a real DOI on a fake title).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DoiLookup } from "../registries";
import { parseArxivFeed } from "../registries/arxiv";
import { parseCrossrefWork, type CrossrefWork } from "../registries/crossref";
import { RegistryError } from "../registries/http";
import { arxivIdFromString, isArxivDoi } from "../registries/normalize";
import { parseOpenAlexWork, type OpenAlexWork } from "../registries/openalex";
import type { RegistryName, RegistryRecord } from "../types";
import { splitBibliography } from "./split";
import { verifyReference, type RegistryDeps } from "./verify";

const fx = (n: string) => readFileSync(new URL(`../registries/__fixtures__/${n}`, import.meta.url), "utf8");
const cr = (n: string) => parseCrossrefWork((JSON.parse(fx(n)) as { message: CrossrefWork }).message);
const asOpenAlex = (r: RegistryRecord, over: Partial<RegistryRecord> = {}): RegistryRecord => ({ ...r, registry: "openalex", id: `W-${r.doi}`, updates: [], ...over });

const bastaniCr = cr("crossref-bastani-correction.json");
const bastaniOa = asOpenAlex(bastaniCr);
const wangCr = cr("crossref-wang-fan-retracted.json");
const wangOa = asOpenAlex(wangCr, { title: wangCr.title.replace(/^RETRACTED ARTICLE:\s*/, ""), updates: [{ kind: "retraction", source: "openalex" }] });
const kestinOa = parseOpenAlexWork(JSON.parse(fx("openalex-kestin.json")) as OpenAlexWork);
const kestinCr: RegistryRecord = { ...kestinOa, registry: "crossref", id: kestinOa.doi!, abstract: undefined };
const kosmynaAx = parseArxivFeed(fx("arxiv-kosmyna.xml"))[0];
const kosmynaOa = asOpenAlex(kosmynaAx);
const bibBastani = (JSON.parse(fx("crossref-bibliographic-bastani.json")) as { message: { items: CrossrefWork[] } }).message.items.map((w) => parseCrossrefWork(w));

const seraliniCr = cr("crossref-seralini-self-retraction.json");
const seraliniOa = asOpenAlex(seraliniCr, { updates: [{ kind: "retraction", source: "openalex" }] });

type Records = Record<RegistryName, RegistryRecord[]>;
interface World {
  bib?: RegistryRecord[];
  down?: RegistryName[];
  /** What a Crossref author search returns. */
  byAuthors?: RegistryRecord[];
  all?: Records;
}
const ALL: Records = { crossref: [bastaniCr, wangCr, kestinCr, seraliniCr], openalex: [bastaniOa, wangOa, kestinOa, kosmynaOa, seraliniOa], arxiv: [kosmynaAx] };

/** A fake registry: DOI lookups answer from the saved records; text search returns `bib`. */
function world({ bib = [], down = [], byAuthors = [], all = ALL }: World = {}): RegistryDeps {
  const rcpt = (registry: RegistryName, query: string, hits: number) => ({ registry, query, hits, at: "2026-11-24T00:00:00Z" });
  return {
    async lookupDoi(doi) {
      const d = doi.toLowerCase();
      const out: DoiLookup = { doi: d, records: {}, receipts: [], errors: [] };
      const names: RegistryName[] = [isArxivDoi(d) ? "arxiv" : "crossref", "openalex"];
      for (const name of names) {
        if (down.includes(name)) {
          out.errors.push(new RegistryError(name, "upstream_down", `${name} down`));
          continue;
        }
        const rec = all[name].find((r) => r.doi === d || (name === "arxiv" && r.id === arxivIdFromString(d))) ?? null;
        out.records[name] = rec;
        out.receipts.push(rcpt(name, `doi:${d}`, rec ? 1 : 0));
      }
      return out;
    },
    async crossrefMatchReference(text) {
      if (down.includes("crossref")) throw new RegistryError("crossref", "upstream_down", "crossref down");
      return { data: bib, receipt: rcpt("crossref", text, bib.length) };
    },
    async openalexSearch(q) {
      return { data: [], receipt: rcpt("openalex", `title:${q}`, 0) };
    },
    async arxivSearch(t) {
      return { data: [], receipt: rcpt("arxiv", `title:${t}`, 0) };
    },
    async crossrefByAuthors(names) {
      return { data: byAuthors, receipt: rcpt("crossref", `author:${names.join(" ")}`, byAuthors.length) };
    },
  };
}

const BASTANI_AUTHORS = "Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26), e2422633122.";
const BASTANI = `${BASTANI_AUTHORS} https://doi.org/10.1073/pnas.2422633122`;
const KESTIN = (year = 2025, doi = "10.1038/s41598-025-97652-6") =>
  `Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (${year}). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports, 15, 17458. https://doi.org/${doi}`;

describe("verifyReference: one test per status", () => {
  it("VERIFIED: a correct APA reference, confirmed by Crossref and OpenAlex, with its correction noted", async () => {
    const v = await verifyReference(BASTANI, world());
    expect(v.status).toBe("verified");
    expect(v.registries.sort()).toEqual(["crossref", "openalex"]);
    expect(v.checks.find((c) => c.field === "title")?.match).toBe("exact");
    expect(v.checks.find((c) => c.field === "venue")?.match).toBe("exact");
    expect(v.reasons.join(" ")).toMatch(/correction was published/);
    expect(v.matched?.doi).toBe("10.1073/pnas.2422633122");
  });

  it("VERIFIED: an arXiv preprint is confirmed by arXiv + OpenAlex (Crossref does not have it)", async () => {
    const v = await verifyReference(
      "Kosmyna, N., Hauptmann, E., Yuan, Y. T., ... Maes, P. (2025). Your brain on ChatGPT: Accumulation of cognitive debt when using an AI assistant for essay writing task. arXiv. https://doi.org/10.48550/arXiv.2506.08872",
      world(),
    );
    expect(v.status).toBe("verified");
    expect(v.registries.sort()).toEqual(["arxiv", "openalex"]);
    expect(v.matched?.type).toBe("preprint");
  });

  it("RETRACTED: the Wang & Fan (2025) meta-analysis, with date and both sources", async () => {
    const v = await verifyReference(
      "Wang, J., & Fan, W. (2025). The effect of ChatGPT on students’ learning performance, learning perception, and higher-order thinking: insights from a meta-analysis. Humanities and Social Sciences Communications, 12, 621. https://doi.org/10.1057/s41599-025-04787-y",
      world(),
    );
    expect(v.status).toBe("retracted");
    expect(v.reasons[0]).toMatch(/retracted on 2026-04-22/);
    expect(v.reasons[0]).toMatch(/the publisher/);
    expect(v.reasons[0]).toMatch(/Retraction Watch/);
  });

  it("CHIMERA: a real title with authors who never wrote it", async () => {
    const v = await verifyReference(
      "Kestin, G., & Miller, K. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences.",
      world({ bib: bibBastani }),
    );
    expect(v.status).toBe("chimera");
    expect(v.parts?.find((p) => p.field === "title")?.belongsTo?.doi).toBe("10.1073/pnas.2422633122");
    expect(v.parts?.find((p) => p.field === "authors")?.note).toMatch(/None of these authors/);
  });

  it("CHIMERA: a real DOI attached to an invented title (identifier hijacking)", async () => {
    const v = await verifyReference(
      "Smith, J. A., & Lee, K. (2023). The impact of ChatGPT on undergraduate academic performance: A meta-analysis. Journal of Educational Technology & Society, 26(3), 45–62. https://doi.org/10.1073/pnas.2422633122",
      world(),
    );
    expect(v.status).toBe("chimera");
    expect(v.parts?.[0]).toMatchObject({ field: "doi", belongsTo: { doi: "10.1073/pnas.2422633122" } });
    expect(v.reasons[0]).toMatch(/belongs to a different paper/);
  });

  it("MISMATCH: a real paper with the wrong year", async () => {
    const v = await verifyReference(KESTIN(2021), world());
    expect(v.status).toBe("mismatch");
    expect(v.reasons.join(" ")).toMatch(/The year is 2025, not 2021/);
  });

  it("MISMATCH: a real paper with an invented DOI", async () => {
    const v = await verifyReference(KESTIN(2025, "10.1038/s41598-025-99999-9"), world({ bib: [kestinCr] }));
    expect(v.status).toBe("mismatch");
    expect(v.reasons.join(" ")).toMatch(/is not registered\. The real DOI is 10\.1038\/s41598-025-97652-6/);
  });

  it("NOT FOUND: a fabricated reference, with receipts of what was searched", async () => {
    const v = await verifyReference(
      "Okafor, T., & Varga, E. (2021). Caffeine improves essay grades: evidence from 12 universities. Journal of Sample Psychology, 11(4), 88–96.",
      world({ bib: [kestinCr] }),
    );
    expect(v.status).toBe("notfound");
    expect(v.searched.length).toBeGreaterThan(0);
    expect(v.reasons[0]).toMatch(/No record in Crossref, OpenAlex or arXiv/);
  });

  it("PARTIAL: everything matches but OpenAlex is down, so only one registry confirms", async () => {
    const v = await verifyReference(BASTANI, world({ down: ["openalex"] }));
    expect(v.status).toBe("partial");
    expect(v.reasons.join(" ")).toMatch(/OpenAlex did not respond/);
  });

  it("PARTIAL, not 'not found', when Crossref is down: absence is never claimed from an outage", async () => {
    const v = await verifyReference("Okafor, T. (2021). Caffeine improves essay grades. Journal of Sample Psychology.", world({ down: ["crossref"] }));
    expect(v.status).toBe("partial");
    expect(v.reasons.join(" ")).toMatch(/Crossref did not respond/);
  });
});

describe("fixes from Zedan's golden set (25 Nov)", () => {
  it("CHIMERA: stitched authors even when one real author overlaps (golden chim-001)", async () => {
    const v = await verifyReference(
      "Kestin, G., Bastani, O., & Miller, K. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26). https://doi.org/10.1073/pnas.2422633122",
      world(),
    );
    expect(v.status).toBe("chimera");
    expect(v.parts?.find((p) => p.field === "authors")?.note).toMatch(/Not the real author list/);
  });

  it("CHIMERA: two parts that do not belong to the title's paper (golden chim-003, chim-008)", async () => {
    const v = await verifyReference("Sungu, A. (2019). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences.", world({ bib: bibBastani }));
    expect(v.status).toBe("chimera");
    expect(v.reasons[0]).toMatch(/it is from 2025, not 2019/);
    expect(v.parts?.map((p) => p.field)).toEqual(["title", "authors", "year"]);
  });

  it("VERIFIED: Crossref swapped the first author's given and family names (golden real-020)", async () => {
    const swap = (r: RegistryRecord): RegistryRecord => ({ ...r, authors: [{ family: "Greg", given: "Kestin" }, ...r.authors.slice(1)] });
    const v = await verifyReference(KESTIN(), world({ all: { crossref: [swap(kestinCr)], openalex: [swap(kestinOa)], arxiv: [] } }));
    expect(v.status).toBe("verified");
  });

  it("RETRACTED: Elsevier's self-pointing retraction marker (golden ret-004, real record)", async () => {
    const v = await verifyReference(
      "Séralini, G.-E., Clair, E., Mesnage, R., Gress, S., Defarge, N., Malatesta, M., Hennequin, D., & de Vendômois, J. S. (2012). Long term toxicity of a Roundup herbicide and a Roundup-tolerant genetically modified maize. Food and Chemical Toxicology, 50(11), 4221–4231. https://doi.org/10.1016/j.fct.2012.08.005",
      world(),
    );
    expect(v.status).toBe("retracted");
    expect(v.reasons[0]).toMatch(/Retraction Watch/);
  });

  it("CHIMERA: real authors on an invented paper, naming their real paper (golden fab-001)", async () => {
    const v = await verifyReference("Bastani, H., & Sungu, A. (2024). Dashboards that predict tutoring outcomes in Gulf universities. Journal of Nothing, 3, 1–9.", world({ byAuthors: [bastaniCr] }));
    expect(v.status).toBe("chimera");
    expect(v.parts?.[0]).toMatchObject({ field: "authors", belongsTo: { doi: "10.1073/pnas.2422633122" } });
    expect(v.reasons[0]).toMatch(/The authors are real: Bastani and Sungu wrote/);
  });

  it("says 'rate-limiting', not 'did not respond', when a registry is busy (keyless OpenAlex budget)", async () => {
    const w = world();
    const deps: RegistryDeps = { ...w, crossrefMatchReference: async () => Promise.reject(new RegistryError("crossref", "rate_limited", "busy", 429)) };
    const v = await verifyReference("Okafor, T. (2021). Caffeine improves essay grades. Journal of Sample Psychology.", deps);
    expect(v.status).toBe("partial");
    expect(v.reasons.join(" ")).toMatch(/Crossref is rate-limiting us right now/);
  });

  it("NOT FOUND, not chimera, when only surnames match and initials differ (common surnames)", async () => {
    const v = await verifyReference("Bastani, X., & Sungu, Y. (2024). Dashboards that predict tutoring outcomes in Gulf universities. Journal of Nothing, 3, 1–9.", world({ byAuthors: [bastaniCr] }));
    expect(v.status).toBe("notfound");
  });
});

describe("traps found while testing", () => {
  it("never verifies the correction NOTICE that Crossref ranks above the paper", async () => {
    const v = await verifyReference(BASTANI_AUTHORS, world({ bib: bibBastani }));
    expect(bibBastani[0].noticeFor).toBeDefined();
    expect(v.matched?.doi).toBe("10.1073/pnas.2422633122");
    expect(v.status).toBe("verified");
  });

  it("safety property: no invented, stitched or mis-cited reference is ever Verified", async () => {
    const fakes = [
      ["Kestin, G. (2025). Generative AI without guardrails can harm learning. PNAS.", world({ bib: bibBastani })],
      ["Smith, J. (2024). ChatGPT and learning: a review. https://doi.org/10.1038/s41598-025-97652-6", world()],
      ["Lee, P. (2022). A completely invented title about tutors and grades. Journal of Things.", world({ bib: [kestinCr, bastaniCr] })],
      [KESTIN(2019), world()],
    ] as const;
    for (const [ref, w] of fakes) expect((await verifyReference(ref, w)).status).not.toBe("verified");
  });
});

describe("the judges' fake reference test", () => {
  it.each([
    ["a made-up title", "The Dubai effect of robot tutors"],
    ["a made-up author", "Fakerson, Q. Z. (2031)."],
    ["a made-up DOI", "10.9999/veracite.fake.2026"],
  ])("never verifies %s", async (_n, input) => {
    expect(splitBibliography(input)).toHaveLength(1);
    expect((await verifyReference(input, world({ bib: [bastaniCr, kestinCr] }))).status).toBe("notfound");
  });

  it("a real DOI on its own is Not yet verified (partial), not a mismatch", async () => {
    const v = await verifyReference("10.1073/pnas.2422633122", world());
    expect(v.status).toBe("partial");
    expect(v.reasons[0]).toMatch(/This DOI exists/);
  });
});
