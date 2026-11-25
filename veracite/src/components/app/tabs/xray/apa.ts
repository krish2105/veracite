/**
 * APA 7 reference list from registry records (K19). Pure code: no model writes any of this.
 * Capitalisation is kept exactly as the registry holds it (converting to sentence case automatically would
 * damage proper nouns), so the UI asks the student to check it.
 * Interim formatter: Avighna's citation-js export (A06) can replace it behind the same two functions.
 */
import type { Author, SourceRecord } from "@/lib/types";

export interface Formatted {
  text: string;
  html: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** "Hamsa" → "H." · "Jean-Paul" → "J.-P." · "H. A." → "H. A." */
export function initials(given: string | undefined): string {
  return (given ?? "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part.split("-").filter(Boolean).map((p) => `${p[0].toUpperCase()}.`).join("-"))
    .join(" ");
}

const name = (a: Author) => (a.given ? `${a.family}, ${initials(a.given)}` : a.family);

export function apaAuthors(authors: Author[]): string {
  const n = authors.map(name);
  if (n.length <= 1) return n.join("");
  if (n.length > 20) return `${n.slice(0, 19).join(", ")}, . . . ${n[n.length - 1]}`;
  return `${n.slice(0, -1).join(", ")}, & ${n[n.length - 1]}`;
}

const stop = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);

export function apaReference(r: SourceRecord): Formatted {
  // Parts are [text, italic?] pairs, so the plain and the formatted versions can never differ.
  const parts: [string, boolean?][] = [];
  const date = `(${r.year ?? "n.d."}).`;
  const standalone = r.type === "preprint" || r.type === "book" || r.type === "report" || r.type === "web";
  const authors = apaAuthors(r.authors);
  const title: [string, boolean] = [stop(r.title), standalone];

  if (authors) parts.push([`${stop(authors)} ${date} `], title);
  else parts.push(title, [` ${date}`]);

  if (r.venue && !standalone) {
    parts.push([" "], [r.venue, true]);
    if (r.volume) parts.push([", "], [r.volume, true], [r.issue ? `(${r.issue})` : ""]);
    if (r.pages) parts.push([`, ${r.pages.replace(/(\d)-(\d)/, "$1–$2")}`]);
    parts.push(["."]);
  } else if (r.venue) {
    parts.push([` ${stop(r.venue)}`]);
  }
  const link = r.doi ? `https://doi.org/${r.doi}` : r.url;
  if (link) parts.push([` ${link}`]);

  return {
    text: parts.map(([t]) => t).join(""),
    html: parts.map(([t, i]) => (i && t ? `<i>${esc(t)}</i>` : esc(t))).join(""),
  };
}

/** Alphabetical by first author, then year, as APA 7 requires. */
export function apaList(records: SourceRecord[]): Formatted {
  const key = (r: SourceRecord) => `${r.authors.length ? apaAuthors(r.authors) : r.title} ${r.year ?? ""}`.toLowerCase();
  const items = [...records].sort((a, b) => key(a).localeCompare(key(b), "en")).map(apaReference);
  return {
    text: items.map((i) => i.text).join("\n\n"),
    html: items.map((i) => `<p style="margin:0 0 12px;padding-left:36px;text-indent:-36px;line-height:2">${i.html}</p>`).join(""),
  };
}
