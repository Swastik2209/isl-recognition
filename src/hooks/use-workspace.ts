'use client';

/**
 * Shared text workspace state.
 *
 * Single source of truth for all generated text. Modules append via
 * `appendText` (newline-separated, never overwriting). Also records an
 * opt-in history of what entered the workspace and from which module.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/store';
import {
  appendToWorkspace,
  makeHistoryEntry,
  type HistoryEntry,
} from '@/lib/workspace';

export type WorkspaceSource = HistoryEntry['source'];

export interface WorkspaceState {
  text: string;
  history: HistoryEntry[];
  historyEnabled: boolean;
  historySeq: number;
}

const store = createStore<WorkspaceState>(
  { text: '', history: [], historyEnabled: false, historySeq: 0 },
  'accessbridge.workspace.v3',
);

export function useWorkspace(): WorkspaceState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function appendText(incoming: string, source: WorkspaceSource): void {
  if (incoming.trim() === '') return;
  store.set((prev) => {
    const text = appendToWorkspace(prev.text, incoming);
    if (text === prev.text) return prev;
    const historyEnabled = prev.historyEnabled;
    const entry = makeHistoryEntry(prev.historySeq + 1, source, incoming.trim());
    return {
      ...prev,
      text,
      historySeq: prev.historySeq + 1,
      history: historyEnabled ? [entry, ...prev.history].slice(0, 50) : prev.history,
    };
  });
}

/** Replace the whole workspace text (used by Clear, and undo-free editing). */
export function setText(text: string): void {
  store.set((prev) => (prev.text === text ? prev : { ...prev, text }));
}

export function setHistoryEnabled(enabled: boolean): void {
  store.set((prev) => ({ ...prev, historyEnabled: enabled }));
}

export function clearHistory(): void {
  store.set((prev) => ({ ...prev, history: [] }));
}
