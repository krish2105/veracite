"use client";

import type { Label, RefStatus } from "./data";
import { useT } from "@/lib/i18n/lang";

/** Trust-label shapes: colour is never the only signal (filled ● / half ◐ / diamond ◆ / struck ○). */
export function LabelIcon({ kind, size = 14 }: { kind: Label; size?: number }) {
  const s = size;
  if (kind === "verified") return <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M4.8 8.2l2.1 2.1 4.3-4.6" stroke="var(--bg)" strokeWidth="1.8" fill="none" /></svg>;
  if (kind === "reported") return <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 1.7a6.3 6.3 0 0 1 0 12.6z" fill="currentColor" /></svg>;
  if (kind === "ai") return <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden><path d="M8 1.5L14.5 8 8 14.5 1.5 8z" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5L11 8 8 11 5 8z" fill="currentColor" /></svg>;
  return <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M3.6 12.4l8.8-8.8" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export function TrustLabel({ kind }: { kind: Label }) {
  const { t, attrs } = useT();
  return <span className={`lbl lbl-${kind}`}><LabelIcon kind={kind} size={12} /><span {...attrs}>{t(`label.${kind}`)}</span></span>;
}

const STATUS: Record<RefStatus, Label> = { verified: "verified", partial: "reported", chimera: "notfound", mismatch: "reported", notfound: "notfound", retracted: "notfound" };
export function StatusBadge({ status }: { status: RefStatus }) {
  const { t, attrs } = useT();
  const cls = STATUS[status];
  return <span className={`lbl lbl-${cls} ${status === "retracted" || status === "chimera" ? "lbl-solid" : ""}`}><LabelIcon kind={cls} size={12} /><span {...attrs}>{t(`status.${status}`)}</span></span>;
}

export function Sample({ children = "SAMPLE" }: { children?: React.ReactNode }) {
  return <span className="sample">{children}</span>;
}

export function Card({ title, aside, children, className = "" }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`vx-card ${className}`}>
      {(title || aside) && <header className="vx-card-h"><h3>{title}</h3>{aside}</header>}
      {children}
    </section>
  );
}
