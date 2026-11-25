/**
 * K23/K24: the screen areas of the 3D home page, in pixels. The CSS in home-hero.css uses the same clamps, so the
 * 3D note can be placed in the space the headline, its labels and the three buttons leave free.
 */
import { MIN_WIDE } from "./pickHome";

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));

/** Upright phones and tablets stack the headline, the note and the buttons. */
export const isUpright = (width: number, height: number) => width < MIN_WIDE && height > width;

/** The camera sees more sideways on upright screens, so the vault still fits. */
export const fovFor = (aspect: number) => (aspect < 1 ? 60 : 42);

export function regions(width: number, height: number) {
  if (isUpright(width, height)) {
    return { textRight: 0, pinSpace: 0, textBottom: 64 + clamp(150, height * 0.26, 260), cardsTop: height - 40 - 76 };
  }
  const pad = clamp(20, width * 0.05, 90);
  const cards = clamp(104, height * 0.17, 170);
  return {
    textRight: pad + Math.min(500, width * 0.32),
    /** The three labels beside the note: their width plus the leader line. */
    pinSpace: clamp(170, width * 0.14, 250) + 56,
    textBottom: 84,
    cardsTop: height - 52 - cards,
  };
}

/** Centre and width (px) of the specimen note, whose height is 0.625 × its width. */
export function noteRect(width: number, height: number) {
  const g = regions(width, height);
  const upright = isUpright(width, height);
  const left = upright ? 12 : g.textRight + 24;
  const right = upright ? width - 12 : width - g.pinSpace - 16;
  const top = upright ? g.textBottom + 6 : g.textBottom;
  const bottom = g.cardsTop - 80; // the stamp hangs below the note
  return { cx: (left + right) / 2, cy: (top + bottom) / 2, width: Math.min(right - left, (bottom - top) / 0.625, 760) };
}
