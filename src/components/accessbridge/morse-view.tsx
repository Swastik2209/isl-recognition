'use client';

/**
 * Morse Studio — three input paths into one decoder:
 *  1. On-screen pad (dot / dash / letter space / word space)
 *  2. Free typing (. - space / with live decode)
 *  3. Timing key: hold Space (or the big button) — real Morse timing,
 *     adjustable thresholds, measured-pulse timeline.
 * Decoded text is committed to the shared workspace explicitly.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  Delete,
  Download,
  Gauge,
  Info,
  Keyboard,
  Plus,
  Radio,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewId } from '@/components/accessbridge/app-shell';
import { decodeMorse } from '@/lib/morse';
import {
  closeLetter,
  closeWord,
  createKeyingState,
  finaliseKeying,
  snapshotKeying,
  stepKeying,
  type KeyingConfig,
} from '@/lib/keying';
import { MORSE_REVERSE } from '@/lib/morse';
import { appendText } from '@/hooks/use-workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type InputMode = 'pad' | 'type' | 'key';

export default function MorseView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<InputMode>('pad');

  // pad + typing share a sequence string
  const [sequence, setSequence] = useState('');
  const decoded = decodeMorse(sequence);

  // timing key state
  const [keyConfig, setKeyConfig] = useState<KeyingConfig>({ dotMs: 200, letterGapMs: 600, wordGapMs: 1600 });
  const [keySnapshot, setKeySnapshot] = useState(() => snapshotKeying(createKeyingState()));
  const keyStateRef = useRef(createKeyingState());
  const [timeline, setTimeline] = useState<{ holdMs: number; at: number }[]>([]);

  const step = (type: 'press' | 'release' | 'tick', at: number) => {
    const next = stepKeying(keyStateRef.current, { type, at }, MORSE_REVERSE);
    keyStateRef.current = next;
    setKeySnapshot(snapshotKeying(next));
  };

  // animation loop for the timing key
  useEffect(() => {
    if (mode !== 'key') return;
    let raf = 0;
    const loop = () => {
      step('tick', performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, step]);

  const addSymbol = useCallback((symbol: '.' | '-') => {
    setSequence((prev) => (prev.length >= 64 ? prev : prev + symbol));
  }, []);

  const addLetterSpace = useCallback(() => {
    setSequence((prev) => (prev === '' || prev.endsWith(' ') || prev.endsWith('/') ? prev : prev + ' '));
  }, []);

  const addWordSpace = useCallback(() => {
    setSequence((prev) => (prev === '' || prev.endsWith('/') || prev.endsWith(' ') ? prev : prev + '/'));
  }, []);

  const backspace = useCallback(() => setSequence((prev) => prev.slice(0, -1)), []);

  // spacebar capture for the timing key
  useEffect(() => {
    if (mode !== 'key') return;
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' || e.key === ' ';
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (!isSpace(e)) return;
      e.preventDefault();
      if (!e.repeat) {
        const now = performance.now();
        step('press', now);
        setTimeline((prev) => [...prev.slice(-15), { holdMs: -1, at: now }]);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (!isSpace(e)) return;
      e.preventDefault();
      const now = performance.now();
      const state = keyStateRef.current;
      const hold = state.pressStart !== null ? now - state.pressStart : 0;
      step('release', now);
      setTimeline((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].holdMs === -1) {
            next[i] = { holdMs: hold, at: next[i].at };
            break;
          }
        }
        return next;
      });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [mode, step]);

  const commit = useCallback(
    (text: string, label: string) => {
      if (text.trim() === '') return;
      appendText(text, 'morse');
      toast({ title: `${label} added to the workspace`, description: text });
    },
    [toast],
  );

  const keyingText = keySnapshot.text.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Keyboard className="h-6 w-6 text-primary" aria-hidden /> Morse Decoder
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Dots and dashes become text instantly. Use the pad, type directly, or key real
          timing on the spacebar — all paths end in the shared workspace.
        </p>
      </header>

      <Tabs value={mode} onValueChange={(v) => setMode(v as InputMode)}>
        <TabsList aria-label="Morse input mode">
          <TabsTrigger value="pad">On-screen pad</TabsTrigger>
          <TabsTrigger value="type">Type Morse</TabsTrigger>
          <TabsTrigger value="key" className="gap-1.5">
            <Timer className="h-4 w-4" aria-hidden /> Timing key
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'pad' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">On-screen pad</CardTitle>
            <CardDescription>
              Tap symbols in the same rhythm as a Morse key. Single space = new letter, slash = new word.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SequenceBar sequence={sequence} decoded={decoded.text} unknownCount={decoded.unknownTokens.length} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Morse symbols">
              <Button size="lg" variant="secondary" onClick={() => addSymbol('.')} className="min-h-14 text-xl font-mono" aria-label="Add dot">
                •
              </Button>
              <Button size="lg" variant="secondary" onClick={() => addSymbol('-')} className="min-h-14 text-xl font-mono" aria-label="Add dash">
                –
              </Button>
              <Button size="lg" variant="secondary" onClick={addLetterSpace} className="min-h-14 text-sm" aria-label="Add letter space">
                Letter space
              </Button>
              <Button size="lg" variant="secondary" onClick={addWordSpace} className="min-h-14 text-sm" aria-label="Add word space">
                Word space /
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={backspace} className="min-h-11">
                <Delete className="mr-1.5 h-4 w-4" aria-hidden /> Delete
              </Button>
              <Button variant="outline" onClick={() => setSequence('')} className="min-h-11">
                Clear
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  disabled={decoded.text.trim() === ''}
                  onClick={() => commit(decoded.text, 'Decoded text')}
                  className="min-h-11"
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add to workspace
                </Button>
                <Button variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-11">
                  Open workspace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'type' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type Morse</CardTitle>
            <CardDescription>
              Type <code className="rounded bg-muted px-1">.</code> and{' '}
              <code className="rounded bg-muted px-1">-</code>; a single space starts a new
              letter and <code className="rounded bg-muted px-1">/</code> starts a new word.
              Unknown sequences decode to [?].
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="morse-input">Morse input</Label>
              <Input
                id="morse-input"
                value={sequence}
                onChange={(e) => setSequence(e.target.value.replace(/[^.\-/\s]/g, '').slice(0, 128))}
                placeholder="... --- ..."
                className="font-mono text-lg"
                autoComplete="off"
              />
            </div>
            <SequenceBar sequence={sequence} decoded={decoded.text} unknownCount={decoded.unknownTokens.length} />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={decoded.text.trim() === ''}
                onClick={() => commit(decoded.text, 'Decoded text')}
                className="min-h-11"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add to workspace
              </Button>
              <Button variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-11">
                Open workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'key' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] items-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" aria-hidden /> Timing key
              </CardTitle>
              <CardDescription>
                Hold the <strong>Space bar</strong> (or the button below): short press = dot,
                long press = dash. Pauses of {keyConfig.letterGapMs} ms end a letter and{' '}
                {keyConfig.wordGapMs} ms end a word.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onKeyDown={(e) => {
                  if ((e.code === 'Space' || e.key === ' ') && !e.repeat) {
                    e.preventDefault();
                    const now = performance.now();
                    step('press', now);
                    setTimeline((prev) => [...prev.slice(-15), { holdMs: -1, at: now }]);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.code === 'Space' || e.key === ' ') {
                    e.preventDefault();
                    const now = performance.now();
                    const hold = keyStateRef.current.pressStart !== null ? now - keyStateRef.current.pressStart : 0;
                    step('release', now);
                    setTimeline((prev) => {
                      const next = [...prev];
                      for (let i = next.length - 1; i >= 0; i -= 1) {
                        if (next[i].holdMs === -1) {
                          next[i] = { holdMs: hold, at: next[i].at };
                          break;
                        }
                      }
                      return next;
                    });
                  }
                }}
                className={cn(
                  'w-full rounded-xl border-2 transition-all select-none min-h-28 flex flex-col items-center justify-center gap-1',
                  keySnapshot.holding
                    ? 'border-primary bg-accent scale-[0.99]'
                    : 'border-border bg-secondary/50 hover:border-primary/50',
                )}
                aria-label="Timing key — hold to key a dash, tap for a dot"
              >
                <span className="font-display text-2xl font-semibold">
                  {keySnapshot.holding ? 'Keying…' : 'Hold Space or press here'}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {keySnapshot.holdMs !== null ? `${Math.round(keySnapshot.holdMs)} ms` : 'ready'}
                </span>
              </button>

              {/* measured pulse timeline */}
              <div className="flex items-end gap-1 h-16 rounded-md border bg-secondary/40 p-2" aria-hidden>
                {timeline.length === 0 && (
                  <span className="text-xs text-muted-foreground self-center mx-auto">
                    Your key presses appear here — short bars are dots, tall bars are dashes.
                  </span>
                )}
                {timeline.map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3 rounded-sm',
                      t.holdMs >= 0 && t.holdMs < keyConfig.dotMs ? 'bg-chart-2/70' : 'bg-primary/80',
                    )}
                    style={{ height: `${t.holdMs < 0 ? 10 : Math.max(12, Math.min(100, (t.holdMs / keyConfig.dotMs) * 50))}%` }}
                  />
                ))}
              </div>

              <div className="rounded-md border bg-secondary/30 p-3 text-center" role="status" aria-live="polite">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Keyed text</p>
                <p className="font-mono text-2xl min-h-9">
                  {keyingText === '' ? <span className="text-muted-foreground text-base">nothing keyed yet</span> : keyingText}
                </p>
                {keySnapshot.currentLetter !== '' && (
                  <p className="text-xs text-muted-foreground font-mono">
                    current letter: {keySnapshot.currentLetter}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    const final = finaliseKeying(keyStateRef.current, MORSE_REVERSE);
                    keyStateRef.current = final;
                    setKeySnapshot(snapshotKeying(final));
                    commit(final.text, 'Keyed text');
                  }}
                  className="min-h-11"
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add to workspace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    keyStateRef.current = closeLetter(keyStateRef.current, MORSE_REVERSE);
                    setKeySnapshot(snapshotKeying(keyStateRef.current));
                  }}
                  className="min-h-11"
                >
                  Close letter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    keyStateRef.current = closeWord(keyStateRef.current, MORSE_REVERSE);
                    setKeySnapshot(snapshotKeying(keyStateRef.current));
                  }}
                  className="min-h-11"
                >
                  Word space
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    keyStateRef.current = createKeyingState(keyConfig);
                    setKeySnapshot(snapshotKeying(keyStateRef.current));
                    setTimeline([]);
                  }}
                  className="min-h-11"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" aria-hidden /> Thresholds
              </CardTitle>
              <CardDescription>
                Adjust to your rhythm. Dots are holds shorter than the dot threshold.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ThresholdSlider
                label="Dot threshold"
                value={keyConfig.dotMs}
                min={80}
                max={400}
                step={10}
                onChange={(v) => setKeyConfig((c) => ({ ...c, dotMs: v }))}
              />
              <ThresholdSlider
                label="Letter gap"
                value={keyConfig.letterGapMs}
                min={200}
                max={1200}
                step={20}
                onChange={(v) => setKeyConfig((c) => ({ ...c, letterGapMs: v, wordGapMs: Math.max(v + 400, c.wordGapMs) }))}
              />
              <ThresholdSlider
                label="Word gap"
                value={keyConfig.wordGapMs}
                min={600}
                max={3000}
                step={50}
                onChange={(v) => setKeyConfig((c) => ({ ...c, wordGapMs: v, letterGapMs: Math.min(v - 400, c.letterGapMs) }))}
              />
              <p className="text-xs text-muted-foreground flex gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
                Test with your own rhythm — everyone keys slightly differently, and the defaults
                are a starting point, not a standard.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reference chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reference chart</CardTitle>
          <CardDescription>The International Morse alphabet used by the decoder.</CardDescription>
        </CardHeader>
        <CardContent>
          <MorseChart />
        </CardContent>
      </Card>
    </div>
  );
}

function SequenceBar({
  sequence,
  decoded,
  unknownCount,
}: {
  sequence: string;
  decoded: string;
  unknownCount: number;
}) {
  return (
    <div className="rounded-md border bg-secondary/30 p-3 space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Sequence</p>
      <p className="font-mono text-lg break-all min-h-7">{sequence || <span className="text-muted-foreground">—</span>}</p>
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Decodes to</p>
        {unknownCount > 0 && (
          <Badge variant="outline" className="text-destructive border-destructive/40">
            {unknownCount} unknown
          </Badge>
        )}
      </div>
      <p className="font-display text-2xl min-h-9" aria-live="polite">
        {decoded || <span className="text-muted-foreground text-base">nothing yet</span>}
      </p>
    </div>
  );
}

function ThresholdSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`threshold-${label}`}>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{value} ms</span>
      </div>
      <Slider
        id={`threshold-${label}`}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function MorseChart() {
  const entries = Object.entries(
    Object.fromEntries(Object.entries(MORSE_REVERSE).filter(([seq]) => /^[.-]{1,5}$/.test(seq))),
  ).sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
      {entries.map(([seq, char]) => (
        <div key={seq} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
          <span className="font-medium w-4 text-center">{char}</span>
          <span className="font-mono text-sm text-muted-foreground">{seq}</span>
        </div>
      ))}
    </div>
  );
}
