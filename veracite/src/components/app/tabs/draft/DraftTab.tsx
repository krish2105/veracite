"use client";

import AppShell from "@/components/app/AppShell";
import { Card, LabelIcon, Sample, TrustLabel } from "@/components/app/ui";

export function DraftTab() {
  return (
    <AppShell title="Draft Checker" subtitle="Paste a paragraph. Each in-text citation is matched to its reference and the claim is checked against the source."
      actions={<button className="btn primary">Check paragraph</button>}>
      <div className="g2">
        <Card title={<>Your paragraph <Sample /></>}>
          <p className="draft">
            <mark className="verified">Teenagers who use phones in the hour before bed report poorer sleep quality</mark> <cite>(Rahman &amp; Okafor, 2021)</cite>.{" "}
            <mark className="reported">The same pattern appears among adolescents in the Gulf</mark> <cite>(Al Suwaidi &amp; Mensah, 2023)</cite>.{" "}
            <mark className="para">Participants with device use in the final hour before bed reported significantly poorer sleep quality</mark>, which shows the effect is robust.{" "}
            <mark className="notfound">Screen time also causes a 40% drop in exam grades</mark> <cite>(Chen et al., 2019)</cite>.
          </p>
          <div className="summary"><TrustLabel kind="verified" /><TrustLabel kind="reported" /><TrustLabel kind="notfound" /><span className="lbl lbl-ai"><LabelIcon kind="ai" size={12} />Copied too closely</span></div>
        </Card>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div className="note"><b style={{ color: "var(--ok)" }}>● Supported</b>The quote is found in Rahman &amp; Okafor (2021), checked against the abstract.</div>
          <div className="note"><b style={{ color: "var(--warn)" }}>◐ Reported, not checked</b>The source is real, but this detail isn't in its open text.</div>
          <div className="note"><b style={{ color: "var(--ai)" }}>Paraphrase guard</b>81% word overlap with Rahman &amp; Okafor (2021). Put it in quotation marks, or rewrite it in your own words.</div>
          <div className="note"><b style={{ color: "var(--alert)" }}>○ Not supported</b>Chen et al. (2019) is about melatonin; it never mentions exam grades. It's also a causal claim (Skeptic rule S4).</div>
          <div className="note"><b>APA 7 check</b>“Chen et al., 2019” is correct for 3+ authors. Two citations are missing from your reference list.</div>
        </div>
      </div>
    </AppShell>
  );
}
