import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { journalChips } from "./journal";
import { parseOpenAlexWork, type OpenAlexWork } from "./openalex";

const kestin = JSON.parse(readFileSync(new URL("./__fixtures__/openalex-kestin.json", import.meta.url), "utf8")) as OpenAlexWork;

describe("journal facts (K40): what indexes list the journal, from OpenAlex", () => {
  it("the OpenAlex record keeps DOAJ, core and listed-in facts", () => {
    const r = parseOpenAlexWork(kestin);
    expect(r.journal).toMatchObject({ inDoaj: true, core: true });
    expect(r.journal?.listedIn).toEqual(expect.arrayContaining(["doaj", "medline", "cwts-core"]));
  });

  it("chips name the well-known lists and count the rest", () => {
    expect(journalChips({ inDoaj: true, core: true, listedIn: ["anvur-class-a", "cwts-core", "doaj", "jufo-1", "medline", "norway-1"] })).toEqual(["DOAJ", "MEDLINE", "CWTS core list", "+3 national lists"]);
  });

  it("says nothing when nothing is known (never 'not indexed')", () => {
    expect(journalChips(undefined)).toEqual([]);
    expect(journalChips({ listedIn: [] })).toEqual([]);
  });
});
