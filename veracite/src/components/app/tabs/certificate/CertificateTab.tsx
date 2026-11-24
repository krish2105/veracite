"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, RefreshCw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { LabelIcon, TrustLabel } from "@/components/app/ui";
import { SOURCES } from "@/components/app/data";

function Rosette() {
  const paths = [0, 1, 2].map((k) => {
    const R = 120, r = [36, 45, 30][k], d = [70, 52, 44][k]; const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
    const loops = r / g(R, r); let s = "";
    for (let i = 0; i <= 1400; i++) { const t = (i / 1400) * Math.PI * 2 * loops; const x = 150 + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t); const y = 150 + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t); s += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }
    return s;
  });
  return <svg className="cert-ros" viewBox="0 0 300 300" aria-hidden>{paths.map((p, i) => <path key={i} d={p} fill="none" stroke={i === 1 ? "var(--accent)" : "var(--micro)"} strokeWidth=".7" opacity=".7" />)}</svg>;
}

export function CertificateTab() {
  const [qr, setQr] = useState("");
  useEffect(() => { QRCode.toDataURL("https://veracite.example/certificate#SAMPLE-7f3a9c", { margin: 0, width: 240 }).then(setQr); }, []);
  return (
    <AppShell title="Verification Certificate" subtitle="Attach to your submission. Your professor scans it and Veracite re-checks every reference live."
      actions={<><button className="btn"><RefreshCw size={14} /> Re-verify now</button><button className="btn primary"><Download size={14} /> PDF</button></>}>
      <article className="cert">
        <Rosette />
        <p className="vx-eyebrow">Veracite · Verification certificate · <span style={{ color: "var(--alert)" }}>SAMPLE</span></p>
        <h2>Every reference verified</h2>
        <p className="muted" style={{ margin: 0 }}>“Does screen time before bed reduce sleep quality in teenagers?”</p>
        <div className="cert-meta">
          <dl>
            <dt>Student</dt><dd>(name hidden in sample)</dd>
            <dt>Checked</dt><dd>25 Nov 2026, 10:44 Dubai</dd>
            <dt>Registries</dt><dd>Crossref · OpenAlex · Retraction Watch</dd>
            <dt>AI use</dt><dd>Assist mode · statement + ledger attached</dd>
            <dt>Result</dt><dd><TrustLabel kind="verified" /> 4 of 4 references · 0 retracted · 0 not found</dd>
          </dl>
          {qr ? <img className="cert-qr" src={qr} alt="QR code that opens this certificate for re-verification (sample)" /> : <div className="cert-qr" />}
        </div>
        <ol>
          {SOURCES.filter((s) => s.decision === "accepted").map((s) => (
            <li key={s.id}>{s.authors} ({s.year}). <i>{s.title}</i>. {s.venue}. <span className="mono" style={{ fontSize: 12 }}>https://doi.org/{s.doi}</span> <span style={{ color: "var(--ok)" }}><LabelIcon kind="verified" size={12} /></span></li>
          ))}
        </ol>
        <p className="cert-hash">SHA-256 · 7f3a9c0e5b1d42a8c6f0e93b7d21a4c58e6f0b9d3a7c12e4f5b6a8d9c0e1f2a3 · tamper-evident · SAMPLE</p>
      </article>
    </AppShell>
  );
}
