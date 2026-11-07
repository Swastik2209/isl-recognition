'use client';

/**
 * Live Captions — Web Speech API.
 * Confirmed vs interim text shown distinctly; text is never discarded on
 * errors; explicit permission/support messaging.
 */

import { useEffect, useState } from 'react';
import { Captions, CircleAlert, Mic, MicOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ViewId } from '@/components/accessbridge/app-shell';
import { useCaptions } from '@/hooks/use-captions';
import { appendText } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CaptionsView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const settings = useSettings();
  const { toast } = useToast();
  const captions = useCaptions(settings.captionsLanguage);
  const [pasted, setPasted] = useState('');

  // Live region text: interim plus tail of confirmed.
  const liveText = [captions.finalText.split('\n').slice(-2).join(' '), captions.interimText]
    .filter(Boolean)
    .join(' … ');

  useEffect(() => () => captions.stop(), [captions.stop]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Captions className="h-6 w-6 text-primary" aria-hidden /> Live Captions
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Speech becomes text while you talk. The microphone starts only when you press
          start, and what has been said is never thrown away when recognition stops.
        </p>
      </header>

      {!captions.supported && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>This browser cannot provide live captions</AlertTitle>
          <AlertDescription>
            Live captions use the Web Speech API, which is available in Chrome and Edge.
            You can still type or paste text here and send it to the workspace.
          </AlertDescription>
        </Alert>
      )}

      {captions.errorMessage && captions.error !== 'unsupported' && (
        <Alert variant={captions.error === 'network' || captions.error === 'not-allowed' || captions.error === 'no-mic' ? 'destructive' : 'default'}>
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Listening stopped</AlertTitle>
          <AlertDescription>{captions.errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Transcript</CardTitle>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  captions.listening ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                )}
              >
                {captions.listening ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                    </span>
                    Listening
                  </>
                ) : (
                  <>
                    <MicOff className="h-3 w-3" aria-hidden /> Not listening
                  </>
                )}
              </span>
              <Badge variant="outline">{settings.captionsLanguage}</Badge>
            </div>
          </div>
          <CardDescription>
            Darker text is confirmed; the lighter tail is still being recognised and may change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="min-h-40 rounded-md border bg-secondary/30 p-4 text-lg leading-relaxed"
            aria-label="Live transcript"
          >
            {captions.finalText === '' && captions.interimText === '' ? (
              <span className="text-muted-foreground">
                {captions.supported
                  ? 'Your transcript appears here when you press Start listening.'
                  : 'Type or paste text below instead.'}
              </span>
            ) : (
              <>
                <span>{captions.finalText}</span>
                {captions.interimText !== '' && (
                  <span className="text-muted-foreground/70"> {captions.interimText}</span>
                )}
              </>
            )}
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {liveText}
          </div>

          <div className="flex flex-wrap gap-2">
            {!captions.listening ? (
              <Button
                onClick={captions.start}
                disabled={!captions.supported}
                className="min-h-11"
              >
                <Mic className="mr-1.5 h-4 w-4" aria-hidden /> Start listening
              </Button>
            ) : (
              <Button variant="destructive" onClick={captions.stop} className="min-h-11">
                <MicOff className="mr-1.5 h-4 w-4" aria-hidden /> Stop listening
              </Button>
            )}
            <Button
              variant="outline"
              disabled={captions.finalText.trim() === ''}
              onClick={() => {
                appendText(captions.finalText, 'captions');
                toast({ title: 'Transcript added to the workspace' });
              }}
              className="min-h-11"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add to workspace
            </Button>
            <Button
              variant="outline"
              disabled={captions.finalText === '' && captions.interimText === ''}
              onClick={captions.reset}
              className="min-h-11"
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden /> Clear transcript
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Browser speech recognition needs network access and requests microphone
            permission on start. Captured text stays on this page until you send it to the
            workspace.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manual fallback</CardTitle>
          <CardDescription>For browsers without the Web Speech API.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Type or paste spoken text here…"
            aria-label="Manual caption text"
            className="flex-1 min-w-56 rounded-md border bg-transparent px-3 py-2 text-sm min-h-11"
          />
          <Button
            variant="secondary"
            disabled={pasted.trim() === ''}
            onClick={() => {
              appendText(pasted, 'captions');
              setPasted('');
              toast({ title: 'Added to the workspace' });
            }}
            className="min-h-11"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add to workspace
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-11">
            Open workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
