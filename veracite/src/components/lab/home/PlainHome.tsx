"use client";

import Link from "next/link";
import { Box, FlaskConical, PenLine, ScanSearch } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import "@/components/app/tabs/xray/xray.css";

export const START = [
  { href: "/xray", icon: ScanSearch, title: "Check references", text: "Paste a reference list. Fakes, stitched and retracted papers are caught against Crossref, OpenAlex and arXiv.", cta: "Open the X-ray" },
  { href: "/research", icon: FlaskConical, title: "Research a question", text: "AI plans, reads and challenges. You approve the plan, the sources and every claim.", cta: "Start researching" },
  { href: "/draft", icon: PenLine, title: "Check your draft", text: "Every citation in your paragraph is matched to your verified list, and quotes are checked.", cta: "Check a paragraph" },
];

/** The home page without 3D: phones, reduced motion, no WebGL, or by choice. */
export default function PlainHome({ onShow3d }: { onShow3d?: () => void }) {
  return (
    <AppShell
      title="Every reference real"
      subtitle="A reference manager and research assistant that cannot make up a source. You stay in charge."
      actions={onShow3d && <button className="vx-chip" onClick={onShow3d}><Box size={14} /> 3D vault</button>}
    >
      <div className="xrx">
        <section className="vx-card home-journey">
          <header className="vx-card-h"><h3>New here? Try the full journey</h3></header>
          <p className="xr-note">Three steps, about two minutes: check a test list with deliberate fakes, keep two real sources and cite one, then export and make a certificate. A small guide shows the way and hides with one click.</p>
          <Link className="btn primary" href="/xray?journey=1">Start the journey</Link>
        </section>
        <ul className="home-start">
          {START.map(({ href, icon: Icon, title, text, cta }) => (
            <li key={href} className="vx-card">
              <Icon size={22} strokeWidth={1.6} aria-hidden />
              <h2>{title}</h2>
              <p>{text}</p>
              <Link className="btn primary" href={href}>{cta}</Link>
            </li>
          ))}
        </ul>
        <section className="vx-card">
          <header className="vx-card-h"><h3>The rule everything follows</h3></header>
          <p className="home-rule">The AI may plan, search and explain. Only public registries may cite. Only you may decide.</p>
          <p className="vx-tiny">
            Then organise and export in your <Link href="/library">Library</Link>, share a re-checkable <Link href="/certificate">Certificate</Link>, and see what we
            measured in the <Link href="/trust">Trust Center</Link>. Your list stays on this device.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
