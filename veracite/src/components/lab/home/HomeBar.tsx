"use client";

import Link from "next/link";

type Props = { modeLabel: string; pressed: boolean; onToggle: () => void; onPlain?: () => void };

/** Top bar of the 3D home page: the three ways into the app stay visible while the visitor scrolls the vault. */
export default function HomeBar({ modeLabel, pressed, onToggle, onPlain }: Props) {
  return (
    <>
      <header className="lab-bar">
        <h1 className="lab-brand">
          Veracite<small>Every reference real</small>
        </h1>
        <nav className="lab-links" aria-label="Main">
          <Link href="/xray" className="primary">Check references</Link>
          <Link href="/research">Research</Link>
          <Link href="/draft">Check draft</Link>
          <Link href="/library" className="more">Library</Link>
          <Link href="/trust" className="more">Trust Center</Link>
        </nav>
        <button className="lab-btn" aria-pressed={pressed} onClick={onToggle}>
          <i />
          {modeLabel}
        </button>
      </header>
      {onPlain && <button className="lab-btn lab-plain" onClick={onPlain}>Plain view</button>}
      <p className="lab-note">3D scene: every reference shown here is fictional SAMPLE data</p>
    </>
  );
}
