'use client';

/**
 * ISL (Indian Sign Language) — in-browser recognition with MediaPipe Hands.
 *
 * Runs fully in-browser using a heuristic classifier for 150+ ISL signs
 * including alphabet, numbers, common words, and phrases.
 * No external service required.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CircleAlert,
  Hand,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
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
import { ISL_SIGNS, ISL_CLASS_COUNT, ISL_COMMON_STARTERS, getISLCategories, searchSigns, type ISLSign } from '@/lib/isl-vocab';
import { appendText } from '@/hooks/use-workspace';
import { useSettings } from '@/hooks/use-settings';
import { useIslRecognition, type IslStatus, type IslRecognitionResult } from '@/hooks/use-isl-recognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ISL_STATUS_TEXT: Record<IslStatus, string> = {
  idle: 'Camera off',
  'camera-requesting': 'Requesting camera…',
  'camera-denied': 'Camera unavailable',
  'model-loading': 'Loading hand landmark model…',
  running: 'Recognising — show an ISL sign to the camera',
  paused: 'Recognition paused',
  unsupported: 'Camera not supported',
  'model-error': 'Model failed to load',
};

export default function IslView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const settings = useSettings();
  const { toast } = useToast();
  const [lastCommitted, setLastCommitted] = useState<{ phrase: string; at: number } | null>(null);
  const [manualText, setManualText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ISLSign['category'] | 'all'>('all');
  const [showDictionary, setShowDictionary] = useState(false);

  const handleAutoCommit = useCallback(
    (phrase: string) => {
      appendText(phrase, 'sign');
      setLastCommitted({ phrase, at: Date.now() });
    },
    [],
  );

  const isl = useIslRecognition({
    autoCommit: settings.signAutoCommit,
    onAutoCommit: handleAutoCommit,
    confidenceThreshold: 0.35,
    stabilizationFrames: 3,
  });

  const announcement = lastCommitted ? `Added ${lastCommitted.phrase} to workspace` : '';
  const predictedSign = isl.currentSign?.sign;
  const predictedConfidence = isl.currentSign?.confidence ?? 0;
  const isStable = isl.currentSign && isl.currentSign.confidence >= 0.35;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Hand className="h-6 w-6 text-primary" aria-hidden /> ISL (Indian Sign Language)
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Real-time recognition of <strong>{ISL_CLASS_COUNT}+ ISL signs</strong> including alphabet (A-Z), numbers (0-10),
          common words, and useful phrases. Runs entirely in your browser using MediaPipe Hands — no server needed.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
        {/* Camera + recognition */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Camera</CardTitle>
              <StatusPill
                label={ISL_STATUS_TEXT[isl.status]}
                tone={
                  isl.status === 'running' ? 'good' : isl.status === 'idle' || isl.status === 'paused' ? 'neutral' : 'warn'
                }
              />
            </div>
            <CardDescription>
              The camera starts only when you press the button below. Show one hand clearly to the camera.
              Signs are recognised when held steady for a moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary/50">
              <video
                ref={isl.attachVideo}
                className="h-full w-full scale-x-[-1] object-cover"
                muted
                playsInline
                aria-label="Webcam preview for ISL recognition"
              />
              {isl.status === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
                  <Camera className="h-10 w-10 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Press <strong>Start camera</strong> to begin recognising ISL signs.
                  </p>
                </div>
              )}
              {predictedSign && isStable && (
                <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-background/90 backdrop-blur px-3 py-2 border">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {predictedSign.labelHindi ? `${predictedSign.label} (${predictedSign.labelHindi})` : predictedSign.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {Math.round(predictedConfidence * 100)}%
                    </span>
                  </div>
                  <Progress value={predictedConfidence * 100} className="mt-1.5 h-1.5" aria-label="Confidence" />
                </div>
              )}
              {isl.status === 'running' && !predictedSign && (
                <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-amber-50/90 border px-3 py-2 text-center text-sm text-amber-700">
                  Show a clear hand sign… <span className="animate-pulse">⋯</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isl.status === 'idle' || isl.status === 'camera-denied' || isl.status === 'model-error' || isl.status === 'unsupported' ? (
                <Button onClick={() => void isl.start()} className="min-h-11">
                  <Camera className="mr-1.5 h-4 w-4" aria-hidden />
                  {isl.status === 'idle' ? 'Start camera' : 'Try again'}
                </Button>
              ) : (
                <Button variant="destructive" onClick={isl.stop} className="min-h-11">
                  <CameraOff className="mr-1.5 h-4 w-4" aria-hidden /> Stop camera
                </Button>
              )}
              {isl.status === 'running' && (
                <Button
                  variant="secondary"
                  onClick={() => isl.setRecognising(!isl.recognising)}
                  className="min-h-11"
                  aria-pressed={isl.recognising}
                >
                  {isl.recognising ? 'Pause recognition' : 'Resume recognition'}
                </Button>
              )}
            </div>

            {isl.errorMessage && (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Camera problem</AlertTitle>
                <AlertDescription>{isl.errorMessage}</AlertDescription>
              </Alert>
            )}

            {predictedSign && isStable && (
              <ResultCard
                sign={predictedSign}
                confidence={predictedConfidence}
                alternatives={isl.currentSign?.allPredictions.slice(1) || []}
              />
            )}

            <div role="status" aria-live="polite" className="sr-only">
              {announcement}
            </div>
          </CardContent>
        </Card>

        {/* Side panel: Vocabulary / Manual fallback */}
        <div className="space-y-4">
          {/* Quick reference cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Common Starters
              </CardTitle>
              <CardDescription>
                Frequently used signs to get started. Hold each sign steady for ~1 second.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {ISL_COMMON_STARTERS.map((s) => (
                <div key={s.id} className="rounded-lg border p-3 space-y-1 hover:bg-accent/50 transition-colors cursor-default">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-hidden>{s.labelHindi ? `🇮🇳 ${s.labelHindi}` : '🤟'}</span>
                    <span className="font-medium text-sm">{s.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Manual fallback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" aria-hidden /> Search & Browse Dictionary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="isl-search">Search signs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="isl-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. hello, water, family, A, 5…"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="isl-category">Filter by category</Label>
                <select
                  id="isl-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All ({ISL_CLASS_COUNT})</option>
                  {getISLCategories().map(c => (
                    <option key={c.category} value={c.category}>{c.label} ({c.count})</option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDictionary(!showDictionary)}
                className="w-full"
              >
                {showDictionary ? 'Hide Dictionary' : 'Show Full Dictionary'}
              </Button>
            </CardContent>
          </Card>

          {showDictionary && (
            <VocabularyPanel
              query={searchQuery}
              category={selectedCategory}
              onQueryChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
            />
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" aria-hidden /> Manual fallback
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
            Heuristic classifier: recognises static handshapes for alphabet, numbers, and common words.
            Continuous signing and complex phrases need temporal models.
          </p>
        </div>
      </div>
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

function ResultCard({
  sign,
  confidence,
  alternatives,
}: {
  sign: ISLSign;
  confidence: number;
  alternatives: Array<{ sign: ISLSign; confidence: number }>;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3" role="region" aria-label="Recognition result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recognised sign</p>
          <p className="font-display text-2xl font-semibold">
            {sign.label} {sign.labelHindi && <span className="text-lg font-normal text-muted-foreground">({sign.labelHindi})</span>}
          </p>
          <p className="text-xs text-muted-foreground">Category: {sign.category}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">
            confidence <span className="tabular-nums">{Math.round(confidence * 100)}%</span>
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{sign.description}</p>
      {alternatives.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Alternatives:</span>
          {alternatives.slice(0, 3).map((a) => (
            <Button
              key={a.sign.id}
              size="sm"
              variant="outline"
              onClick={() => appendText(a.sign.label, 'sign')}
              className="h-8"
            >
              {a.sign.label} ({Math.round(a.confidence * 100)}%)
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => appendText(sign.label, 'sign')}
          className="min-h-10"
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add to workspace
        </Button>
        <span className="sr-only" aria-live="polite">
          Recognised {sign.label} with {Math.round(confidence * 100)} percent confidence
        </span>
      </div>
    </div>
  );
}

function VocabularyPanel({
  query,
  category,
  onQueryChange,
  onCategoryChange,
}: {
  query: string;
  category: ISLSign['category'] | 'all';
  onQueryChange: (q: string) => void;
  onCategoryChange: (c: ISLSign['category'] | 'all') => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = ISL_SIGNS.filter(s => {
    if (category !== 'all' && s.category !== category) return false;
    if (!q) return true;
    return s.label.toLowerCase().includes(q) ||
      s.labelHindi?.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);
  }).slice(0, 60);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Full Vocabulary ({filtered.length} of {ISL_CLASS_COUNT})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 overflow-y-auto rounded-md border p-2">
          <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
            {filtered.map((w) => (
              <li key={w.id}>
                <Badge variant="outline" className="font-normal gap-1">
                  {w.label} {w.labelHindi && <span className="text-xs text-muted-foreground">({w.labelHindi})</span>}
                </Badge>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-sm text-muted-foreground">No signs match "{query}".</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}