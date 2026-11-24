/**
 * PII scrubber (task Z05, feature F41, guardrail G14).
 *
 * Removes personal data from text BEFORE it is sent to any AI model. Pure, deterministic,
 * no dependencies: the LLM gateway (Krishna, K06) calls `scrubPII` on every prompt.
 *
 * What it removes: emails, phone numbers (UAE + international), Emirates ID numbers,
 * payment card numbers (Luhn-checked), IBANs (mod-97-checked), labelled student IDs and
 * passport numbers, and API keys / tokens.
 * What it keeps: DOIs, ISBNs, years, volumes, issues, page ranges and article numbers, so a
 * scrubbed reference list is still a usable reference list.
 * What it cannot do: names. Spotting a person's name needs a model, and APA references are
 * full of author names that must stay. The gateway never sends the student's own name.
 *
 * The original values are never returned or logged: only the kind and count of each redaction.
 */

export type PiiKind =
  | "email"
  | "phone"
  | "emirates_id"
  | "card"
  | "iban"
  | "student_id"
  | "passport"
  | "secret";

export interface ScrubResult {
  /** The text with every detected item replaced by a placeholder such as `[EMAIL]`. */
  text: string;
  /** How many of each kind were removed (no original values). */
  redactions: { kind: PiiKind; count: number }[];
  total: number;
}

export const PII_PLACEHOLDER: Record<PiiKind, string> = {
  email: "[EMAIL]",
  phone: "[PHONE]",
  emirates_id: "[EMIRATES_ID]",
  card: "[CARD]",
  iban: "[IBAN]",
  student_id: "[STUDENT_ID]",
  passport: "[PASSPORT]",
  secret: "[SECRET]",
};

export interface Span {
  start: number;
  end: number;
  kind: PiiKind;
}

/** Spans that look numeric but are bibliographic and must never be redacted. */
const PROTECTED: RegExp[] = [
  /\b10\.\d{4,9}\/[^\s"<>]+/g, // DOIs (incl. SICI DOIs with brackets)
  /\bISBN(?:-1[03])?:?\s*[\dXx][\dXx -]{8,16}[\dXx]/g, // ISBNs
  /\barXiv:\s*\d{4}\.\d{4,5}(?:v\d+)?/gi, // arXiv IDs
];

const digitsOf = (s: string) => s.replace(/\D/g, "");

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function ibanValid(raw: string): boolean {
  const s = raw.replace(/\s/g, "").toUpperCase();
  if (s.length < 15 || s.length > 34) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const val = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const d of val) rem = (rem * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return rem === 1;
}

type Detector = {
  kind: PiiKind;
  re: RegExp;
  /** Optional check on the match; return false to skip it. */
  accept?: (m: RegExpExecArray) => boolean;
  /** Optional: redact only part of the match (e.g. the value after a label). */
  part?: (m: RegExpExecArray) => { start: number; end: number } | null;
};

/** Order matters: earlier detectors win when two matches overlap. */
const DETECTORS: Detector[] = [
  // API keys and tokens (Groq, OpenAI-style, GitHub, AWS, Google, JWT, Bearer headers)
  { kind: "secret", re: /\b(?:gsk|sk|pk|rk)[-_](?:live[-_]|test[-_]|proj[-_])?[A-Za-z0-9_-]{16,}/g },
  { kind: "secret", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/g },
  { kind: "secret", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: "secret", re: /\bAIza[0-9A-Za-z_-]{30,}/g },
  { kind: "secret", re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  {
    kind: "secret",
    re: /\bBearer\s+([A-Za-z0-9._~+/-]{20,}=*)/g,
    part: (m) => ({ start: m.index + m[0].length - m[1].length, end: m.index + m[0].length }),
  },

  { kind: "email", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },

  // Emirates ID: 784-YYYY-NNNNNNN-N
  { kind: "emirates_id", re: /\b784[ -]?\d{4}[ -]?\d{7}[ -]?\d\b/g },

  // IBAN (e.g. AE07 0331 2345 6789 0123 456), confirmed with the mod-97 check
  {
    kind: "iban",
    re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?\b/g,
    accept: (m) => ibanValid(m[0]),
  },

  // Payment cards: 13–19 digits that pass the Luhn check
  {
    kind: "card",
    re: /\b\d(?:[ -]?\d){12,18}\b/g,
    accept: (m) => {
      const d = digitsOf(m[0]);
      return d.length >= 13 && d.length <= 19 && luhnValid(d);
    },
  },

  // Labelled IDs: "Student ID: SPJ12345", "roll no. 42-117". The label (ID / no. / number) is
  // required so that ordinary prose such as "student 2023 cohort" is left alone.
  {
    kind: "student_id",
    re: /\b(?:student|matric(?:ulation)?|roll|enrol(?:l)?ment|registration|admission)\s*(?:id|no\.?|number|num|#)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9/-]{3,19})\b/gi,
    accept: (m) => /\d/.test(m[1]),
    part: (m) => {
      const start = m.index + m[0].length - m[1].length;
      return { start, end: start + m[1].length };
    },
  },
  // "passport no. N1234567" or "passport N1234567" (unlabelled only if letters AND digits,
  // so "vaccine passport 2021" is left alone)
  {
    kind: "passport",
    re: /\bpassport\s*(no\.?|number|num|#)?\s*[:#-]?\s*([A-Za-z0-9]{6,12})\b/gi,
    accept: (m) => /\d/.test(m[2]) && (m[1] !== undefined || /[A-Za-z]/.test(m[2])),
    part: (m) => {
      const start = m.index + m[0].length - m[2].length;
      return { start, end: start + m[2].length };
    },
  },

  // Phones: international (+971 50 123 4567, 00971…) and UAE local (050 123 4567, 04 123 4567)
  {
    kind: "phone",
    re: /(?:\+|\b00)\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){2,5}\b/g,
    accept: (m) => {
      const n = digitsOf(m[0]).length;
      return n >= 8 && n <= 15;
    },
  },
  { kind: "phone", re: /\b05\d(?:[ -]?\d){7}\b/g },
  { kind: "phone", re: /\b0[2-9][ -]?\d{3}[ -]?\d{4}\b/g },
];

function protectedSpans(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (const re of PROTECTED) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push({ start: m.index, end: m.index + m[0].length });
  }
  return out;
}

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end && b.start < a.end;

/** Find PII spans without changing the text. */
export function findPII(text: string): Span[] {
  const guarded = protectedSpans(text);
  const taken: Span[] = [];
  for (const det of DETECTORS) {
    det.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = det.re.exec(text))) {
      if (m[0].length === 0) {
        det.re.lastIndex++;
        continue;
      }
      if (det.accept && !det.accept(m)) continue;
      const range = det.part ? det.part(m) : { start: m.index, end: m.index + m[0].length };
      if (!range) continue;
      const span: Span = { ...range, kind: det.kind };
      if (guarded.some((g) => overlaps(g, span))) continue;
      if (taken.some((t) => overlaps(t, span))) continue;
      taken.push(span);
    }
  }
  return taken.sort((a, b) => a.start - b.start);
}

/** Replace personal data with placeholders. Safe to call on any text, including reference lists. */
export function scrubPII(text: string): ScrubResult {
  const spans = findPII(text);
  let out = "";
  let cursor = 0;
  const counts = new Map<PiiKind, number>();
  for (const s of spans) {
    out += text.slice(cursor, s.start) + PII_PLACEHOLDER[s.kind];
    cursor = s.end;
    counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1);
  }
  out += text.slice(cursor);
  const redactions = Array.from(counts, ([kind, count]) => ({ kind, count }));
  return { text: out, redactions, total: spans.length };
}

/** True if the text contains anything `scrubPII` would remove. */
export function hasPII(text: string): boolean {
  return findPII(text).length > 0;
}
