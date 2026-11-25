import { describe, expect, it } from "vitest";
import { PAGE_TEXT, STRINGS } from "./strings";

const ARABIC = /[؀-ۿ]/;

describe("Arabic / English strings (K43)", () => {
  it("every English key has an Arabic string, written in Arabic", () => {
    for (const k of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
      expect(STRINGS.ar[k], k).toBeTruthy();
      // The switch on the Arabic page reads "English", so a reader can always get back.
      if (k !== "lang.switch") expect(ARABIC.test(STRINGS.ar[k]), `${k} is not Arabic`).toBe(true);
    }
  });
  it("every page title and subtitle has an Arabic version", () => {
    for (const [path, t] of Object.entries(PAGE_TEXT)) {
      expect(ARABIC.test(t.title), path).toBe(true);
      expect(ARABIC.test(t.subtitle), path).toBe(true);
    }
  });
  it("the language switch always names the other language", () => {
    expect(STRINGS.en["lang.switch"]).toBe("العربية");
    expect(STRINGS.ar["lang.switch"]).toBe("English");
  });
  it("registry and product names stay in Latin script so they match the sources", () => {
    expect(PAGE_TEXT["/xray"].subtitle).toMatch(/Crossref/);
    expect(PAGE_TEXT["/xray"].subtitle).toMatch(/OpenAlex/);
  });
});
