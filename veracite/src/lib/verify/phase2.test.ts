import { describe, expect, it } from "vitest";
import { parseReference } from "./parse";

describe("Phase 2 formats (26 Nov): parsed by format, not by reference", () => {
  it("Vancouver: SURNAME INITIALS list, title, then 'Journal year;vol:pages'", () => {
    const r = parseReference("SMITH JA, O'NEIL B, VAN DYKE C. Sleep and memory in adults. Sleep Med 2019;12:101-9.");
    expect(r.authors?.map((a) => a.family)).toEqual(["Smith", "O'NEIL".length > 2 ? "O'neil" : "", "Van dyke"]);
    expect(r.title).toBe("Sleep and memory in adults");
    expect(r.year).toBe(2019);
    expect(r.venue).toBe("Sleep Med");
  });
  it("a web page cited as 'Title. Organisation. link' has the organisation as author and no year", () => {
    const r = parseReference("Air quality guidelines. European Environment Agency. https://www.eea.europa.eu/topics/air");
    expect(r.title).toBe("Air quality guidelines");
    expect(r.authors).toEqual([{ family: "European Environment Agency" }]);
    expect(r.year).toBeUndefined();
    expect(r.url).toContain("eea.europa.eu");
  });
  it("APA references are parsed as before", () => {
    const r = parseReference("Kahneman, D., & Tversky, A. (1981). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291.");
    expect(r.authors?.[0].family).toBe("Kahneman");
    expect(r.year).toBe(1981);
    expect(r.title).toBe("Prospect theory: An analysis of decision under risk");
  });
});
