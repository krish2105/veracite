import { describe, expect, it } from "vitest";
import { printDoc } from "./printDoc";

describe("printDoc: the reference list as a page the browser can save as PDF (K56)", () => {
  const doc = printDoc('<p style="margin:0 0 12px">Bastani, H. (2025). <i>Title</i>.</p>', 'References <APA 7> & more');
  it("is a complete A4 document that keeps the formatted list as it is", () => {
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).toContain("@page");
    expect(doc).toContain("<i>Title</i>");
  });
  it("escapes the title, so a style name can never inject markup", () => {
    expect(doc).toContain("<title>References &lt;APA 7&gt; &amp; more</title>");
    expect(doc).not.toContain("<APA 7>");
  });
  it("says where the list came from", () => {
    expect(doc).toContain("Formatted by Veracite from public registry records");
  });
});
