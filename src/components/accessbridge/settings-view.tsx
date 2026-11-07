'use client';

/**
 * Settings — only genuinely wired controls.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { updateSettings, useSettings, type SignMode, type ThemePreference } from '@/hooks/use-settings';
import { ASL_CLASS_COUNT } from '@/lib/asl-vocab';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
};

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)' },
];

export default function SettingsView() {
  const settings = useSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Every option here is wired into the feature it describes. Settings are saved on this
          device only.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="theme-select">Theme</Label>
          <Select
            value={settings.theme}
            onValueChange={(v) => updateSettings({ theme: v as ThemePreference })}
          >
            <SelectTrigger id="theme-select" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_LABELS) as ThemePreference[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {THEME_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sign to Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sign-mode">Mode when Sign to Text opens</Label>
            <Select
              value={settings.defaultSignMode}
              onValueChange={(v) => updateSettings({ defaultSignMode: v as SignMode })}
            >
              <SelectTrigger id="sign-mode" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick-gestures">Quick gestures (7 gestures, in-browser)</SelectItem>
                <SelectItem value="asl-250">ASL words ({ASL_CLASS_COUNT}-class model)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-commit">Auto-add held gestures</Label>
              <p className="text-sm text-muted-foreground">
                Insert a quick gesture&apos;s phrase automatically after holding it for half a second.
              </p>
            </div>
            <Switch
              id="auto-commit"
              checked={settings.signAutoCommit}
              onCheckedChange={(v) => updateSettings({ signAutoCommit: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Captions language</CardTitle>
          <CardDescription>Used by the browser speech-recognition engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="captions-lang">Recognition language</Label>
          <Select
            value={settings.captionsLanguage}
            onValueChange={(v) => updateSettings({ captionsLanguage: v })}
          >
            <SelectTrigger id="captions-lang" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Availability varies by browser; Chrome and Edge provide the widest language support.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Read aloud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rate-setting">Default speech rate</Label>
            <span className="text-sm tabular-nums text-muted-foreground">
              {settings.speechRate.toFixed(1)}×
            </span>
          </div>
          <Slider
            id="rate-setting"
            value={[settings.speechRate]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={(v) => updateSettings({ speechRate: v[0] })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            AccessBridge stores your settings, workspace text and custom phrases only in this
            browser&apos;s local storage — nothing is uploaded. Quick-gesture recognition and
            Morse decoding run entirely offline; the ASL words mode sends landmark numbers (not
            video) to the sign service running on this same machine; live captions use the
            browser&apos;s own speech service.
          </p>
          <p>Clearing your browser data for this site removes everything.</p>
        </CardContent>
      </Card>
    </div>
  );
}
