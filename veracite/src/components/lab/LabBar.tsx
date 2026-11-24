"use client";

import Link from "next/link";

type Props = {
  current: "vault" | "neural";
  modeLabel: string;
  pressed: boolean;
  onToggle: () => void;
};

/** Top bar shared by the 3D concept prototypes. */
export default function LabBar({ current, modeLabel, pressed, onToggle }: Props) {
  return (
    <>
      <header className="lab-bar">
        <div className="lab-brand">
          Veracite<small>Team 7 · 3D concept lab</small>
        </div>
        <nav className="lab-links" aria-label="Concepts">
          <Link href="/lab/vault" aria-current={current === "vault" ? "page" : undefined}>
            A · Watermark Vault
          </Link>
          <Link href="/lab/neural" aria-current={current === "neural" ? "page" : undefined}>
            B · Neural Crew
          </Link>
        </nav>
        <button className="lab-btn" aria-pressed={pressed} onClick={onToggle}>
          <i />
          {modeLabel}
        </button>
      </header>
      <p className="lab-note">Prototype · every reference shown is fictional SAMPLE data</p>
    </>
  );
}
