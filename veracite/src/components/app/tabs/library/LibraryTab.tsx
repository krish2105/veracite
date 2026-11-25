"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
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

function download(name: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
  const { sources } = useRefList();
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
            <p className="xr-note">Add verified sources from the <Link href="/xray">X-ray</Link> or a <Link href="/research">Research</Link> session. Nothing is added without your click.</p>
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
                <button className="btn small primary" disabled={!shown.length} onClick={() => download("references-apa7.txt", `References\n\n${apaList(shown).text}\n`)}><Download size={13} /> APA 7</button>
                <button className="btn small" disabled={!shown.length} onClick={() => download("library.bib", toBibTeX(shown))}><Download size={13} /> BibTeX</button>
                <button className="btn small" disabled={!shown.length} onClick={() => download("library.ris", toRIS(shown))}><Download size={13} /> RIS</button>
                <button className="btn small" disabled={!shown.length} onClick={() => download("library.json", toCslJson(shown), "application/json")}><Download size={13} /> CSL-JSON</button>
              </div>
              <p className="vx-tiny">BibTeX, RIS and CSL-JSON open in Zotero and Mendeley. Your AI-use statement is on the <Link href="/xray">X-ray</Link> page.</p>
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
      </div>
    </AppShell>
  );
}
