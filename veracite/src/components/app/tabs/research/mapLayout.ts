/**
 * Related-papers map layout (K42). Pure and deterministic: the source in the middle, the works it cites on a
 * left arc and the works that cite it on a right arc, each side ordered by year (oldest at the top), node size
 * by citations on a log scale. No physics engine, so the same data always draws the same map.
 */
export interface MapItem {
  id: string;
  year?: number;
  citedBy?: number;
}

export interface MapNode extends MapItem {
  side: "references" | "cited_by";
  x: number;
  y: number;
  r: number;
}

const R_MIN = 6;
const R_MAX = 18;
const PAD = 24;

export function mapLayout(refs: MapItem[], citing: MapItem[], width: number, height: number): { center: { x: number; y: number }; nodes: MapNode[] } {
  const center = { x: width / 2, y: height / 2 };
  const all = [...refs, ...citing];
  const maxLog = Math.max(1, ...all.map((i) => Math.log10(1 + (i.citedBy ?? 0))));
  const radius = (i: MapItem) => R_MIN + (R_MAX - R_MIN) * (Math.log10(1 + (i.citedBy ?? 0)) / maxLog);

  const side = (items: MapItem[], s: MapNode["side"]): MapNode[] => {
    const sorted = [...items].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.id.localeCompare(b.id));
    const n = sorted.length;
    return sorted.map((it, k) => {
      const t = n === 1 ? 0.5 : k / (n - 1); // 0 = top, 1 = bottom
      const y = PAD + R_MAX + t * (height - 2 * (PAD + R_MAX));
      // A gentle arc: nodes in the middle of a side sit further from the centre than those at the ends.
      const reach = width / 2 - PAD - R_MAX;
      const bow = 0.72 + 0.28 * Math.sin(Math.PI * t);
      const dx = reach * bow;
      const r = radius(it);
      const x = s === "references" ? center.x - dx : center.x + dx;
      return { ...it, side: s, x: Math.min(width - r, Math.max(r, x)), y: Math.min(height - r, Math.max(r, y)), r };
    });
  };
  return { center, nodes: [...side(refs, "references"), ...side(citing, "cited_by")] };
}
