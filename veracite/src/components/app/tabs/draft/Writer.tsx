"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Check, Copy, Plus } from "lucide-react";
import { Card, StatusBadge } from "@/components/app/ui";
import { journey } from "@/components/app/journey/journeyStore";
import { useRefList } from "@/components/app/tabs/xray/refList";
import { StyleSelect } from "@/components/app/tabs/xray/StyleSelect";
import { useStyledEntries } from "@/components/app/tabs/xray/useStyled";
import { citedSources, insertAtCursor, inText } from "@/lib/cite/insert";
import { formatInText, listOutput, STYLES } from "@/lib/cite/styles";
import { useCiteStyle } from "@/lib/cite/styleStore";
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

  const style = useCiteStyle();
  const { label } = STYLES[style];
  /** Citations inserted here, per source, in the order first inserted (IEEE numbers follow it). */
  const [tracked, setTracked] = useState<{ id: string; tag: string }[]>([]);

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

  const trackedSources = useMemo(
    () => tracked.map((t) => sources.find((s) => s.id === t.id)).filter((s): s is SourceRecord => !!s),
    [tracked, sources],
  );

  const handleInsert = async () => {
    if (!activeSource) return;
    const tag = await formatInText(style, activeSource, trackedSources);
    const el = textareaRef.current;
    const sel =
      el && document.activeElement === el
        ? { start: el.selectionStart ?? draft.length, end: el.selectionEnd ?? draft.length }
        : selectionRef.current;

    const next = insertAtCursor(draft, sel.start, sel.end, tag);
    setDraft(next.text);
    setTracked((t) => (t.some((x) => x.id === activeSource.id) ? t : [...t, { id: activeSource.id, tag }]));
    journey.mark("cited");
    setSent(false);
    selectionRef.current = { start: next.cursor, end: next.cursor };

    requestAnimationFrame(() => {
      const box = textareaRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(next.cursor, next.cursor);
    });
  };

  // Switching style rewrites the citations inserted here (via placeholders, so no two can collide).
  const prevStyle = useRef(style);
  useEffect(() => {
    if (prevStyle.current === style) return;
    prevStyle.current = style;
    if (!tracked.length) return;
    let live = true;
    void Promise.all(tracked.map(async (t) => {
      const src = trackedSources.find((s) => s.id === t.id);
      return { id: t.id, tag: src ? await formatInText(style, src, trackedSources) : t.tag };
    })).then((next) => {
      if (!live) return;
      setDraft((d) => {
        const held = tracked.reduce((acc, t, i) => acc.split(t.tag).join(`\u0000${i}\u0000`), d);
        return next.reduce((acc, t, i) => acc.split(`\u0000${i}\u0000`).join(t.tag), held);
      });
      setTracked(next);
    });
    return () => {
      live = false;
    };
    // Runs only when the style changes; `tracked` is read as it was at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  const cited = useMemo(() => {
    const found = citedSources(draft, sources);
    const ids = new Set(found.map((s) => s.id));
    for (const t of tracked) {
      const src = sources.find((s) => s.id === t.id);
      if (src && !ids.has(src.id) && draft.includes(t.tag)) {
        ids.add(src.id);
        found.push(src);
      }
    }
    return found;
  }, [draft, sources, tracked]);
  // IEEE keeps every number it handed out, so the list is built from all inserted sources and then filtered.
  const listRecords = useMemo(
    () => (style === "ieee" ? [...trackedSources, ...cited.filter((c) => !tracked.some((t) => t.id === c.id))] : cited),
    [style, trackedSources, cited, tracked],
  );
  const styled = useStyledEntries(style, listRecords);
  const citedIds = useMemo(() => new Set(cited.map((s) => s.id)), [cited]);
  const shownEntries = styled.entries.filter((e) => citedIds.has(e.id));
  const list = useMemo(() => listOutput(styled.failed ? "apa" : style, shownEntries), [style, styled.failed, shownEntries]);

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
          <button type="button" className="btn primary small" onClick={() => void handleInsert()} disabled={!activeSource}>
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
        <div className="xrx-row" style={{ marginTop: 0, marginBottom: 6, justifyContent: "space-between" }}>
          <p className="vx-eyebrow" style={{ margin: 0 }}>References ({label}, live) · {cited.length}</p>
          <StyleSelect id="dr-style" />
        </div>
        {style !== "apa" && <p className="vx-tiny" style={{ marginTop: 0 }}>New citations and this list use {label}; citations you inserted change with the style. The Draft Checker reads APA-style (Author, Year) citations.</p>}
        {cited.length === 0 ? (
          <p className="vx-tiny" style={{ marginTop: 0 }}>
            Insert a citation above to build your {label} reference list live. Only works you cite appear here.
          </p>
        ) : (
          <>
            <ul className="xrx-list">
              {shownEntries.map((e) => {
                const s = cited.find((c) => c.id === e.id);
                return (
                  <li key={e.id}>
                    {/* Built by code from the registry record; values are HTML-escaped (apa.ts / citeproc). */}
                    <p className="xrx-apa" dangerouslySetInnerHTML={{ __html: e.html }} />
                    <div className="xrx-row">{s && <StatusBadge status={s.verification.status} />}</div>
                  </li>
                );
              })}
            </ul>
            <div className="xrx-row">
              <button type="button" className="btn primary small" disabled={styled.loading} onClick={() => void handleCopy("apa", list.text, list.html)}>
                {copied === "apa" ? <Check size={13} /> : <Copy size={13} />} {copied === "apa" ? "Copied" : `Copy ${label} list`}
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
