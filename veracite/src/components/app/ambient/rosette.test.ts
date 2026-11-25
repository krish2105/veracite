import { describe, expect, it } from "vitest";
import { rosette } from "./rosette";

describe("rosette", () => {
  it("draws one closed curve per turn, within its radius", () => {
    const paths = rosette(100, 20, 12, 5);
    expect(paths).toHaveLength(5);
    for (const d of paths) {
      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
      const nums = d.slice(1, -1).split(/[L ]/).map(Number);
      expect(Math.max(...nums.map(Math.abs))).toBeLessThanOrEqual(127);
      expect(nums.every(Number.isFinite)).toBe(true);
    }
  });
});
