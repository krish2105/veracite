"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Plus, RotateCcw, ScanSearch } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, StatusBadge } from "@/components/app/ui";
import { canAdd, refList, sourceId, useRefList } from "@/components/app/tabs/xray/refList";
import { verifyInputFor, type SaveTarget } from "@/lib/library/bookmarklet";
import type { RefStatus, Verification } from "@/lib/types";
import type { WebCheck } from "@/app/api/sources/wayback/check";
import { SaveBookmarklet } from "./Bookmarklet";
import "@/components/app/tabs/xray/xray.css";
import "./save.css";

type Checkable = Extract<SaveTarget, { kind: "doi" | "url" }>;
type Result = { kind: "verify"; v: Verification } | { kind: "web"; check: WebCheck };
type State = { phase: "idle" } | { phase: "checking" } | { phase: "done"; result: Result } | { phase: "error"; message: string };

const VERDICT: Record<RefStatus, string> = {
  verified: "Verified.",
  partial: "Not yet verified.",
  mismatch: "Not verified as given.",
  chimera: "Could not be verified. Do not cite it.",
  retracted: "Retracted. Do not cite it.",
  notfound: "Could not be verified.",
};
const ZERO: Record<RefStatus, number> = { verified: 0, partial: 0, mismatch: 0, chimera: 0, retracted: 0, notfound: 0 };

async function check(t: Checkable): Promise<Result> {
  const input = verifyInputFor(t);
  if (input) {
    const r = await fetch("/api/sources/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
    const j = (await r.json()) as { ok: boolean; verification?: Verification; error?: string };
    if (!j.ok || !j.verification) throw new Error(j.error ?? "The check could not be completed.");
    return { kind: "verify", v: j.verification };
  }
  // Only a link without a title gets here (a DOI always has verify input).
  const r = await fetch(`/api/sources/wayback?url=${encodeURIComponent(t.url ?? "")}`);
  const j = (await r.json()) as { ok: boolean; check?: WebCheck; error?: string };
  if (!j.ok || !j.check) throw new Error(j.error ?? "The check could not be completed.");
  return { kind: "web", check: j.check };
}

export function SaveView({ target, pending = false }: { target: SaveTarget; pending?: boolean }) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const key = JSON.stringify(target);

  const run = useCallback(() => {
    if (target.kind !== "doi" && target.kind !== "url") return;
    setState({ phase: "checking" });
    check(target)
      .then((result) => {
        if (result.kind === "verify") refList.logCheck(1, { ...ZERO, [result.v.status]: 1 });
        setState({ phase: "done", result });
      })
      .catch((e: unknown) => setState({ phase: "error", message: e instanceof Error ? e.message : "The check could not be completed." }));
    // `key` stands for `target`: a new search on this page gives a new target object with the same shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Checking starts on its own: the student already clicked "Save to Veracite" on the page they were reading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
  }, [run]);

  const checkable = target.kind === "doi" || target.kind === "url";
  return (
    <AppShell title="Save a source" subtitle="Veracite checks a DOI or link against Crossref, OpenAlex and arXiv before anything is saved. No AI involved.">
      <div className="xrx">
        {pending && (
          <Card title="Reading the link">
            <p className="xr-note" aria-live="polite">Opening the source you sent…</p>
          </Card>
        )}
        {target.kind === "bad" && (
          <Card title="That could not be checked">
            <p className="xr-note">{target.reason}</p>
          </Card>
        )}

        {checkable && (
          <Card title={target.kind === "doi" ? "Checking a DOI" : "Checking a web page"}>
            {target.kind === "doi" && <p className="xr-note mono" style={{ marginTop: 0, overflowWrap: "anywhere" }}>doi:{target.doi}</p>}
            {"title" in target && target.title && (
              <p className="vx-tiny" style={{ marginTop: 0 }}>
                Title on the page you came from: “{target.title}”. Shown for context only; the registry record decides.
              </p>
            )}
            {target.kind === "url" && <p className="vx-tiny mono" style={{ marginTop: 0, overflowWrap: "anywhere" }}>{target.url}</p>}
            {state.phase === "checking" && <p className="xr-note" aria-live="polite">Checking Crossref, OpenAlex and arXiv…</p>}
            {state.phase === "error" && (
              <div role="alert">
                <p className="xr-note"><span className="xrx-verdict">The check did not finish.</span> {state.message} Nothing was saved.</p>
                <button className="btn small" onClick={run}><RotateCcw size={13} /> Try again</button>
              </div>
            )}
            {state.phase === "done" && state.result.kind === "verify" && <VerifyResult v={state.result.v} />}
            {state.phase === "done" && state.result.kind === "web" && <WebResult c={state.result.check} />}
          </Card>
        )}

        <Card title={checkable ? "Check another source" : "Check a source before you save it"}>
          <CheckForm />
          <p className="vx-tiny">Paste a DOI (for example <span className="mono">10.1038/nature14539</span>) or a link to an article or web page. To check a whole reference list, use the <Link href="/xray">X-ray</Link>.</p>
        </Card>

        <Card title="Save from any page you are reading">
          <SaveBookmarklet />
        </Card>
      </div>
    </AppShell>
  );
}

function VerifyResult({ v }: { v: Verification }) {
  const { sources } = useRefList();
  const m = v.matched;
  const added = !!m && sources.some((s) => s.id === sourceId(v));
  const authors = m ? m.authors.slice(0, 3).map((a) => a.family).join(", ") + (m.authors.length > 3 ? " et al." : "") : "";
  return (
    <>
      <div className="xrx-row" style={{ marginTop: 0 }}>
        <StatusBadge status={v.status} />
        <span className="vx-tiny">{v.ms < 1000 ? `${v.ms} ms` : `${(v.ms / 1000).toFixed(1)} s`} · no AI used</span>
      </div>
      <p className="xr-note"><span className="xrx-verdict">{VERDICT[v.status]}</span> {v.reasons.join(" ")}</p>
      {m && (
        <div className="save-record">
          <p className="vx-tiny" style={{ margin: 0 }}>The registry&apos;s record. This is what would be saved, not the text of the page:</p>
          <p className="save-title">{m.title}</p>
          <p className="vx-tiny" style={{ margin: 0 }}>
            {[authors, m.year, m.venue].filter(Boolean).join(" · ")}
            {m.doi && <> · <a href={`https://doi.org/${m.doi}`} target="_blank" rel="noreferrer">doi:{m.doi} <ExternalLink size={11} /></a></>}
          </p>
        </div>
      )}
      <div className="xrx-row">
        {canAdd(v) ? (
          <>
            <button className={`btn ${added ? "ok" : "primary"}`} onClick={() => refList.approve(v, "save")} disabled={added}>
              {added ? <Check size={14} /> : <Plus size={14} />} {added ? "In my list" : v.status === "mismatch" ? "Add the registry's version" : "Add to my list"}
            </button>
            {added && <Link className="btn" href="/library">Open my Library</Link>}
          </>
        ) : (
          <span className="vx-tiny">
            {v.status === "partial" && !m
              ? "A web page has no registry record, so it is not added to your list. Use the retrieval line above to cite it."
              : "Cannot be added to your list."}
          </span>
        )}
      </div>
    </>
  );
}

function WebResult({ c }: { c: WebCheck }) {
  return (
    <>
      <div className="xrx-row" style={{ marginTop: 0 }}>
        <StatusBadge status={c.status} />
        <span className="vx-tiny">web page check · no AI used</span>
      </div>
      <p className="xr-note"><span className="xrx-verdict">{c.status === "partial" ? "The page exists." : "The page could not be found."}</span> {c.reasons.join(" ")}</p>
      {c.status === "partial" && <p className="xr-note">APA 7 retrieval line: <span className="mono">{c.retrieval}</span></p>}
      {c.archive.url && <p className="vx-tiny"><a href={c.archive.url} target="_blank" rel="noreferrer">Archived copy <ExternalLink size={11} /></a></p>}
      <p className="vx-tiny">A web page has no registry record, so it is not added to your list, and it is never marked Verified. Add the page&apos;s title to check it against the registries too.</p>
    </>
  );
}

function CheckForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    router.push(/^https?:\/\//i.test(v) ? `/save?url=${encodeURIComponent(v)}` : `/save?doi=${encodeURIComponent(v)}`);
  };
  return (
    <form className="lib-filters" onSubmit={submit} style={{ marginBottom: 0 }}>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="DOI or link" aria-label="DOI or link to check" />
      <button className="btn primary" type="submit" disabled={!value.trim()}><ScanSearch size={14} /> Check</button>
    </form>
  );
}
