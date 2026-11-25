"use client";

/** The first-visit guide's state (K31), on this device only: hidden or not, and two marks. */
import { useSyncExternalStore } from "react";
import type { JourneyMark } from "./journey";

interface State {
  dismissed: boolean;
  marks: JourneyMark[];
}
const KEY = "vx-journey-v1";
const HIDDEN: State = { dismissed: true, marks: [] };
let state: State | undefined;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as State | null;
    state = s && typeof s.dismissed === "boolean" && Array.isArray(s.marks) ? s : { dismissed: false, marks: [] };
  } catch {
    state = { dismissed: false, marks: [] };
  }
  return state;
}
function write(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing: the guide still works until the page closes.
  }
  listeners.forEach((l) => l());
}

export const journey = {
  mark(m: JourneyMark) {
    const s = read();
    if (!s.marks.includes(m)) write({ ...s, marks: [...s.marks, m] });
  },
  dismiss() {
    write({ ...read(), dismissed: true });
  },
  restart() {
    write({ ...read(), dismissed: false });
  },
};

/** On the server and during hydration the guide is hidden, so it never flashes or mismatches. */
export function useJourney(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => HIDDEN,
  );
}
