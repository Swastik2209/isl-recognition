'use client';

/**
 * Sign to Text — dual-mode recognition.
 *
 *  • Quick Gestures (default): Google's pretrained MediaPipe GestureRecognizer
 *    runs fully in-browser on a self-hosted model. Holding a gesture for ~0.5 s
 *    auto-inserts its phrase into the shared workspace.
 *  • ASL Words (advanced): a 250-class pretrained Isolated Sign Language model
 *    served by the local Python service. A 3-2-1 countdown paces the capture so
 *    the window contains real signing, not idle frames.
 *
 * Honest states throughout: camera denial, model errors, low-confidence
 * predictions ("no confident match") and a manual text fallback that works
 * with no camera at all.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CircleAlert,
  Hand,
  Info,
  Keyboard,
  Loader2,
  Plus,
  RefreshCw,
  ScanLine,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewId } from '@/components/accessbridge/app-shell';
import { GESTURES, GESTURE_BY_LABEL } from '@/lib/gestures';
import { ASL_CLASSES, ASL_CLASS_COUNT, EVERYDAY_WORDS } from '@/lib/asl-vocab';
import { appendText } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import { useSignRecognition, type SignStatus } from '@/hooks/use-sign-recognition';
import { useAslWords, type AslStatus } from '@/hooks/use-asl-words';
import type { SignResponse, SignServiceInfo } from '@/lib/sign-client';
import { fetchSignInfo } from '@/lib/sign-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SignMode = 'quick-gestures' | 'asl-words';

const QUICK_STATUS_TEXT: Record<SignStatus, string> = {
  idle: 'Camera off',
  'camera-requesting': 'Requesting camera…',
  'model-loading': 'Loading gesture model…',
  running: 'Recognising — hold a gesture steady',
  paused: 'Recognition paused',
  'camera-denied': 'Camera unavailable',
  'model-error': 'Model failed to load',
  unsupported: 'Camera not supported',
};

const ASL_STATUS_TEXT: Record<AslStatus, string> = {
  idle: 'Camera off',
  'camera-requesting': 'Requesting camera…',
  'camera-denied': 'Camera unavailable',
  'holistic-loading': 'Loading landmark model…',
  ready: 'Ready — press the capture button, sign after GO',
  countdown: 'Get ready…',
  capturing: 'Signing window open — do the sign now',
  predicting: 'Matching against 250 signs…',
  unsupported: 'Camera not supported',
};

export default function SignView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const settings = useSettings();
  const { toast } = useToast();
  const [mode, setMode] = useState<SignMode>(settings.defaultSignMode === 'asl-250' ? 'asl-words' : 'quick-gestures');
  const [lastCommitted, setLastCommitted] = useState<{ phrase: string; at: number } | null>(null);
  const [manualText, setManualText] = useState('');
  const [serviceInfo, setServiceInfo] = useState<SignServiceInfo | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [result, setResult] = useState<SignResponse | null>(null);

  // Quick-gestures hook: auto-commit phrases on hold.
  const handleAutoCommit = useCallback(
    (phrase: string) => {
      appendText(phrase, 'sign');
      setLastCommitted({ phrase, at: Date.now() });
    },
    [],
  );
  const quick = useSignRecognition({ autoCommit: settings.signAutoCommit, onAutoCommit: handleAutoCommit });

  // ASL-250 hook: capture window → service prediction.
  const handleAslResult = useCallback(
    (res: SignResponse) => {
      setResult(res);
    },
    [],
  );
  const asl = useAslWords(handleAslResult);

  // Fetch service info lazily when the ASL tab is first shown.
  const infoFetchedRef = useRef(false);
  useEffect(() => {
    if (mode !== 'asl-words' || infoFetchedRef.current) return;
    infoFetchedRef.current = true;
    fetchSignInfo().then((info) => {
      if (info.status === 'ok') setServiceInfo(info);
      else setServiceError(info.message);
    });
  }, [mode]);

  // Screen-reader announcement of the latest committed phrase.
  const announcement = lastCommitted ? `Added ${lastCommitted.phrase} to workspace` : '';

  const predictedWord = result?.status === 'ok' ? result.word : null;
  const aslBusy = asl.status === 'countdown' || asl.status === 'capturing' || asl.status === 'predicting';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Hand className="h-6 w-6 text-primary" aria-hidden /> Sign to Text
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Two ways to sign: <strong>Quick gestures</strong> work instantly on any webcam, and{' '}
          <strong>ASL words</strong> matches a short clip against {ASL_CLASS_COUNT} pretrained
          word signs. Results go to the shared workspace for review before insertion.
        </p>
      </header>

      <Tabs value={mode} onValueChange={(v) => setMode(v as SignMode)}>
        <TabsList aria-label="Sign recognition mode">
          <TabsTrigger value="quick-gestures" className="gap-1.5">
            <Sparkles className="h-4 w-4" aria-hidden /> Quick gestures
          </TabsTrigger>
          <TabsTrigger value="asl-words" className="gap-1.5">
            <ScanLine className="h-4 w-4" aria-hidden /> ASL words ({ASL_CLASS_COUNT})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'quick-gestures' ? (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
          {/* Camera + recognition */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Camera</CardTitle>
                <StatusPill
                  label={QUICK_STATUS_TEXT[quick.status]}
                  tone={
                    quick.status === 'running' ? 'good' : quick.status === 'idle' || quick.status === 'paused' ? 'neutral' : 'warn'
                  }
                />
              </div>
              <CardDescription>
                The camera starts only when you press the button below, and stops fully when you press stop.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary/50">
                <video
                  ref={quick.attachVideo}
                  className="h-full w-full scale-x-[-1] object-cover"
                  muted
                  playsInline
                  aria-label="Webcam preview for gesture recognition"
                />
                {quick.status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
                    <Camera className="h-10 w-10 text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Press <strong>Start camera</strong> to begin recognising the seven quick gestures.
                    </p>
                  </div>
                )}
                {quick.gestureLabel && quick.gestureLabel !== 'None' && quick.recognising && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-background/85 backdrop-blur px-3 py-2 border">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {GESTURE_BY_LABEL[quick.gestureLabel]?.symbol}{' '}
                        {GESTURE_BY_LABEL[quick.gestureLabel]?.phrase ?? quick.gestureLabel}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(quick.gestureScore * 100)}%
                      </span>
                    </div>
                    <Progress value={quick.holdProgress * 100} className="mt-1.5 h-1.5" aria-label="Hold progress" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {quick.status === 'idle' || quick.status === 'camera-denied' || quick.status === 'model-error' || quick.status === 'unsupported' ? (
                  <Button onClick={() => void quick.start()} className="min-h-11">
                    <Camera className="mr-1.5 h-4 w-4" aria-hidden />
                    {quick.status === 'idle' ? 'Start camera' : 'Try again'}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={quick.stop} className="min-h-11">
                    <CameraOff className="mr-1.5 h-4 w-4" aria-hidden /> Stop camera
                  </Button>
                )}
                {quick.status === 'running' && (
                  <Button
                    variant="secondary"
                    onClick={() => quick.setRecognising(!quick.recognising)}
                    className="min-h-11"
                    aria-pressed={quick.recognising}
                  >
                    {quick.recognising ? 'Pause recognition' : 'Resume recognition'}
                  </Button>
                )}
              </div>

              {quick.errorMessage && (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Camera problem</AlertTitle>
                  <AlertDescription>{quick.errorMessage}</AlertDescription>
                </Alert>
              )}

              <div role="status" aria-live="polite" className="sr-only">
                {announcement}
              </div>
            </CardContent>
          </Card>

          {/* Teaching board + manual fallback */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">The seven quick gestures</CardTitle>
                <CardDescription>
                  Hold a gesture for about half a second{settings.signAutoCommit ? ' and it is added automatically.' : ', then press Add below the preview.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {GESTURES.map((g) => (
                  <div key={g.label} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-hidden>{g.symbol}</span>
                      <span className="font-medium text-sm">{g.phrase}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{g.tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-primary" aria-hidden /> Manual fallback
                </CardTitle>
                <CardDescription>No camera needed — type what you want to say.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type here and send it to the workspace…"
                  aria-label="Manual text fallback"
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={manualText.trim() === ''}
                    onClick={() => {
                      appendText(manualText, 'sign');
                      setManualText('');
                      toast({ title: 'Added to the workspace' });
                    }}
                    className="min-h-10"
                  >
                    <Plus className="mr-1 h-4 w-4" aria-hidden /> Add to workspace
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-10">
                    Open workspace
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground flex gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
              Quick gestures recognise seven fixed hand shapes — they are a communication
              board, not a sign-language translator. For full word signs, switch to the ASL
              words tab.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
          {/* ASL capture panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">ASL words capture</CardTitle>
                <StatusPill
                  label={ASL_STATUS_TEXT[asl.status]}
                  tone={asl.status === 'capturing' ? 'good' : asl.status === 'ready' ? 'good' : asl.status === 'idle' ? 'neutral' : 'warn'}
                />
              </div>
              <CardDescription>
                After GO, perform one sign for about two seconds. Landmarks — never video — are
                matched against the pretrained {ASL_CLASS_COUNT}-word model on this machine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary/50">
                <video
                  ref={asl.attachVideo}
                  className="h-full w-full scale-x-[-1] object-cover"
                  muted
                  playsInline
                  aria-label="Webcam preview for ASL word capture"
                />
                {asl.status === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
                    <Camera className="h-10 w-10 text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Press <strong>Start camera</strong>, then <strong>Capture a sign</strong> and
                      wait for GO before signing.
                    </p>
                  </div>
                )}
                {asl.countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="font-display text-8xl font-semibold text-primary tabular-nums" aria-live="assertive">
                      {asl.countdown}
                    </span>
                  </div>
                )}
                {asl.status === 'capturing' && (
                  <div className="absolute top-3 left-3 right-3">
                    <Progress value={asl.captureProgress * 100} aria-label="Capture progress" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {asl.status === 'idle' || asl.status === 'camera-denied' || asl.status === 'unsupported' ? (
                  <Button onClick={() => void asl.start()} className="min-h-11">
                    <Camera className="mr-1.5 h-4 w-4" aria-hidden />
                    {asl.status === 'idle' ? 'Start camera' : 'Try again'}
                  </Button>
                ) : (
                  <>
                    <Button onClick={asl.beginCapture} disabled={aslBusy} className="min-h-11">
                      <Timer className="mr-1.5 h-4 w-4" aria-hidden />
                      {asl.status === 'ready' ? 'Capture a sign' : 'Working…'}
                    </Button>
                    <Button variant="destructive" onClick={asl.stop} className="min-h-11">
                      <CameraOff className="mr-1.5 h-4 w-4" aria-hidden /> Stop camera
                    </Button>
                  </>
                )}
              </div>

              {asl.errorMessage && (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Camera problem</AlertTitle>
                  <AlertDescription>{asl.errorMessage}</AlertDescription>
                </Alert>
              )}

              {result && <ResultCard result={result} serviceInfo={serviceInfo} />}
            </CardContent>
          </Card>

          {/* Vocabulary panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Model</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {serviceInfo ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{serviceInfo.n_classes} word classes</Badge>
                      <Badge variant="secondary">MIT licence</Badge>
                      <Badge variant="secondary">runs locally</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Pretrained for Google&apos;s Isolated Sign Language Recognition challenge
                      (1st-place solution) on MediaPipe landmark data. Confidence threshold{' '}
                      {Math.round(serviceInfo.confidence_threshold * 100)}% — weaker matches are
                      reported honestly rather than guessed.
                    </p>
                  </>
                ) : serviceError ? (
                  <Alert variant="destructive">
                    <CircleAlert className="h-4 w-4" />
                    <AlertTitle>Sign service offline</AlertTitle>
                    <AlertDescription>
                      {serviceError} Start it with{' '}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">python mini-services/sign-service/app.py</code>{' '}
                      — Quick gestures keep working without it.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking the sign service…
                  </p>
                )}
              </CardContent>
            </Card>

            <VocabularyPanel />

            <p className="text-xs text-muted-foreground flex gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
              Isolated word recognition: one sign per capture, clear of clutter and with your
              whole hand(s) visible. It does not translate continuous signing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- shared pieces ---- */

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'neutral' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'good' && 'bg-chart-3/15 text-chart-3',
        tone === 'warn' && 'bg-destructive/10 text-destructive',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          tone === 'good' && 'bg-chart-3',
          tone === 'warn' && 'bg-destructive',
          tone === 'neutral' && 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

function ResultCard({ result, serviceInfo }: { result: SignResponse; serviceInfo: SignServiceInfo | null }) {
  const threshold = serviceInfo?.confidence_threshold ?? 0.3;

  if (result.status === 'no_hand') {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No hand visible</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  if (result.status === 'error') {
    return (
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>Recognition error</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  if (result.status === 'no_match') {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No confident match</AlertTitle>
        <AlertDescription>
          {result.message} Closest candidates:{' '}
          {result.alternatives.map((a) => `${a.word} (${Math.round(a.confidence * 100)}%)`).join(', ')}.
        </AlertDescription>
      </Alert>
    );
  }

  const marginal = result.margin < 0.15;
  return (
    <div className="rounded-lg border p-4 space-y-3" role="region" aria-label="Recognition result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recognised word</p>
          <p className="font-display text-2xl font-semibold">{result.word}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">
            confidence <span className="tabular-nums">{Math.round(result.confidence * 100)}%</span>
          </p>
          <p className="text-muted-foreground">
            margin <span className="tabular-nums">{result.margin.toFixed(2)}</span>
          </p>
        </div>
      </div>
      {marginal && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Close margin — the runner-up is nearly as likely. Double-check before inserting.
        </p>
      )}
      {result.alternatives.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">If that looks wrong:</span>
          {result.alternatives.map((a) => (
            <Button
              key={a.word}
              size="sm"
              variant="outline"
              onClick={() => appendText(a.word, 'sign')}
              className="h-8"
            >
              Insert {a.word}
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => appendText(result.word, 'sign')}
          className="min-h-10"
          disabled={result.confidence < threshold}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add to workspace
        </Button>
        <span className="sr-only" aria-live="polite">
          Recognised {result.word} with {Math.round(result.confidence * 100)} percent confidence
        </span>
      </div>
    </div>
  );
}

function VocabularyPanel() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = q === '' ? EVERYDAY_WORDS : ASL_CLASSES.filter((w) => w.toLowerCase().includes(q)).slice(0, 40);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Supported words</CardTitle>
        <CardDescription>
          {ASL_CLASS_COUNT} classes generated from the model&apos;s real label map.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="vocab-search">Search vocabulary</Label>
          <Input
            id="vocab-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. hello, water, family…"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-md border p-2">
          <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
            {matches.map((w) => (
              <li key={w}>
                <Badge variant="outline" className="font-normal">{w}</Badge>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="text-sm text-muted-foreground">No words match &quot;{query}&quot;.</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
