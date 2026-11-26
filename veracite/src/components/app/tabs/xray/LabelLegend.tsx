"use client";

import { StatusBadge } from "@/components/app/ui";
import type { RefStatus } from "@/lib/types";

const MEANING: [RefStatus, string][] = [
  ["verified", "Two public registries have it, and the title, first author and year match."],
  ["partial", "Not fully checked: only partly confirmed, a web page, or a registry did not answer. Check it yourself."],
  ["mismatch", "Needs fix: the paper exists, but a detail you typed is wrong. You accept or reject the correction."],
  ["chimera", "Mismatch: the DOI, title or authors belong to different real papers (a chimera). Do not cite it."],
  ["retracted", "The paper was withdrawn by its publisher. Do not cite it as evidence."],
  ["notfound", "Not found: Crossref, OpenAlex and arXiv were searched and none has it. Nothing is swapped in."],
];

/** What every label means, on screen (hackathon day-of requirement 2). */
export function LabelLegend() {
  return (
    <details className="xrx-legend" open>
      <summary>What the labels mean</summary>
      <dl>
        {MEANING.map(([s, text]) => (
          <div key={s}>
            <dt><StatusBadge status={s} /></dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p className="vx-tiny">Labels are set by code from Crossref, OpenAlex and arXiv. No AI is used on this page, so nothing here is an AI suggestion.</p>
    </details>
  );
}
