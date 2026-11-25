"use client";

/** The chosen language (K43), kept on this device. Arabic text is marked lang="ar" dir="rtl" where it appears. */
import { useSyncExternalStore } from "react";
import { STRINGS, type Lang, type StringKey } from "./strings";

const KEY = "vx-lang-v1";
let current: Lang | undefined;
const listeners = new Set<() => void>();

function read(): Lang {
  if (current) return current;
  try {
    current = localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {
    current = "en";
  }
  return current;
}

export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    read,
    () => "en",
  );
}

/** `t(key)` in the current language, plus the attributes Arabic text needs. */
export function useT() {
  const lang = useLang();
  const t = (k: StringKey) => STRINGS[lang][k];
  const attrs = lang === "ar" ? ({ lang: "ar", dir: "rtl" } as const) : {};
  return { lang, t, attrs };
}
