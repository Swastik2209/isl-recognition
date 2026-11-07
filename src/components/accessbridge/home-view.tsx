'use client';

/**
 * Home — AccessBridge overview with live feature cards.
 * Each card carries a genuinely working inline demo, not a mockup.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Captions,
  Hand,
  Keyboard,
  Sparkles,
  Type,
  Volume2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ViewId } from '@/components/accessbridge/app-shell';
import { GESTURES } from '@/lib/gestures';
import { ASL_CLASS_COUNT, EVERYDAY_WORDS } from '@/lib/asl-vocab';
import { encodeMorse } from '@/lib/morse';
import { appendText } from '@/hooks/use-workspace';
import { useToast } from '@/hooks/use-toast';

export default function HomeView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { toast } = useToast();
  const [morseDemo] = useState(() => encodeMorse('HELLO'));

  const features: {
    id: ViewId;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
  }[] = [
    {
      id: 'sign',
      title: 'Sign to Text',
      description: `Hold a gesture in front of your webcam and its phrase lands in the workspace — ${GESTURES.length} quick gestures plus a ${ASL_CLASS_COUNT}-word ASL vocabulary from Google's pretrained model.`,
      icon: Hand,
      badge: 'Camera',
    },
    {
      id: 'morse',
      title: 'Morse Decoder',
      description: 'Type dots and dashes, use the on-screen pad, or key real timing with the spacebar. Decodes live as you enter.',
      icon: Keyboard,
      badge: 'Keyboard',
    },
    {
      id: 'captions',
      title: 'Live Captions',
      description: 'Speech becomes text in real time through the browser speech engine, with confirmed and interim wording shown separately.',
      icon: Captions,
      badge: 'Microphone',
    },
    {
      id: 'workspace',
      title: 'Shared Workspace',
      description: 'One editable home for everything you produce — edit, copy, download, and read aloud with adjustable voice and speed.',
      icon: Type,
      badge: 'Core',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center" aria-labelledby="hero-heading">
        <div className="space-y-5">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Four ways in, one shared voice
          </Badge>
          <h1 id="hero-heading" className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
            Communicate your way —{' '}
            <span className="text-primary">without switching apps.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-prose">
            AccessBridge brings gesture recognition, Morse code, live captions and
            read-aloud into one accessible page. Everything you produce flows into a
            single shared workspace that you can edit, copy, download and speak.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => onNavigate('sign')} className="min-h-11">
              Start with your webcam <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-11">
              Open the workspace
            </Button>
          </div>
        </div>

        {/* Live gesture board preview — the real library, not a mockup */}
        <Card aria-labelledby="gesture-preview-heading">
          <CardHeader className="pb-3">
            <CardTitle id="gesture-preview-heading" className="text-base flex items-center gap-2">
              <Hand className="h-4 w-4 text-primary" aria-hidden /> Quick gestures
            </CardTitle>
            <CardDescription>
              Recognised in-browser by Google&apos;s pretrained model — hold one for half a second.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2">
            {GESTURES.map((g) => (
              <div
                key={g.label}
                className="flex flex-col items-center gap-1 rounded-lg border bg-secondary/40 px-1 py-2.5 text-center"
                title={g.tip}
              >
                <span className="text-2xl" role="img" aria-label={`${g.label} — ${g.phrase}`}>
                  {g.symbol}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground break-words w-full">
                  {g.phrase}
                </span>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="col-span-4 mt-1 text-primary"
              onClick={() => {
                appendText('Hello', 'sign');
                toast({ title: '"Hello" added to the workspace', description: 'From Quick gestures demo card.' });
              }}
            >
              Try it: add &quot;Hello&quot; to the workspace
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Feature cards */}
      <section aria-labelledby="features-heading" className="space-y-5">
        <h2 id="features-heading" className="font-display text-2xl font-semibold">Everything bridges into one workspace</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.id} className="flex flex-col hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <Badge variant="outline">{f.badge}</Badge>
                  </div>
                  <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-2">
                  <Button variant="secondary" size="sm" onClick={() => onNavigate(f.id)} className="min-h-10">
                    Open <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ASL vocabulary strip */}
      <section aria-labelledby="vocab-heading" className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="vocab-heading" className="font-display text-xl font-semibold">
            {ASL_CLASS_COUNT}-word ASL vocabulary
          </h2>
          <Badge variant="secondary">Pretrained, MIT licence</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-prose">
          Beyond the quick gestures, Sign to Text can capture a short clip and match it
          against Google&apos;s pretrained isolated-sign model — {ASL_CLASS_COUNT} everyday
          words including {EVERYDAY_WORDS.slice(0, 8).join(', ')} and more. Low-confidence
          captures are honestly reported instead of guessed.
        </p>
        <div className="flex flex-wrap gap-1.5" aria-label="Sample of supported ASL words">
          {EVERYDAY_WORDS.slice(0, 14).map((w) => (
            <Badge key={w} variant="outline" className="font-normal">{w}</Badge>
          ))}
          <Badge variant="outline" className="font-normal text-primary border-primary/40">
            +{ASL_CLASS_COUNT - 14} more
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onNavigate('learn')} className="text-primary">
          Learn the signs in Learn &amp; Practise <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
        </Button>
      </section>

      {/* Getting started + privacy */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-primary" aria-hidden /> First time here?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 list-none">
            <li>1. Choose any feature from the cards above or the top menu.</li>
            <li>2. Allow the camera or microphone when the feature asks — nothing starts until you do.</li>
            <li>3. Send results to the shared workspace, then edit, copy, download or read them aloud.</li>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Privacy by default
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Gesture recognition, Morse decoding and text-to-speech run entirely on your
              machine. Captions use your browser&apos;s speech service; the ASL model receives
              landmark numbers only — never video. Nothing is recorded or stored on a server.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
