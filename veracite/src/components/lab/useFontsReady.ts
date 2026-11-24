"use client";

import { useEffect, useState } from "react";

/** Resolves once the given CSS font specs are loaded (or after a timeout), so canvas textures use the real fonts. */
export function useFontsReady(specs: string[], timeoutMs = 4000) {
  const [ready, setReady] = useState(false);
  const key = specs.join("|");
  useEffect(() => {
    let alive = true;
    Promise.race([
      Promise.all(key.split("|").map((s) => document.fonts.load(s))),
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [key, timeoutMs]);
  return ready;
}
