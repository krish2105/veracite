"use client";

import { explainVerdict } from "@/lib/verify/explain";
import type { Verification } from "@/lib/types";

/** "How this was decided" (K34): what each registry returned and the rule that set the label. Code only. */
export function HowDecided({ v }: { v: Verification }) {
  const e = explainVerdict(v);
  return (
    <details className="xr-why">
      <summary>How this was decided</summary>
      <ul className="xr-trace" aria-label="What each registry returned">
        {e.trace.map((t) => (
          <li key={t.registry} data-state={t.matched ? "match" : t.searches ? "searched" : "skipped"}>
            <b>{t.label}</b>
            <span>{t.matched ? (v.status === "chimera" ? "has a record for one part of it" : "has this paper") : t.searches ? `no match (${t.hits} result${t.hits === 1 ? "" : "s"} looked at)` : "not needed"}</span>
            <span className="mono">{t.searches ? `${t.searches} search${t.searches === 1 ? "" : "es"}` : "–"}</span>
          </li>
        ))}
      </ul>
      {e.fields.length > 0 && <p className="vx-tiny" style={{ margin: "6px 0 0" }}>{e.fields.join(" · ")}</p>}
      <p className="xr-rule">{e.rule}</p>
      <p className="vx-tiny" style={{ margin: 0 }}>{e.footer}</p>
    </details>
  );
}
