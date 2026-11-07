'use client';

/**
 * Communication Library — user-defined quick phrases.
 * Kept strictly separate from the trained recognition vocabulary:
 * a custom phrase is a text shortcut, never a recognisable sign.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/store';
import { SEED_PHRASES, type LibraryPhrase } from '@/lib/phrases';

export interface LibraryState {
  phrases: LibraryPhrase[];
}

function initialState(): LibraryState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('accessbridge.library.v3');
      if (raw) return { phrases: JSON.parse(raw) as LibraryPhrase[] };
    } catch {
      // fall through to seeds
    }
  }
  return { phrases: SEED_PHRASES };
}

const store = createStore<LibraryState>(initialState(), 'accessbridge.library.v3');

export function useLibrary(): LibraryState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function addPhrase(text: string, category: LibraryPhrase['category']): void {
  const clean = text.trim();
  if (clean === '') return;
  store.set((prev) => ({
    phrases: [
      { id: `p${Date.now()}`, text: clean, category, favourite: false },
      ...prev.phrases,
    ],
  }));
}

export function deletePhrase(id: string): void {
  store.set((prev) => ({ phrases: prev.phrases.filter((p) => p.id !== id) }));
}

export function toggleFavourite(id: string): void {
  store.set((prev) => ({
    phrases: prev.phrases.map((p) => (p.id === id ? { ...p, favourite: !p.favourite } : p)),
  }));
}

export function editPhrase(id: string, text: string): void {
  const clean = text.trim();
  if (clean === '') return;
  store.set((prev) => ({
    phrases: prev.phrases.map((p) => (p.id === id ? { ...p, text: clean } : p)),
  }));
}

export function resetLibrary(): void {
  store.set(() => ({ phrases: SEED_PHRASES }));
}
