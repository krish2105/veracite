"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FlaskConical, ScanSearch, PenLine, Library, ShieldCheck, BadgeCheck, Moon, Sun } from "lucide-react";
import { createStore, useStore } from "../lab/store";
import Ambient from "./ambient/Ambient";
import FootBand from "./ambient/FootBand";
import PageBanner from "./ambient/PageBanner";
import { JourneyGuide } from "./journey/JourneyGuide";
import { PAGE_STEPS } from "./ambient/pageSteps";
import { isOn } from "@/lib/flags";
import { setLang, useT } from "@/lib/i18n/lang";
import { PAGE_TEXT, type StringKey } from "@/lib/i18n/strings";
import "./ambient/ambient.css";

export type Skin = "watermark" | "neural";
export type Theme = "light" | "dark";
export const skinStore = createStore<Skin>("watermark");
export const themeStore = createStore<Theme>("light");
export const autonomyStore = createStore<"off" | "assist" | "copilot">("assist");

const NAV: { href: string; key: string; icon: typeof FlaskConical }[] = [
  { href: "/research", key: "nav.research", icon: FlaskConical },
  { href: "/xray", key: "nav.xray", icon: ScanSearch },
  { href: "/draft", key: "nav.draft", icon: PenLine },
  { href: "/library", key: "nav.library", icon: Library },
  { href: "/trust", key: "nav.trust", icon: ShieldCheck },
  { href: "/certificate", key: "nav.certificate", icon: BadgeCheck },
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
  const { lang, t, attrs } = useT();
  const k = (key: string) => t(key as StringKey);
  const ar = lang === "ar" ? PAGE_TEXT[path] : undefined;
  useEffect(() => {
    const t = localStorage.getItem("vx-theme");
    if (t === "light" || t === "dark") themeStore.set(t);
  }, []);
  useEffect(() => { localStorage.setItem("vx-theme", theme); }, [theme]);
  const dark = theme === "dark";
  const steps = PAGE_STEPS[path];
  return (
    <div className="vx" data-skin={skin} data-theme={theme}>
      <Ambient />
      <aside className="vx-side">
        <Link href="/" className="vx-brand">Veracite<small>Every reference real</small></Link>
        <nav className="vx-nav" aria-label="Main">
          {NAV.map(({ href, key, icon: Icon }) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.6} />
              <span {...attrs}>{k(key)}<em>{k(`${key}.hint`)}</em></span>
            </Link>
          ))}
        </nav>
        <div className="vx-side-block">
          <p className="vx-eyebrow" {...attrs}>{t("autonomy.title")}</p>
          <div className="vx-seg" role="radiogroup" aria-label="AI autonomy">
            {(["off", "assist", "copilot"] as const).map((a) => (
              <button key={a} role="radio" aria-checked={autonomy === a} onClick={() => autonomyStore.set(a)} {...attrs}>{t(`autonomy.${a}`)}</button>
            ))}
          </div>
          <p className="vx-tiny" {...attrs}>{t(`autonomy.${autonomy}.hint`)} {t("autonomy.recorded")}</p>
        </div>
        <p className="vx-side-foot" {...attrs}>{t("side.foot")}</p>
      </aside>
      <main className="vx-main">
        <header className="vx-top">
          <div className="vx-top-t">
            <h1 className="vx-h1" {...(ar ? attrs : {})}>{ar?.title ?? title}</h1>
            {subtitle && <p {...(ar ? attrs : {})}>{ar?.subtitle ?? subtitle}</p>}
          </div>
          <div className="vx-top-a">
            {actions}
            {isOn("arabic") && (
              <button className="vx-chip" onClick={() => setLang(lang === "ar" ? "en" : "ar")} lang={lang === "ar" ? "en" : "ar"} aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}>
                {t("lang.switch")}
              </button>
            )}
            <button className="vx-chip vx-theme" aria-pressed={dark} onClick={() => themeStore.set(dark ? "light" : "dark")}>
              {dark ? <Sun size={14} /> : <Moon size={14} />} {THEME_NAMES[skin][dark ? "light" : "dark"]}
            </button>
          </div>
        </header>
        {lang === "ar" && <p className="vx-tiny vx-lang-note" {...attrs}>{t("lang.note")}</p>}
        <JourneyGuide />
        {steps && <PageBanner steps={steps} />}
        <div className="vx-body">{children}</div>
        <FootBand />
      </main>
    </div>
  );
}
