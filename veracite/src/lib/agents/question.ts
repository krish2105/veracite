/**
 * Can this text be searched as a research question at all? (K54) Pure code, so it works in every mode, AI on or off.
 * Found on 26 Nov 2026: "mjbkjkll;;" got a generic plan ("current state of research on topic") and unrelated papers.
 * This only catches text with no usable words; whether a real sentence is clear enough is the Planner's call.
 */
const LATIN = /^[a-zA-ZÀ-ɏ]+$/;
const VOWEL = /[aeiouyáéíóúàèìòùäëïöüâêîôûãõåæøœ]/i;

/** A Latin-script token that could be a word: has a vowel and no run of five or more consonants. Acronyms pass elsewhere. */
function wordLike(t: string): boolean {
  return VOWEL.test(t) && !/[^aeiouyáéíóúàèìòùäëïöüâêîôûãõåæøœ]{5,}/i.test(t);
}

export function looksUnclear(question: string): boolean {
  const tokens = question.match(/\p{L}{2,}/gu) ?? [];
  if (tokens.length < 2) return true; // one fragment, or only digits and symbols
  const latin = tokens.filter((t) => LATIN.test(t));
  if (latin.length < tokens.length) return false; // other scripts (Arabic, Chinese…): leave the judgment to the Planner
  return !latin.some((t) => t.length >= 3 && wordLike(t));
}

export const UNCLEAR_REASON = "This does not read as a question: it needs at least two real words.";
