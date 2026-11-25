/**
 * Citation styles through citation-js + citeproc (K29). Loaded with a dynamic import only when a student
 * picks a style other than APA 7, so pages stay light. Pure formatting of registry records: no AI.
 */
import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import chicago from "./csl/chicago";
import harvard from "./csl/harvard";
import ieee from "./csl/ieee";
import mla from "./csl/mla";
import type { CslItem, StyledEntry } from "./styles";

export type EngineStyle = "mla" | "harvard" | "ieee" | "chicago";

const XML: Record<EngineStyle, string> = { mla, harvard, ieee, chicago };
const NAME = (s: EngineStyle) => `veracite-${s}`;
/** Cite Them Right is a British style: British quotes, punctuation outside them, "25 November 2026". */
const LANG: Record<EngineStyle, string> = { mla: "en-US", harvard: "en-GB", ieee: "en-US", chicago: "en-US" };

/**
 * en-GB derived from the bundled en-US locale: only quotes, punctuation-in-quote and the text date
 * order differ for the styles we use, so no extra file is downloaded.
 */
export function britishLocale(enUS: string): string {
  return enUS
    .replace(/xml:lang="en-US"/, 'xml:lang="en-GB"')
    .replace(/<style-options punctuation-in-quote="true"\s*\/>/, '<style-options punctuation-in-quote="false"/>')
    .replace(/<term name="open-quote">“<\/term>/, '<term name="open-quote">‘</term>')
    .replace(/<term name="close-quote">”<\/term>/, '<term name="close-quote">’</term>')
    .replace(/<term name="open-inner-quote">‘<\/term>/, '<term name="open-inner-quote">“</term>')
    .replace(/<term name="close-inner-quote">’<\/term>/, '<term name="close-inner-quote">”</term>')
    .replace(/<date form="text">[\s\S]*?<\/date>/, '<date form="text"><date-part name="day" suffix=" "/><date-part name="month" suffix=" "/><date-part name="year"/></date>');
}

let ready = false;
function setup() {
  if (ready) return;
  const config = plugins.config.get("@csl");
  for (const s of Object.keys(XML) as EngineStyle[]) if (!config.styles.has(NAME(s))) config.styles.add(NAME(s), XML[s]);
  if (!config.locales.has("en-GB")) config.locales.add("en-GB", britishLocale(config.locales.get("en-US")));
  ready = true;
}

/** citeproc's HTML wraps each entry in divs; inline them so an entry can sit inside a <p>. */
const inlineHtml = (html: string) =>
  html
    .trim()
    .replace(/^<div[^>]*class="csl-entry"[^>]*>|<\/div>$/g, "")
    .replace(/<div class="csl-left-margin">/g, '<span class="csl-left-margin">')
    .replace(/<div class="csl-right-inline">/g, '<span class="csl-right-inline">')
    .replace(/<\/div>/g, "</span>")
    .trim();

export function bibliography(style: EngineStyle, items: CslItem[]): StyledEntry[] {
  setup();
  const cite = new Cite(items as never);
  const opts = { style: NAME(style), lang: LANG[style], asEntryArray: true as const };
  const html = cite.format("bibliography", { ...opts, format: "html" }) as Array<[string, string]>;
  const text = new Map(cite.format("bibliography", { ...opts, format: "text" }) as Array<[string, string]>);
  return html.map(([id, h]) => ({ id, html: inlineHtml(h), text: (text.get(id) ?? "").replace(/\s+/g, " ").trim() }));
}

export function citation(style: EngineStyle, items: CslItem[], id: string): string {
  setup();
  return String(new Cite(items as never).format("citation", { style: NAME(style), lang: LANG[style], entry: id, format: "text" } as never)).trim();
}
