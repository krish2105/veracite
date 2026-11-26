import { describe, expect, it } from "vitest";
import { appendStatement, exportGate, type GateSource } from "./gate";

const src = (id: string, over: Partial<GateSource> = {}): GateSource => ({ id, title: `Paper ${id}`, opened: true, explainBack: "Screens before bed cut sleep by 20 minutes.", status: "verified", ...over });

describe("export gate", () => {
  it("a clean list: everything opened, explained and verified", () => {
    const g = exportGate([src("a"), src("b")]);
    expect(g.clean).toBe(true);
    expect(g.canExport).toBe(true);
    expect(g.lines).toEqual([
      { level: "ok", text: "You opened all 2 sources." },
      { level: "ok", text: "Every source has your own one-line explanation." },
    ]);
  });

  it("unread and unexplained sources are warnings, not blocks: the student decides", () => {
    const g = exportGate([src("a", { opened: false }), src("b", { explainBack: "" }), src("c", { explainBack: "it shows" })]);
    expect(g.canExport).toBe(true);
    expect(g.clean).toBe(false);
    expect(g.unread.map((s) => s.id)).toEqual(["a"]);
    expect(g.unexplained.map((s) => s.id)).toEqual(["b", "c"]); // under 12 characters is not an explanation
    expect(g.lines.map((l) => l.text)).toEqual([
      "You have not opened 1 source. Read before you cite.",
      "2 sources have no explanation in your own words yet.",
    ]);
  });

  it("partial or mismatch → check by hand", () => {
    const g = exportGate([src("a", { status: "partial" }), src("b", { status: "mismatch" })]);
    expect(g.flagged).toHaveLength(2);
    expect(g.lines.at(-1)).toEqual({ level: "warn", text: "2 sources were only partly confirmed or had a mismatched detail. Check them by hand." });
  });

  it("Phase 2: a Mismatch, Retracted or Not found source is warned about, and the student decides (it stays marked)", () => {
    for (const status of ["chimera", "retracted", "notfound"] as const) {
      const g = exportGate([src("a"), src("x", { status })]);
      expect(g.canExport, status).toBe(true);
      expect(g.blocked, status).toHaveLength(1);
      expect(g.lines[0]).toMatchObject({ level: "warn" });
      expect(g.lines[0].text).toMatch(/marked in every export/);
    }
  });

  it("an empty list can't be exported", () => {
    const g = exportGate([]);
    expect(g.canExport).toBe(false);
    expect(g.lines).toEqual([{ level: "block", text: "There is nothing to export yet." }]);
  });

  it("appends the tool reference and the statement to an APA list", () => {
    expect(appendStatement("References\n\nA. (2024). T.\n\n", "I used Veracite…", "Team 7. (2026). Veracite (Version 0.1) [AI research assistant].")).toBe(
      "References\n\nA. (2024). T.\n\nTeam 7. (2026). Veracite (Version 0.1) [AI research assistant].\n\n---\nAI use statement\n\nI used Veracite…\n",
    );
  });
});
