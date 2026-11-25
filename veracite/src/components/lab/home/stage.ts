/**
 * K23: the screen areas of the 3D home page, in pixels. The CSS in home-hero.css uses the same clamps, so the
 * 3D note can be placed in the space the headline, its labels and the three cards leave free.
 */
const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));

export function regions(width: number, height: number) {
  const pad = clamp(20, width * 0.05, 90);
  const cards = clamp(104, height * 0.17, 170);
  return {
    textRight: pad + Math.min(500, width * 0.32),
    /** The three labels beside the note: their width plus the leader line. */
    pinSpace: clamp(170, width * 0.14, 250) + 56,
    cardsTop: height - 52 - cards,
  };
}

/** Centre and width (px) of the specimen note, whose height is 0.625 × its width. */
export function noteRect(width: number, height: number) {
  const g = regions(width, height);
  const left = g.textRight + 24;
  const right = width - g.pinSpace - 16;
  const top = 84;
  const bottom = g.cardsTop - 80;
  return { cx: (left + right) / 2, cy: (top + bottom) / 2, width: Math.min(right - left, (bottom - top) / 0.625, 760) };
}
