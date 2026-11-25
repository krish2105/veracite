"use client";

/** The student's citation style (K29), kept on this device and shared by the X-ray, Write & cite and Library. */
import { useSyncExternalStore } from "react";
import { isCiteStyle, type CiteStyle } from "./styles";

const KEY = "vx-cite-style-v1";
let current: CiteStyle | undefined;
const listeners = new Set<() => void>();

function read(): CiteStyle {
  if (current) return current;
  try {
    const saved = localStorage.getItem(KEY);
    current = isCiteStyle(saved) ? saved : "apa";
  } catch {
    current = "apa";
  }
  return current;
}

export function setCiteStyle(style: CiteStyle) {
  current = style;
  try {
    localStorage.setItem(KEY, style);
  } catch {
    // Private browsing: the choice lasts until the page closes.
  }
  listeners.forEach((l) => l());
}

export function useCiteStyle(): CiteStyle {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "apa",
  );
}
