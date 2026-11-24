import Link from "next/link";

const LINKS = [
  ["/lab/vault", "Concept A · Watermark Vault", "3D fly-through landing (UV lamp, counterfeit X-ray)"],
  ["/lab/neural", "Concept B · Neural Crew", "3D agent nervous system (approval gates, pruning)"],
  ["/research", "Research", "Mission control · sources · evidence brief"],
  ["/xray", "Reference X-ray", "Paste a bibliography, catch the fakes"],
  ["/draft", "Draft Checker", "Claims in your paragraph vs their sources"],
  ["/library", "Library", "3D Evidence Galaxy · bias lens · export"],
  ["/trust", "Trust Center", "Governance · model card · data flow"],
  ["/certificate", "Certificate", "Re-verifiable proof for faculty"],
];

export default function Home() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "64px 24px", fontFamily: "var(--font-archivo)" }}>
      <p style={{ fontFamily: "var(--font-martian)", fontSize: 11, letterSpacing: ".14em", color: "#5B4BC4", textTransform: "uppercase" }}>Team 7 · preview build · SAMPLE data</p>
      <h1 style={{ fontStretch: "125%", fontWeight: 800, fontSize: 44, textTransform: "uppercase", margin: "8px 0 28px" }}>Veracite</h1>
      <div style={{ display: "grid", gap: 10 }}>
        {LINKS.map(([href, t, d]) => (
          <Link key={href} href={href} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 18px", border: "1px solid rgba(14,42,35,.16)", borderRadius: 8, textDecoration: "none", color: "#0E2A23", background: "#F7FAF7" }}>
            <b>{t}</b><span style={{ fontFamily: "var(--font-literata)", color: "#41574F" }}>{d}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
