"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Printer, RefreshCw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, StatusBadge } from "@/components/app/ui";
import { journey } from "@/components/app/journey/journeyStore";
import { useRefList } from "@/components/app/tabs/xray/refList";
import "@/components/app/tabs/xray/xray.css";
import { certificateFromSources, certificateLink, certificateQR, decodeCertificate, reverifyCertificate, type Certificate, type ReverifyResult } from "@/lib/integrity/certificate";
import { reverifyRef } from "./reverify";

interface Shown {
  cert: Certificate;
  hash: string;
  url: string;
  qr?: string;
}

const REGISTRY: Record<string, string> = { crossref: "Crossref", openalex: "OpenAlex", arxiv: "arXiv" };
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });

export function CertificateTab() {
  const { sources } = useRefList();
  const [shown, setShown] = useState<Shown>();
  const [result, setResult] = useState<ReverifyResult>();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Opening a certificate link (or scanning its QR) shows the certificate carried inside the link.
  useEffect(() => {
    const open = () => {
      const href = window.location.href;
      if (!window.location.hash) return;
      void decodeCertificate(href).then(async (d) => {
        setResult(undefined);
        if (!d.ok) {
          setShown(undefined);
          setMessage(d.error);
          return;
        }
        setMessage("");
        setShown({ cert: d.cert, hash: d.hash, url: href, qr: await certificateQR(href).catch(() => undefined) });
      });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  const create = async () => {
    setBusy(true);
    setMessage("");
    try {
      const cert = certificateFromSources(sources, { issuedAt: new Date().toISOString(), title });
      const link = await certificateLink(window.location.origin, cert);
      const d = await decodeCertificate(link.url);
      if (!d.ok) throw new Error(d.error);
      setResult(undefined);
      setShown({ cert: d.cert, hash: d.hash, url: link.url, qr: link.fitsQr ? await certificateQR(link.url) : undefined });
      window.history.replaceState(null, "", link.url);
      journey.mark("certificate");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "The certificate could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const recheck = async () => {
    if (!shown) return;
    setBusy(true);
    try {
      setResult(await reverifyCertificate(shown.cert, reverifyRef, { concurrency: 3 }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Verification Certificate" subtitle="A link and QR code that carry your reference list. Your professor opens it and re-checks every reference live.">
      <div className="xrx">
        {message && <div className="banner" role="alert"><span>{message}</span></div>}

        <Card title={<>Create from your list · {sources.length} source{sources.length === 1 ? "" : "s"}</>}>
          {sources.length === 0 ? (
            <p className="xr-note">Add verified sources on the <Link href="/xray">X-ray</Link> or <Link href="/research">Research</Link> page first.</p>
          ) : (
            <div className="lib-filters" style={{ marginBottom: 0 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} placeholder="Assignment title (optional; no names or student IDs)" aria-label="Assignment title" />
              <button className="btn primary" onClick={() => void create()} disabled={busy}>Create certificate</button>
            </div>
          )}
        </Card>

        {shown && (
          <article className="cert">
            <p className="vx-eyebrow">Veracite · Verification certificate</p>
            <h2>{result ? (result.stillVerified ? "Re-checked: every reference verified" : "Re-checked: look at the results") : `${shown.cert.refs.length} reference${shown.cert.refs.length === 1 ? "" : "s"}`}</h2>
            {shown.cert.title && <p className="muted" style={{ margin: 0 }}>{shown.cert.title}</p>}
            <div className="cert-meta">
              <dl>
                <dt>Issued</dt><dd>{when(shown.cert.issuedAt)} (Dubai)</dd>
                <dt>Registries</dt><dd>{shown.cert.registries?.map((r) => REGISTRY[r] ?? r).join(", ") ?? "not recorded"}</dd>
                <dt>Re-checked</dt><dd>{result ? `${when(result.checkedAt)} · ${result.changed} changed · ${result.errors} could not be checked` : "not yet: press Re-check now"}</dd>
              </dl>
              {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL */}
              {shown.qr ? <img className="cert-qr" src={shown.qr} alt="QR code that opens this certificate for re-checking" /> : <p className="vx-tiny">Too long for a QR code: share the link instead.</p>}
            </div>
            <ol>
              {shown.cert.refs.map((r, i) => (
                <li key={i}>
                  {r.firstAuthor ? `${r.firstAuthor} (${r.year ?? "n.d."}). ` : ""}
                  <i>{r.title ?? ""}</i> {r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">https://doi.org/{r.doi}</a> : r.url}
                  <span className="xrx-row" style={{ marginTop: 4 }}>
                    <span className="vx-tiny">When issued:</span> <StatusBadge status={r.status} />
                    {result && (
                      <>
                        <span className="vx-tiny">Now:</span>
                        {result.items[i].now === "error" ? <span className="vx-tiny">could not be checked</span> : <StatusBadge status={result.items[i].now as Exclude<(typeof result.items)[number]["now"], "error">} />}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <p className="cert-hash">SHA-256 · {shown.hash}</p>
            <div className="xrx-row">
              <button className="btn primary" onClick={() => void recheck()} disabled={busy}><RefreshCw size={14} /> {busy ? "Checking…" : "Re-check now"}</button>
              <button className="btn" onClick={() => void navigator.clipboard.writeText(shown.url).then(() => setMessage("Link copied."))}><Copy size={14} /> Copy link</button>
              <button className="btn" onClick={() => window.print()}><Printer size={14} /> Print or save as PDF</button>
            </div>
            <p className="vx-tiny">The fingerprint shows the link was not damaged or edited by accident. Anyone can make a link, so trust the live re-check, not the “when issued” column.</p>
          </article>
        )}
      </div>
    </AppShell>
  );
}
