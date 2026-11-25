/** K23: where the labelled fake note sits on the home page, for any laptop or projector size. */
import { describe, expect, it } from "vitest";
import { noteRect, regions } from "./stage";

const SCREENS: [number, number][] = [[1024, 640], [1152, 720], [1280, 800], [1440, 900], [1800, 1005], [2560, 1300]];

describe("noteRect", () => {
  it.each(SCREENS)("keeps the note clear of the text, labels and cards at %i × %i", (w, h) => {
    const r = noteRect(w, h);
    const g = regions(w, h);
    const half = { w: r.width / 2, h: (r.width * 0.625) / 2 };
    expect(r.cx - half.w).toBeGreaterThanOrEqual(g.textRight);
    expect(r.cx + half.w).toBeLessThanOrEqual(w - g.pinSpace);
    expect(r.cy - half.h).toBeGreaterThanOrEqual(70); // below the top bar
    expect(r.cy + half.h).toBeLessThanOrEqual(g.cardsTop - 70); // room for the stamp
    expect(r.width).toBeGreaterThanOrEqual(280);
  });
  it("stops growing on very large screens", () => expect(noteRect(3200, 1800).width).toBeLessThanOrEqual(780));
});
