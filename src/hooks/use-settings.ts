'use client';

/**
 * App settings — genuinely wired controls only.
 * Theme, default sign mode, sign auto-commit, captions language and
 * read-aloud rate are consumed by their respective features.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/store';

export type SignMode = 'quick-gestures' | 'asl-250';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface SettingsState {
  theme: ThemePreference;
  defaultSignMode: SignMode;
  /** Auto-insert recognised quick gestures into the workspace. */
  signAutoCommit: boolean;
  captionsLanguage: string;
  speechRate: number;
  keepScreenAwake: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  theme: 'system',
  defaultSignMode: 'quick-gestures',
  signAutoCommit: true,
  captionsLanguage: 'en-US',
  speechRate: 1,
  keepScreenAwake: false,
};

const store = createStore<SettingsState>(DEFAULT_SETTINGS, 'accessbridge.settings.v3');

export function useSettings(): SettingsState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function updateSettings(patch: Partial<SettingsState>): void {
  store.set((prev) => ({ ...prev, ...patch }));
}
