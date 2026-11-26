/**
 * "No source exists" (Phase 2, case 6). When a question names a specific thing (an event, an organisation, a
 * product: "the AI Club Hackathon 2026 at SP Jain Dubai") and none of the sources the registries returned mentions
 * it, the honest answer is Not found. The real papers that did come back are related reading, not an answer.
 * Pure code, so it works with the AI on or off, and nothing is ever invented to fill the gap.
 */
const strip = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/[’']s$/i, "");
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Runs of two or more capitalised words (years may ride along): the specific things a question is about. */
export function namedPhrases(question: string): string[] {
  const words = question.split(/\s+/).map(strip).filter(Boolean);
  const isName = (w: string) => /^\p{Lu}/u.test(w);
  const isNum = (w: string) => /^\d{2,4}$/.test(w);
  // A question typed In Title Case names nothing in particular.
  if (words.length > 3 && words.filter(isName).length / words.length > 0.6) return [];
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    while (run.length && isNum(run[run.length - 1]) && run.filter(isName).length < 1) run.pop();
    if (run.filter(isName).length >= 2 && run.length <= 6) out.push(run.join(" "));
    run = [];
  };
  words.forEach((w, i) => {
    // The first word of the question is capitalised by grammar, not because it is a name.
    const named = (isName(w) && (i > 0 || w === w.toUpperCase())) || (isNum(w) && run.length > 0);
    if (named) run.push(w);
    else flush();
  });
  flush();
  return [...new Set(out)].slice(0, 4);
}

/** The named things that no source mentions (every word of the name, years aside, in its title or abstract). */
export function missingPhrases(question: string, sources: { title: string; abstract?: string }[]): string[] {
  const texts = sources.map((s) => ` ${norm(`${s.title} ${s.abstract ?? ""}`)} `);
  return namedPhrases(question).filter((p) => {
    const need = norm(p).split(" ").filter((w) => !/^\d+$/.test(w));
    return !texts.some((t) => need.every((w) => t.includes(` ${w} `)));
  });
}
