'use client';

/**
 * AccessBridge application shell.
 *
 * A single-page app with client-side view switching: switching views
 * never reloads the page, so workspace text, device permissions and
 * recognition state survive navigation.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Accessibility,
  BookOpen,
  Captions,
  Hand,
  Home,
  Keyboard,
  Settings,
  Volume2,
  Type,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import HomeView from '@/components/accessbridge/home-view';
import SignView from '@/components/accessbridge/sign-view';
import MorseView from '@/components/accessbridge/morse-view';
import CaptionsView from '@/components/accessbridge/captions-view';
import WorkspaceView from '@/components/accessbridge/workspace-view';
import LearnView from '@/components/accessbridge/learn-view';
import LibraryView from '@/components/accessbridge/library-view';
import SettingsView from '@/components/accessbridge/settings-view';
import { cn } from '@/lib/utils';

export type ViewId =
  | 'home'
  | 'sign'
  | 'morse'
  | 'captions'
  | 'workspace'
  | 'learn'
  | 'library'
  | 'settings';

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'sign', label: 'Sign to Text', icon: Hand },
  { id: 'morse', label: 'Morse', icon: Keyboard },
  { id: 'captions', label: 'Captions', icon: Captions },
  { id: 'workspace', label: 'Workspace', icon: Type },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'library', label: 'Phrases', icon: Accessibility },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const [view, setView] = useState<ViewId>('home');
  const workspace = useWorkspace();
  const settings = useSettings();
  const hasText = workspace.text.trim().length > 0;

  // Theme handling: light / dark / system, applied to <html>.
  useEffect(() => {
    const apply = () => {
      const dark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  const navigate = useCallback((next: ViewId) => {
    setView(next);
    // Move focus to the main region for screen-reader / keyboard users.
    requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus();
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-accent transition-colors"
            aria-label="AccessBridge home"
          >
            <BrandMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Access<span className="text-primary">Bridge</span>
            </span>
          </button>

          <nav aria-label="Primary" className="ml-auto min-w-0">
            <ul className="flex items-center gap-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigate(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm min-h-11 whitespace-nowrap transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">{item.label}</span>
                      {item.id === 'workspace' && hasText && (
                        <span
                          className="ml-0.5 h-2 w-2 rounded-full bg-chart-3"
                          aria-hidden
                        />
                      )}
                      {item.id === 'workspace' && (
                        <span className="sr-only">{hasText ? ' (has text)' : ''}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none focus-visible:outline-none"
      >
        {view === 'home' && <HomeView onNavigate={navigate} />}
        {view === 'sign' && <SignView onNavigate={navigate} />}
        {view === 'morse' && <MorseView onNavigate={navigate} />}
        {view === 'captions' && <CaptionsView onNavigate={navigate} />}
        {view === 'workspace' && <WorkspaceView />}
        {view === 'learn' && <LearnView />}
        {view === 'library' && <LibraryView onNavigate={navigate} />}
        {view === 'settings' && <SettingsView />}
      </main>

      <footer className="mt-auto border-t border-border/80 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            AccessBridge runs locally in your browser. Camera and microphone are
            only used by features you explicitly start.
          </p>
          <p className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5" aria-hidden /> Built for accessibility, v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="AccessBridge logo">
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <path d="M10 44 Q32 12 54 44" fill="none" className="stroke-primary-foreground" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="8" y1="48" x2="56" y2="48" className="stroke-primary-foreground" strokeWidth="4" strokeLinecap="round" />
      <circle cx="14" cy="48" r="4.6" className="fill-primary stroke-primary-foreground" strokeWidth="2.4" />
      <line x1="28" y1="48" x2="40" y2="48" className="stroke-primary" strokeWidth="5.6" strokeLinecap="round" />
      <circle cx="50" cy="48" r="4.6" className="fill-primary stroke-primary-foreground" strokeWidth="2.4" />
    </svg>
  );
}
