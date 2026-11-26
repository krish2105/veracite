"use client";

import { useState } from "react";
import type { ChimeraPart, FieldName } from "@/lib/types";

const LABEL: Record<FieldName, string> = { doi: "DOI", title: "Title", authors: "Authors", year: "Year", venue: "Journal" };

type Origin = NonNullable<ChimeraPart["belongsTo"]>;
/** "Bastani, Bastani, Sungu et al." + 2025 → "Bastani et al. (2025)" */
const short = (b: Origin) => `${b.authors.split(",")[0].replace(/ et al\.$/, "").trim()}${/,| et al\./.test(b.authors) ? " et al." : ""} (${b.year ?? "n.d."})`;

/** One short line per slice: the slices have a fixed height, and the full story is already in the reasons. */
function caption(p: ChimeraPart): string {
  if (p.belongsTo) {
    if (p.field === "doi") return `DOI · real, but it is ${short(p.belongsTo)}`;
    return `${LABEL[p.field]} · real: ${short(p.belongsTo)}`;
  }
  if (p.field === "authors") return "Authors · never wrote that paper";
  if (p.field === "title") return "Title · no paper has this title";
  return `${LABEL[p.field]} · ${p.note ?? "no matching record"}`;
}

/** Full sentence for screen readers. */
function describe(p: ChimeraPart): string {
  return p.belongsTo
    ? `${LABEL[p.field]} "${p.claimed}" belongs to "${p.belongsTo.title}" by ${p.belongsTo.authors}, ${p.belongsTo.year ?? "no date"}.`
    : `${LABEL[p.field]} "${p.claimed}": ${p.note ?? "no matching record"}.`;
}

/**
 * A stitched reference, taken apart: each slice is one part of what was pasted, labelled with the real paper it
 * came from (or why it matches nothing). Uses the existing .chim styles; click to open and close.
 */
export function ChimeraPanel({ n, parts }: { n?: number; parts?: ChimeraPart[] }) {
  const [open, setOpen] = useState(true);
  if (!parts?.length) {
    return (
      <div className="note" style={{ minHeight: 200, alignContent: "center" }}>
        <b>No chimera yet</b>
        When a reference is stitched together from parts of real ones (a real title with the wrong authors, or a real DOI on an
        invented title), it is taken apart here. SP Jain&apos;s integrity policy §h(ix) warns about exactly this.
      </div>
    );
  }
  const slices = parts.slice(0, 3);
  const realDoi = parts.some((p) => p.field === "doi" && p.belongsTo);
  return (
    <>
      <p className="vx-tiny" style={{ marginTop: 0 }}>
        Reference {n} · built from parts of real references (SP Jain policy §h(ix)) · click to {open ? "reassemble" : "take apart"}
      </p>
      {realDoi && <p className="vx-tiny" style={{ marginTop: 0 }}><b>A DOI-only check would pass this reference:</b> its DOI is real, but it belongs to a different paper.</p>}
      <div
        className={`chim ${open ? "open" : ""}`}
        style={{ marginTop: 64 }}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-pressed={open}
        aria-label={`Reference ${n ?? ""} taken apart. ${slices.map(describe).join(" ")}`}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
      >
        <div className="chim-card">
          <div className="chim-void">VOID</div>
          {slices.map((p, i) => (
            <div key={p.field} className={`chim-slice ${"abc"[i]}`} title={describe(p)}>
              {p.claimed.length > 70 ? `${p.claimed.slice(0, 68)}…` : p.claimed}
              <small>{caption(p)}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
