import { describe, expect, it } from "vitest";
import { mapLayout, type MapItem } from "./mapLayout";

const item = (id: string, year: number, citedBy: number): MapItem => ({ id, year, citedBy });

describe("mapLayout (K42): a readable citation map without a physics engine", () => {
  const refs = [item("r1", 2012, 900), item("r2", 2006, 20), item("r3", 2015, 5)];
  const citing = [item("c1", 2024, 3), item("c2", 2021, 400)];
  const L = mapLayout(refs, citing, 640, 360);

  it("puts the source in the middle, what it cites on the left, what cites it on the right", () => {
    expect(L.center).toEqual({ x: 320, y: 180 });
    for (const n of L.nodes.filter((n) => n.side === "references")) expect(n.x).toBeLessThan(320);
    for (const n of L.nodes.filter((n) => n.side === "cited_by")) expect(n.x).toBeGreaterThan(320);
  });

  it("orders each side by year, oldest at the top", () => {
    const left = L.nodes.filter((n) => n.side === "references").sort((a, b) => a.y - b.y).map((n) => n.id);
    expect(left).toEqual(["r2", "r1", "r3"]);
  });

  it("sizes nodes by citations on a log scale, within bounds", () => {
    const r = Object.fromEntries(L.nodes.map((n) => [n.id, n.r]));
    expect(r.r1).toBeGreaterThan(r.r2);
    expect(r.r2).toBeGreaterThan(r.r3);
    for (const n of L.nodes) {
      expect(n.r).toBeGreaterThanOrEqual(6);
      expect(n.r).toBeLessThanOrEqual(18);
      expect(n.x - n.r).toBeGreaterThanOrEqual(0);
      expect(n.x + n.r).toBeLessThanOrEqual(640);
      expect(n.y - n.r).toBeGreaterThanOrEqual(0);
      expect(n.y + n.r).toBeLessThanOrEqual(360);
    }
  });

  it("copes with an empty side and missing years", () => {
    const M = mapLayout([], [{ id: "x", citedBy: 0 }], 640, 360);
    expect(M.nodes).toHaveLength(1);
    expect(Number.isFinite(M.nodes[0].y)).toBe(true);
  });
});
