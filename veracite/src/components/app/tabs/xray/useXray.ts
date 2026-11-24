"use client";

import { useCallback, useRef, useState } from "react";
import type { ApiError, XrayLine, XrayStart, XraySummary } from "@/lib/types";

export interface XrayState {
  refs: string[];
  /** Finished lines keyed by reference number (1-based). Lines can arrive in any order. */
  lines: Record<number, XrayLine>;
  summary?: XraySummary;
  running: boolean;
  error?: string;
}

const EMPTY: XrayState = { refs: [], lines: {}, running: false };

/** Runs POST /api/sources/xray and reads its NDJSON stream line by line, so results appear as they finish. */
export function useXray() {
  const [state, setState] = useState<XrayState>(EMPTY);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ ...EMPTY, running: true });
    try {
      const res = await fetch("/api/sources/xray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        throw new Error(err?.error ?? `The X-ray could not start (HTTP ${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          const msg = JSON.parse(part) as XrayStart | XrayLine | XraySummary;
          setState((s) => {
            if (msg.type === "start") return { ...s, refs: msg.refs };
            if (msg.type === "line") return { ...s, lines: { ...s.lines, [msg.n]: msg } };
            return { ...s, summary: msg, running: false };
          });
        }
      }
      setState((s) => ({ ...s, running: false }));
    } catch (e) {
      if (ac.signal.aborted) return;
      setState((s) => ({ ...s, running: false, error: e instanceof Error ? e.message : "The X-ray failed. Check your connection and try again." }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(EMPTY);
  }, []);

  return { state, run, reset };
}
