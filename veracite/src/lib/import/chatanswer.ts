/**
 * Paste a chatbot answer (K39): ChatGPT-style answers mix prose with a "Sources" list. Only real references can
 * be checked, so this keeps the list, adds DOIs that appear only in the prose, and flags author–year mentions
 * that have no full reference (they cannot be verified at all). Pure, no AI.
 */
import { findCitations } from "@/components/app/tabs/draft/citations";
import { normalizeText } from "@/lib/verify/text";
import { splitBibliography } from "@/lib/verify/split";
import { extractDois } from "./pdftext";

export interface ChatAnswer {
  looksLikeProse: boolean;
  /** Full references from the answer's list, ready for the X-ray. */
  refs: string[];
  /** DOIs mentioned only in the prose. */
  dois: string[];
  /** In-text mentions such as "Smith and Lee (2023)" with no full reference and no DOI beside them. */
  unmatched: string[];
}

const LIST_HEADING = /^[ \t]*(?:sources|references|reference list|bibliography|works cited|citations|further reading)[ \t]*:?[ \t]*$/im;
const STARTS_REF = /^\s*(?:\[\d{1,3}\]|\d{1,3}[.)]|[A-Za-z][.)])?\s*(?:\p{Lu}[\p{L}'’\-]+,\s*\p{Lu}\.|\p{Lu}[\p{L}'’\-]+,\s*\p{Lu}[\p{L}]+,|10\.\d{4,9}\/|https?:\/\/(?:dx\.)?doi\.org\/)/u;
/** "Kestin and colleagues (2025)", "Doe and co-workers (2020)" */
const COLLEAGUES = /(\p{Lu}[\p{L}'’\-]+)\s+and\s+(?:colleagues|co-?workers|co-?authors|team)\s*\((\d{4})\)/gu;

const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+(?=\p{Lu}|\()/u);

export function readChatAnswer(text: string): ChatAnswer {
  const heading = LIST_HEADING.exec(text);
  let prose: string;
  let list: string;
  if (heading && heading.index !== undefined) {
    prose = text.slice(0, heading.index);
    list = text.slice(heading.index + heading[0].length);
  } else {
    const paras = text.split(/\n\s*\n/);
    const isProse = (p: string) => p.trim().length > 120 && !STARTS_REF.test(p) && sentencesOf(p.trim()).length >= 1 && /[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}/.test(p) && (findCitations(p).length > 0 || /\(\d{4}\)/.test(p));
    prose = paras.filter(isProse).join("\n\n");
    list = paras.filter((p) => !isProse(p)).join("\n\n");
  }
  const mentions = [...findCitations(prose).map((c) => ({ raw: c.raw, family: c.families[0], year: c.year, at: c.start })), ...[...prose.matchAll(COLLEAGUES)].map((m) => ({ raw: m[0], family: m[1], year: Number(m[2]), at: m.index! }))];
  const looksLikeProse = prose.trim().length > 0 && (mentions.length > 0 || extractDois(prose).length > 0);
  if (!looksLikeProse) return { looksLikeProse: false, refs: [], dois: [], unmatched: [] };

  const refs = (list.trim() ? splitBibliography(list, 200) : []).map((r) => r.replace(/^\s*(?:\[\d{1,3}\]|\d{1,3}[.)])\s+/, ""));
  const listText = normalizeText(refs.join(" "));
  const dois = extractDois(prose).filter((d) => !refs.some((r) => r.toLowerCase().includes(d)));
  const sentences = sentencesOf(prose);
  const unmatched: string[] = [];
  for (const m of mentions) {
    if (!m.family) continue;
    const inList = listText.includes(normalizeText(m.family)) && (!m.year || listText.includes(String(m.year)));
    // A DOI in the same sentence identifies the work, so the mention is covered.
    let pos = 0;
    const sentence = sentences.find((s) => { const end = pos + s.length + 1; const hit = m.at >= pos && m.at < end; pos = end; return hit; }) ?? "";
    if (!inList && !extractDois(sentence).length && !unmatched.includes(m.raw)) unmatched.push(m.raw);
  }
  return { looksLikeProse: true, refs, dois, unmatched };
}
