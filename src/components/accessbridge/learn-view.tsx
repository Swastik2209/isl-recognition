'use client';

/**
 * Learn & Practise — teaches the real vocabularies.
 *  • Quick gestures board with tips (what the camera mode recognises)
 *  • ASL word explorer from the model's genuine 250-class label map
 *  • A short practice checklist per word — honest about being practice,
 *    not a graded test of the model.
 */

import { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GESTURES } from '@/lib/gestures';
import { ASL_CLASSES, ASL_CLASS_COUNT, EVERYDAY_WORDS } from '@/lib/asl-vocab';

export default function LearnView() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" aria-hidden /> Learn &amp; Practise
        </h1>
        <p className="text-muted-foreground max-w-prose">
          What each mode actually recognises, how to shape the signs, and honest notes about
          what recognition can and cannot do.
        </p>
      </header>

      <Tabs defaultValue="quick">
        <TabsList aria-label="Learning sections">
          <TabsTrigger value="quick">Quick gestures ({GESTURES.length})</TabsTrigger>
          <TabsTrigger value="asl">ASL words ({ASL_CLASS_COUNT})</TabsTrigger>
          <TabsTrigger value="honest">How recognition works</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GESTURES.map((g) => (
              <Card key={g.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl" role="img" aria-hidden>{g.symbol}</span>
                    <div>
                      <CardTitle className="text-base">{g.phrase}</CardTitle>
                      <CardDescription className="font-mono text-xs">{g.label}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>{g.tip}</p>
                  <p>Hold it steady for about half a second, hand fully in frame.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="asl" className="mt-4">
          <AslExplorer />
        </TabsContent>

        <TabsContent value="honest" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden /> Reading the honest fine print
              </CardTitle>
              <CardDescription>What recognition is — and what it is not.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong>Quick gestures are a communication board.</strong> Seven fixed hand
                shapes map to seven useful phrases. They are not sign language — ASL and ISL
                are complete languages with their own grammar, and recognising a hand shape is
                not translating a sentence.
              </p>
              <p>
                <strong>ASL words are isolated word recognition.</strong> The pretrained model
                matches one sign at a time against {ASL_CLASS_COUNT} trained classes. Signs
                should be performed on their own, after the GO countdown, with the hand(s)
                inside the frame. Continuous signing, regional variants and fast fingerspelling
                are outside what the model was trained for.
              </p>
              <p>
                <strong>Confidence is not truth.</strong> The model reports its certainty, and
                AccessBridge refuses weak matches outright. When a close second candidate
                exists you will see it — click it if it is the right word.
              </p>
              <p>
                <strong>Environmental limits.</strong> Lighting, distance, camera angle and
                clothing contrast all affect detection. If a sign repeatedly fails, try a
                plainer background and keep your hand(s) fully visible.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AslExplorer() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const source = q === '' ? EVERYDAY_WORDS : ASL_CLASSES;
    return source.filter((w) => w.toLowerCase().includes(q)).slice(0, 60);
  }, [q]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Explore the {ASL_CLASS_COUNT}-word vocabulary</CardTitle>
        <CardDescription>
          Every entry is a real class from the pretrained model&apos;s label map — search to
          check whether a word is supported before you sign it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="learn-search">
            <Search className="inline h-3.5 w-3.5 mr-1" aria-hidden /> Search words
          </Label>
          <Input
            id="learn-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="hello, water, family, finish…"
          />
        </div>
        <div className="max-h-96 overflow-y-auto rounded-md border p-3">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 list-none p-0 m-0">
            {matches.map((w) => (
              <li key={w} className="rounded-md border px-2 py-1.5 text-sm truncate">
                {w}
              </li>
            ))}
            {matches.length === 0 && (
              <li className="text-sm text-muted-foreground col-span-full">
                No supported word matches &quot;{query}&quot;.
              </li>
            )}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: performing an isolated sign works best after the 3-2-1 countdown — start the
          movement the moment GO appears. Signs not in this list are not recognised, and the
          interface will never pretend otherwise.
        </p>
      </CardContent>
    </Card>
  );
}
