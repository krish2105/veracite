/**
 * Paraphrase guard (task Z09, feature F33, guardrail for plagiarism in docs/05).
 *
 * Flags draft text or notes that copy a source too closely, e.g.
 *   "62% of your words match the source in runs of 5+ words: put it in quotation marks, or rewrite it."
 *
 * Deterministic n-gram overlap, no AI:
 *  - Text inside quotation marks is a quote, not copying: it is left out of the overlap and
 *    instead checked against the source (a quote that isn't in the source is reported).
 *  - Words are lower-cased, accent-folded and lightly stemmed ("examined" ≈ "examines"), so
 *    swapping a tense or plural does not hide a copied passage.
 *  - n-grams made only of common words ("in the case of the") are ignored.
 *
 * What it cannot catch: rewording with synonyms or reordering ideas. It finds patchwriting,
 * not every kind of plagiarism, and it is a prompt to the student, not an accusation.
 */

export type ParaphraseVerdict = "ok" | "close" | "copied";

export interface CopiedSpan {
  /** Character offsets in the draft. */
  start: number;
  end: number;
  text: string;
  words: number;
}

export interface QuoteCheck {
  start: number;
  end: number;
  text: string;
  /** True if the quoted words appear, in order, in the source (after normalisation). */
  inSource: boolean;
}

export interface ParaphraseResult {
  verdict: ParaphraseVerdict;
  /** Share (0–1) of the draft's unquoted words that sit inside an n-gram shared with the source. */
  overlap: number;
  /** Longest copied run, in words. */
  longestRun: number;
  spans: CopiedSpan[];
  quotes: QuoteCheck[];
  /** Number of draft words checked (outside quotation marks). */
  wordsChecked: number;
  message: string;
}

export interface ParaphraseOptions {
  /** n-gram size in words. Default 5. */
  n?: number;
  /** Overlap at or above this is "copied". Default 0.5. */
  copiedOverlap?: number;
  /** Overlap at or above this is "close". Default 0.2. */
  closeOverlap?: number;
  /** A single unquoted run at least this long is "copied". Default 15 words. */
  copiedRun?: number;
  /** A single unquoted run at least this long is "close". Default 8 words. */
  closeRun?: number;
}

const DEFAULTS: Required<ParaphraseOptions> = { n: 5, copiedOverlap: 0.5, closeOverlap: 0.2, copiedRun: 15, closeRun: 8 };

const STOPWORDS = new Set(
  (
    "a an the and or but nor so yet of in on at to for from by with without into onto about as than then " +
    "is are was were be been being am do does did have has had this that these those it its they them their " +
    "there here we our us you your he she his her i me my not no also such which who whom whose what when " +
    "where while how all any each both more most other some can could may might must shall should will would"
  ).split(" "),
);

/** Latin (incl. accents), Greek, Cyrillic, Arabic letters and digits. No \p{} (needs ES2018 target). */
const WORD = /[A-Za-z0-9À-ɏͰ-ϿЀ-ӿ؀-ۿ]+(?:['’][A-Za-z]+)?/g;

/** Straight or curly double quotes, or curly single quotes, around 1–800 characters. */
const QUOTED = /"([^"\n]{1,800})"|“([^”\n]{1,800})”|‘([^’\n]{1,800})’/g;

interface Token {
  norm: string;
  start: number;
  end: number;
}

function stem(w: string): string {
  let s = w.replace(/['’]s$/, "");
  if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

function normWord(w: string): string {
  return stem(w.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ß/g, "ss"));
}

function tokenize(text: string, offset = 0): Token[] {
  const out: Token[] = [];
  WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD.exec(text))) {
    out.push({ norm: normWord(m[0]), start: offset + m.index, end: offset + m.index + m[0].length });
  }
  return out;
}

const isAllStop = (toks: Token[]) => toks.every((t) => STOPWORDS.has(t.norm));

function ngramSet(tokens: Token[], n: number): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    const win = tokens.slice(i, i + n);
    if (!isAllStop(win)) set.add(win.map((t) => t.norm).join(" "));
  }
  return set;
}

/** True if `needle` occurs as a contiguous sequence in `hay`. */
function containsSeq(hay: string[], needle: string[]): boolean {
  if (needle.length === 0) return true;
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** Split the draft into unquoted segments and quotes. */
function splitQuotes(draft: string): { plain: { text: string; offset: number }[]; quotes: { start: number; end: number; inner: string }[] } {
  const plain: { text: string; offset: number }[] = [];
  const quotes: { start: number; end: number; inner: string }[] = [];
  let cursor = 0;
  QUOTED.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = QUOTED.exec(draft))) {
    plain.push({ text: draft.slice(cursor, m.index), offset: cursor });
    quotes.push({ start: m.index, end: m.index + m[0].length, inner: m[1] ?? m[2] ?? m[3] ?? "" });
    cursor = m.index + m[0].length;
  }
  plain.push({ text: draft.slice(cursor), offset: cursor });
  return { plain, quotes };
}

function messageFor(verdict: ParaphraseVerdict, overlap: number, longestRun: number, n: number, badQuotes: number): string {
  const pct = Math.round(overlap * 100);
  let msg: string;
  if (verdict === "copied") {
    msg = `${pct}% of your words match the source in runs of ${n}+ words (longest: ${longestRun} words): put it in quotation marks with a page number, or rewrite it in your own words.`;
  } else if (verdict === "close") {
    msg = `Close to the source in places (${pct}% overlap, longest run ${longestRun} words): rewrite the highlighted parts or quote them.`;
  } else {
    msg = longestRun > 0 ? `Mostly your own wording (${pct}% overlap).` : "Your wording is your own.";
  }
  if (badQuotes > 0) {
    msg += ` ${badQuotes} quote${badQuotes === 1 ? " doesn't" : "s don't"} match the source word for word: check ${badQuotes === 1 ? "it" : "them"}.`;
  }
  return msg;
}

/** Compare a draft (or note) with one source text. */
export function checkParaphrase(draft: string, source: string, options: ParaphraseOptions = {}): ParaphraseResult {
  const o = { ...DEFAULTS, ...options };
  const srcTokens = tokenize(source);
  const srcGrams = ngramSet(srcTokens, o.n);
  const srcNorms = srcTokens.map((t) => t.norm);
  const { plain, quotes } = splitQuotes(draft);

  // Overlap over unquoted text only; n-grams never cross a quotation.
  let wordsChecked = 0;
  let coveredWords = 0;
  const spans: CopiedSpan[] = [];
  for (const seg of plain) {
    const toks = tokenize(seg.text, seg.offset);
    wordsChecked += toks.length;
    const hit = new Array<boolean>(toks.length).fill(false);
    for (let i = 0; i + o.n <= toks.length; i++) {
      const win = toks.slice(i, i + o.n);
      if (isAllStop(win)) continue;
      if (srcGrams.has(win.map((t) => t.norm).join(" "))) for (let k = i; k < i + o.n; k++) hit[k] = true;
    }
    // Close each run of hits into a span (runs never cross segments).
    let runStart = -1;
    for (let i = 0; i <= toks.length; i++) {
      if (i < toks.length && hit[i]) {
        if (runStart < 0) runStart = i;
      } else if (runStart >= 0) {
        const start = toks[runStart].start;
        const end = toks[i - 1].end;
        spans.push({ start, end, text: draft.slice(start, end), words: i - runStart });
        coveredWords += i - runStart;
        runStart = -1;
      }
    }
  }

  const quoteChecks: QuoteCheck[] = quotes.map((q) => ({
    start: q.start,
    end: q.end,
    text: draft.slice(q.start, q.end),
    inSource: containsSeq(srcNorms, tokenize(q.inner).map((t) => t.norm)),
  }));

  const overlap = wordsChecked === 0 ? 0 : coveredWords / wordsChecked;
  const longestRun = spans.reduce((m, s) => Math.max(m, s.words), 0);
  const verdict: ParaphraseVerdict =
    overlap >= o.copiedOverlap || longestRun >= o.copiedRun
      ? "copied"
      : overlap >= o.closeOverlap || longestRun >= o.closeRun
        ? "close"
        : "ok";
  const badQuotes = quoteChecks.filter((q) => !q.inSource).length;

  return {
    verdict,
    overlap: Math.round(overlap * 1000) / 1000,
    longestRun,
    spans,
    quotes: quoteChecks,
    wordsChecked,
    message: messageFor(verdict, overlap, longestRun, o.n, badQuotes),
  };
}

export interface SourceText {
  id: string;
  text: string;
}

const RANK: Record<ParaphraseVerdict, number> = { ok: 0, close: 1, copied: 2 };

/**
 * Compare a draft with several sources (e.g. every source it cites). Returns one result per
 * source, worst first, plus the overall verdict.
 */
export function checkAgainstSources(
  draft: string,
  sources: SourceText[],
  options: ParaphraseOptions = {},
): { verdict: ParaphraseVerdict; results: (ParaphraseResult & { sourceId: string })[] } {
  const results = sources
    .map((s) => ({ sourceId: s.id, ...checkParaphrase(draft, s.text, options) }))
    .sort((a, b) => RANK[b.verdict] - RANK[a.verdict] || b.overlap - a.overlap);
  return { verdict: results[0]?.verdict ?? "ok", results };
}
