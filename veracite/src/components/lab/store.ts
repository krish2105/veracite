"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store. The 3D scenes read UI state (theme, approvals) from here instead of props,
 * so the <Canvas> never re-renders: R3F re-connects pointer events on every Canvas render, which
 * would silently detach drei's ScrollControls scroll listener.
 */
export function createStore<T>(initial: T) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      subs.forEach((f) => f());
    },
    sub(f: () => void) {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
  };
}

export type Store<T> = ReturnType<typeof createStore<T>>;

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.sub, store.get, store.get);
}
