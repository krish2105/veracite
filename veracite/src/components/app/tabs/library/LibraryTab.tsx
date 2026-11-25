"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { SaveBookmarklet } from "@/app/save/Bookmarklet";
import { ExportGate, type ExportFormat } from "@/components/app/ExportGate";
import { Card, StatusBadge } from "@/components/app/ui";
import { RelatedPapers } from "@/components/app/tabs/research/RelatedPapers";
import { apaList, apaReference } from "@/components/app/tabs/xray/apa";
import { refList, useRefList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import "@/components/app/tabs/research/research.css";
import { regionOf, summariseBias, type Bar, type BiasFacts } from "@/lib/integrity/bias";
import type { SourceRecord } from "@/lib/types";
import { toBibTeX, toCslJson, toRIS } from "./exports";

const split = (s: string) => [...new Set(s.split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 10);

const TEXT = "text/plain;charset=utf-8";
/** Every download goes through the export gate (Z15). */
const formats = (shown: SourceRecord[]): ExportFormat[] => [
  { label: "APA 7", filename: "references-apa7.txt", mime: TEXT, build: () => `References\n\n${apaList(shown).text}\n`, canIncludeStatement: true },
  { label: "BibTeX", filename: "library.bib", mime: TEXT, build: () => toBibTeX(shown), canIncludeStatement: false },
  { label: "RIS", filename: "library.ris", mime: TEXT, build: () => toRIS(shown), canIncludeStatement: false },
  { label: "CSL-JSON", filename: "library.json", mime: "application/json", build: () => toCslJson(shown), canIncludeStatement: false },
];

const facts = (s: SourceRecord): BiasFacts => {
  const countries = s.quality.countries ?? [];
  return { id: s.id, year: s.year ?? null, countries, regions: [...new Set(countries.map(regionOf))], openAccess: s.quality.openAccess ?? null, oaStatus: null, publisher: s.quality.publisher ?? null, venue: s.venue ?? null, language: null };
};

function Item({ s }: { s: SourceRecord }) {
  return (
    <li>
      {/* Built by code from the registry record; every value is HTML-escaped in apa.ts. */}
      <p className="xrx-apa" dangerouslySetInnerHTML={{ __html: apaReference(s).html }} />
      <div className="xrx-row">
        <StatusBadge status={s.verification.status} />
        {s.url && (
          <a className="btn small" href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => refList.opened(s.id)}>
            <ExternalLink size={13} /> {s.opened ? "Opened" : "Open and read"}
          </a>
        )}
        <button className="btn small" onClick={() => refList.remove(s.id)}><Trash2 size={13} /> Remove</button>
      </div>
      <details className="lib-org">
        <summary>Organise: collection, tags, notes</summary>
        <label>Collection (folder)
          <input defaultValue={s.collections[0] ?? ""} onBlur={(e) => refList.update(s.id, { collections: split(e.target.value).slice(0, 1) })} placeholder="e.g. Thesis" />
        </label>
        <label>Tags, separated by commas
          <input defaultValue={s.tags.join(", ")} onBlur={(e) => refList.update(s.id, { tags: split(e.target.value) })} placeholder="e.g. RCT, schools" />
        </label>
        <label>Notes
          <textarea defaultValue={s.notes} onBlur={(e) => refList.update(s.id, { notes: e.target.value.slice(0, 2000) })} />
        </label>
        <label>Explain it back: what does this source show, in your own words? (the AI never fills this)
          <textarea defaultValue={s.explainBack ?? ""} onBlur={(e) => refList.update(s.id, { explainBack: e.target.value.slice(0, 600) })} />
        </label>
      </details>
      {s.doi && <RelatedPapers doi={s.doi} />}
    </li>
  );
}

function Bars({ title, bars }: { title: string; bars: Bar[] }) {
  if (!bars.length) return null;
  return (
    <div>
      <p className="vx-eyebrow">{title}</p>
      <ul className="lib-bars">
        {bars.map((b) => (
          <li key={b.key}><span>{b.label}</span><i style={{ width: `${Math.max(4, b.pct)}%` }} /><span className="mono muted">{b.count}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function LibraryTab() {
  const { sources, receipts } = useRefList();
  const [gate, setGate] = useState<ExportFormat | null>(null);
  const [text, setText] = useState("");
  const [collection, setCollection] = useState("");
  const [tag, setTag] = useState("");
  const collections = [...new Set(sources.flatMap((s) => s.collections))].sort();
  const tags = [...new Set(sources.flatMap((s) => s.tags))].sort();
  const shown = sources.filter(
    (s) =>
      (!collection || s.collections.includes(collection)) &&
      (!tag || s.tags.includes(tag)) &&
      (!text || `${apaReference(s).text} ${s.notes} ${s.tags.join(" ")}`.toLowerCase().includes(text.toLowerCase())),
  );
  // Computed only once there are sources, so the clock is never read while the page is prerendered.
  const bias = useMemo(() => (sources.length ? summariseBias(sources.map(facts)) : undefined), [sources]);
  const unread = shown.filter((s) => !s.opened).length;
  const unexplained = shown.filter((s) => !s.explainBack?.trim()).length;

  return (
    <AppShell title="Library" subtitle="Your approved sources, kept on this device. Organise them, read them, then export.">
      <div className="xrx">
        {sources.length === 0 ? (
          <Card title="Your library is empty">
            <p className="xr-note">Add verified sources from the <Link href="/xray">X-ray</Link>, a <Link href="/research">Research</Link> session or <Link href="/save">Save a source</Link>. Nothing is added without your click.</p>
          </Card>
        ) : (
          <>
            <Card title={<>Sources · {shown.length} of {sources.length}</>}>
              <div className="lib-filters">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search titles, authors, notes" aria-label="Search your library" />
                <select value={collection} onChange={(e) => setCollection(e.target.value)} aria-label="Collection">
                  <option value="">All collections</option>
                  {collections.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag">
                  <option value="">All tags</option>
                  {tags.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <ul className="xrx-list">
                {shown.map((s) => <Item key={s.id} s={s} />)}
              </ul>
            </Card>

            <Card title={<>Export · {shown.length} source{shown.length === 1 ? "" : "s"} shown</>}>
              {(unread > 0 || unexplained > 0) && (
                <ul className="xrx-warn" aria-label="Before you export">
                  {unread > 0 && <li>You have not opened {unread} of these sources. Read before you cite.</li>}
                  {unexplained > 0 && <li>{unexplained} still need your own one-line explanation (Organise → Explain it back).</li>}
                </ul>
              )}
              <div className="xrx-row">
                {formats(shown).map((f, i) => (
                  <button key={f.label} className={`btn small${i === 0 ? " primary" : ""}`} disabled={!shown.length} onClick={() => setGate(f)}><Download size={13} /> {f.label}</button>
                ))}
              </div>
              <p className="vx-tiny">Each download first shows a short check: unread sources, your own explanations and the AI-use statement. BibTeX, RIS and CSL-JSON open in Zotero and Mendeley.</p>
              {gate && <ExportGate sources={shown} receipts={receipts} format={gate} onClose={() => setGate(null)} />}
            </Card>

            <Card title="Bias lens · facts about your sources, not scores">
              <div className="lib-lens">
                <Bars title="Author countries" bars={bias?.countries.bars ?? []} />
                <Bars title="Publication years" bars={bias?.years.bars ?? []} />
                <Bars title="Publishers" bars={bias?.publishers.bars ?? []} />
              </div>
              <ul className="rs-notes lib-notes">
                {bias?.notes.map((n) => <li key={n.text}>{n.text}</li>)}
              </ul>
            </Card>
          </>
        )}

        <Card title="Save from any page you are reading">
          <SaveBookmarklet />
        </Card>
      </div>
    </AppShell>
  );
}
