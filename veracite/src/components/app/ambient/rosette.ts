/** Guilloche rosette: the interlaced curves engraved on banknotes, drawn from a formula (SVG path data). */
export function rosette(radius: number, depth: number, petals: number, turns: number): string[] {
  return Array.from({ length: turns }, (_, k) => {
    const phase = (k / turns) * ((Math.PI * 2) / petals);
    let d = "";
    for (let i = 0; i <= 480; i++) {
      const a = (i / 480) * Math.PI * 2;
      const r = radius + depth * Math.sin(petals * (a + phase)) + depth * 0.35 * Math.cos(petals * 2.5 * a);
      d += `${i ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
    }
    return `${d}Z`;
  });
}
