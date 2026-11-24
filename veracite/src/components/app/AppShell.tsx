"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FlaskConical, ScanSearch, PenLine, Library, ShieldCheck, BadgeCheck, Command, Languages, Moon, Sun } from "lucide-react";
import { createStore, useStore } from "../lab/store";

export type Skin = "watermark" | "neural";
export type Theme = "light" | "dark";
export const skinStore = createStore<Skin>("watermark");
export const themeStore = createStore<Theme>("light");
export const autonomyStore = createStore<"off" | "assist" | "copilot">("assist");

const NAV = [
  { href: "/research", label: "Research", icon: FlaskConical, hint: "Agents + checkpoints" },
  { href: "/xray", label: "Reference X-ray", icon: ScanSearch, hint: "Paste any bibliography" },
  { href: "/draft", label: "Draft Checker", icon: PenLine, hint: "Check claims in your text" },
  { href: "/library", label: "Library", icon: Library, hint: "Sources · Galaxy · export" },
  { href: "/trust", label: "Trust Center", icon: ShieldCheck, hint: "Governance · model card" },
  { href: "/certificate", label: "Certificate", icon: BadgeCheck, hint: "For your professor" },
];

const THEME_NAMES: Record<Skin, Record<Theme, string>> = {
  watermark: { light: "Daylight", dark: "UV lamp" },
  neural: { light: "Cajal ink", dark: "Brainbow" },
};

export default function AppShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const path = usePathname();
  const skin = useStore(skinStore);
  const theme = useStore(themeStore);
  const autonomy = useStore(autonomyStore);
  useEffect(() => {
    const s = localStorage.getItem("vx-skin"); const t = localStorage.getItem("vx-theme");
    if (s === "watermark" || s === "neural") skinStore.set(s);
    if (t === "light" || t === "dark") themeStore.set(t);
  }, []);
  useEffect(() => { localStorage.setItem("vx-skin", skin); localStorage.setItem("vx-theme", theme); }, [skin, theme]);
  const dark = theme === "dark";
  return (
    <div className="vx" data-skin={skin} data-theme={theme}>
      <aside className="vx-side">
        <Link href="/" className="vx-brand">Veracite<small>Every reference real</small></Link>
        <nav className="vx-nav" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, hint }) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.6} />
              <span>{label}<em>{hint}</em></span>
            </Link>
          ))}
        </nav>
        <div className="vx-side-block">
          <p className="vx-eyebrow">AI autonomy</p>
          <div className="vx-seg" role="radiogroup" aria-label="AI autonomy">
            {(["off", "assist", "copilot"] as const).map((a) => (
              <button key={a} role="radio" aria-checked={autonomy === a} onClick={() => autonomyStore.set(a)}>{a === "off" ? "Off" : a === "assist" ? "Assist" : "Co-pilot"}</button>
            ))}
          </div>
          <p className="vx-tiny">{autonomy === "off" ? "Pure reference manager. Checks still run, with no AI." : autonomy === "assist" ? "AI plans and checks. You write." : "AI also drafts a labelled brief."} Recorded in your AI-use statement.</p>
        </div>
        <div className="vx-side-block">
          <p className="vx-eyebrow">AI budget today</p>
          <div className="vx-meter"><i style={{ width: "14%" }} /></div>
          <p className="vx-tiny">14 / 1,000 Groq calls · Rules mode ready</p>
        </div>
        <p className="vx-side-foot">Preview · all data is SAMPLE</p>
      </aside>
      <main className="vx-main">
        <header className="vx-top">
          <div className="vx-top-t">
            <h1 className="vx-h1">{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="vx-top-a">
            {actions}
            <button className="vx-chip" title="Command palette"><Command size={14} /> K</button>
            <button className="vx-chip" title="Arabic / English"><Languages size={14} /> عربي</button>
            <div className="vx-seg vx-skin" role="radiogroup" aria-label="Design direction">
              <button role="radio" aria-checked={skin === "watermark"} onClick={() => skinStore.set("watermark")}>A · Watermark</button>
              <button role="radio" aria-checked={skin === "neural"} onClick={() => skinStore.set("neural")}>B · Neural</button>
            </div>
            <button className="vx-chip vx-theme" aria-pressed={dark} onClick={() => themeStore.set(dark ? "light" : "dark")}>
              {dark ? <Sun size={14} /> : <Moon size={14} />} {THEME_NAMES[skin][dark ? "light" : "dark"]}
            </button>
          </div>
        </header>
        <div className="vx-body">{children}</div>
      </main>
    </div>
  );
}
