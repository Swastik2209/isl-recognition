'use client';

/**
 * Tiny external-store helper (React 19 / eslint friendly).
 * Components subscribe with useSyncExternalStore; updates never run
 * during render, and snapshots are stable references.
 */

export interface Store<T> {
  get: () => T;
  set: (updater: (prev: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T, storageKey?: string): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  if (storageKey && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) state = { ...initial, ...(JSON.parse(raw) as T) };
    } catch {
      // Ignore corrupt storage; fall back to defaults.
    }
  }

  const persist = () => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage full or blocked — non-fatal.
    }
  };

  return {
    get: () => state,
    set: (updater) => {
      const next = updater(state);
      if (next === state) return;
      state = next;
      persist();
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Stable snapshot hook factory: selector-free, returns the whole state. */
export function subscribeStore<T>(store: Store<T>): (listener: () => void) => () => void {
  return store.subscribe;
}
