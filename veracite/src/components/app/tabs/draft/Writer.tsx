"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowDown, Check, Copy, Plus } from "lucide-react";
import { Card, StatusBadge } from "@/components/app/ui";
import { apaList, apaReference } from "@/components/app/tabs/xray/apa";
import { useRefList } from "@/components/app/tabs/xray/refList";
import { citedSources, insertAtCursor, inText } from "@/lib/cite/insert";
import type { SourceRecord } from "@/lib/types";

async function copyText(text: string, html?: string): Promise<boolean> {
  try {
    if (html && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

const optionLabel = (s: SourceRecord) => {
  const shortTitle = s.title.length > 56 ? `${s.title.slice(0, 54)}…` : s.title;
  return `${inText(s)} — ${shortTitle}`;
};

export function Writer({ onCheck }: { onCheck?: (text: string) => void }) {
  const { sources } = useRefList();
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [copied, setCopied] = useState<"draft" | "apa" | "">("");
  const [sent, setSent] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const activeId = sources.some((s) => s.id === selectedId) ? selectedId : (sources[0]?.id ?? "");
  const activeSource = sources.find((s) => s.id === activeId);

  const syncSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = {
      start: el.selectionStart ?? draft.length,
      end: el.selectionEnd ?? draft.length,
    };
  };

  const handleInsert = () => {
    if (!activeSource) return;
    const el = textareaRef.current;
    const sel =
      el && document.activeElement === el
        ? { start: el.selectionStart ?? draft.length, end: el.selectionEnd ?? draft.length }
        : selectionRef.current;

    const next = insertAtCursor(draft, sel.start, sel.end, inText(activeSource));
    setDraft(next.text);
    setSent(false);
    selectionRef.current = { start: next.cursor, end: next.cursor };

    requestAnimationFrame(() => {
      const box = textareaRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const cited = useMemo(() => citedSources(draft, sources), [draft, sources]);
  const apa = useMemo(() => apaList(cited), [cited]);
  const sortedCited = useMemo(
    () => [...cited].sort((a, b) => apaReference(a).text.localeCompare(apaReference(b).text, "en")),
    [cited],
  );

  const handleCopy = async (kind: "draft" | "apa", text: string, html?: string) => {
    if (await copyText(text, html)) {
      setCopied(kind);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  return (
    <Card title="Write & cite · verified sources only">
      {sources.length === 0 ? (
        <p className="xr-note">
          Your verified list is empty. Add sources on the <Link href="/xray">X-ray</Link> or{" "}
          <Link href="/research">Research</Link> page first—only sources from your list can be cited here.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10, minWidth: 0 }}>
          <select
            aria-label="Choose a verified source to cite"
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              maxWidth: "100%",
              font: "13.5px var(--f-ui)",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface2)",
              color: "var(--ink)",
            }}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {optionLabel(s)}
              </option>
            ))}
          </select>
          <button type="button" className="btn primary small" onClick={handleInsert} disabled={!activeSource}>
            <Plus size={14} /> Insert citation
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="paste dr-input"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setSent(false);
          selectionRef.current = {
            start: e.target.selectionStart ?? e.target.value.length,
            end: e.target.selectionEnd ?? e.target.value.length,
          };
        }}
        onSelect={syncSelection}
        onClick={syncSelection}
        onKeyUp={syncSelection}
        onBlur={syncSelection}
        aria-label="Write your draft"
        placeholder="Write your paragraph here, place your cursor, and tap Insert citation. The AI writes nothing here."
      />

      <div className="xrx-row">
        <button type="button" className="btn small" disabled={!draft.trim()} onClick={() => void handleCopy("draft", draft)}>
          {copied === "draft" ? <Check size={13} /> : <Copy size={13} />} {copied === "draft" ? "Copied" : "Copy draft"}
        </button>
        {onCheck && (
          <button
            type="button"
            className="btn small"
            disabled={!draft.trim()}
            onClick={() => {
              onCheck(draft);
              setSent(true);
            }}
          >
            <ArrowDown size={13} /> {sent ? "Sent to Draft Checker" : "Send to Draft Checker"}
          </button>
        )}
        <span className="vx-tiny">No AI writes here. Citations come only from your verified list.</span>
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
        <p className="vx-eyebrow">References (APA 7, live) · {cited.length}</p>
        {cited.length === 0 ? (
          <p className="vx-tiny" style={{ marginTop: 0 }}>
            Insert a citation above to build your APA 7 reference list live. Only works you cite appear here.
          </p>
        ) : (
          <>
            <ul className="xrx-list">
              {sortedCited.map((s) => (
                <li key={s.id}>
                  {/* Built by code from the registry record; every value is HTML-escaped in apa.ts. */}
                  <p className="xrx-apa" dangerouslySetInnerHTML={{ __html: apaReference(s).html }} />
                  <div className="xrx-row">
                    <StatusBadge status={s.verification.status} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="xrx-row">
              <button type="button" className="btn primary small" onClick={() => void handleCopy("apa", apa.text, apa.html)}>
                {copied === "apa" ? <Check size={13} /> : <Copy size={13} />} {copied === "apa" ? "Copied" : "Copy APA 7 list"}
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
