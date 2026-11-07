'use client';

/**
 * Shared Workspace + Read Aloud — the centre of AccessBridge.
 * Every module appends here; nothing is ever overwritten silently.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  History,
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { appendText, clearHistory, setHistoryEnabled, setText, useWorkspace } from '@/hooks/use-workspace';
import { useReadAloud } from '@/hooks/use-read-aloud';
import { useSettings, updateSettings } from '@/hooks/use-settings';
import { speakableText, workspaceStats, workspaceToTxt } from '@/lib/workspace';
import { useToast } from '@/hooks/use-toast';

const SOURCE_LABELS: Record<string, string> = {
  sign: 'Sign to Text',
  morse: 'Morse Decoder',
  captions: 'Live Captions',
  manual: 'Typed',
};

export default function WorkspaceView() {
  const workspace = useWorkspace();
  const settings = useSettings();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const readAloud = useReadAloud();
  const [voiceName, setVoiceName] = useState<string>('');

  useEffect(() => {
    readAloud.setRate(settings.speechRate);
  }, [settings.speechRate, readAloud]);

  const stats = useMemo(() => workspaceStats(workspace.text), [workspace.text]);
  const speakTarget = speakableText(workspace.text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(workspace.text);
      toast({ title: 'Workspace copied to the clipboard' });
    } catch {
      // Clipboard API can be blocked — select the text as a fallback.
      textareaRef.current?.select();
      toast({ title: 'Press Ctrl/Cmd+C to copy the selected text' });
    }
  };

  const download = () => {
    const blob = new Blob([workspaceToTxt(workspace.text)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessbridge-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Download started' });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" aria-hidden /> Shared Workspace
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Everything from Sign to Text, Morse and Captions lands here on its own line —
          edit freely, then copy, download or listen.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* Text + controls */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Text</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
                <Badge variant="outline">{stats.words} words</Badge>
                <Badge variant="outline">{stats.chars} chars</Badge>
                <Badge variant="outline">{stats.lines} lines</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="workspace-text" className="sr-only">
              Shared workspace text
            </Label>
            <textarea
              id="workspace-text"
              ref={textareaRef}
              value={workspace.text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text from any feature appears here — or just type."
              className="min-h-56 w-full rounded-md border bg-secondary/30 p-4 text-lg leading-relaxed resize-y"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} className="min-h-11">
                <Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy all
              </Button>
              <Button variant="secondary" onClick={download} disabled={workspace.text === ''} className="min-h-11">
                <Download className="mr-1.5 h-4 w-4" aria-hidden /> Download .txt
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={workspace.text === ''} className="min-h-11">
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden /> Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear the whole workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all text ({stats.words} words). It cannot be undone — download
                      a copy first if you might need it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep my text</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setText('');
                        toast({ title: 'Workspace cleared' });
                      }}
                    >
                      Clear workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* quick append */}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim() !== '') {
                    appendText(input, 'manual');
                    setInput('');
                    toast({ title: 'Line added' });
                  }
                }}
                placeholder="Type a line and press Enter to add it…"
                aria-label="Add a line to the workspace"
                className="flex-1 min-w-56 rounded-md border bg-transparent px-3 py-2 text-sm min-h-11"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={input.trim() === ''}
                onClick={() => {
                  appendText(input, 'manual');
                  setInput('');
                  toast({ title: 'Line added' });
                }}
                className="min-h-11"
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Add line
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Read aloud + history */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Read aloud</CardTitle>
              <CardDescription>
                {readAloud.supported
                  ? 'Speaks the exact workspace text with your chosen voice.'
                  : 'Speech synthesis is not available in this browser.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => readAloud.speak(speakTarget)}
                  disabled={!readAloud.supported || speakTarget === ''}
                  className="min-h-11"
                >
                  <Volume2 className="mr-1.5 h-4 w-4" aria-hidden /> Read aloud
                </Button>
                {readAloud.speaking && !readAloud.paused && (
                  <Button variant="secondary" onClick={readAloud.pause} className="min-h-11">
                    <Pause className="mr-1.5 h-4 w-4" aria-hidden /> Pause
                  </Button>
                )}
                {readAloud.paused && (
                  <Button variant="secondary" onClick={readAloud.resume} className="min-h-11">
                    <Play className="mr-1.5 h-4 w-4" aria-hidden /> Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={readAloud.stop}
                  disabled={!readAloud.speaking && !readAloud.paused}
                  className="min-h-11"
                >
                  <Square className="mr-1.5 h-4 w-4" aria-hidden /> Stop
                </Button>
              </div>

              {readAloud.voices.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="voice-select">Voice</Label>
                  <Select
                    value={voiceName}
                    onValueChange={(v) => {
                      setVoiceName(v);
                      readAloud.setVoice(v);
                    }}
                  >
                    <SelectTrigger id="voice-select" aria-label="Voice selection">
                      <SelectValue placeholder="System default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System default</SelectItem>
                      {readAloud.voices.map((v) => (
                        <SelectItem key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="speech-rate">Speech rate</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {settings.speechRate.toFixed(1)}×
                  </span>
                </div>
                <Slider
                  id="speech-rate"
                  value={[settings.speechRate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(v) => updateSettings({ speechRate: v[0] })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" aria-hidden /> Input history
                </CardTitle>
                <Switch
                  checked={workspace.historyEnabled}
                  onCheckedChange={setHistoryEnabled}
                  aria-label="Record input history"
                />
              </div>
              <CardDescription>
                {workspace.historyEnabled
                  ? 'Keeping the last 50 items that entered the workspace.'
                  : 'Turn on to keep a log of what entered the workspace, from which feature.'}
              </CardDescription>
            </CardHeader>
            {workspace.historyEnabled && (
              <CardContent>
                {workspace.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-52 overflow-y-auto list-none p-0 m-0">
                    {workspace.history.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                        <Badge variant="secondary" className="shrink-0">{SOURCE_LABELS[h.source] ?? h.source}</Badge>
                        <span className="truncate">{h.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {workspace.history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory} className="mt-2 text-muted-foreground">
                    <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Clear history
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
