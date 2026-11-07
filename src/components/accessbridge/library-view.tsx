'use client';

/**
 * Communication Library — user-defined quick phrases.
 * Strictly separate from the trained recognition vocabulary: a phrase is
 * a text shortcut, never a sign the model can recognise.
 */

import { useMemo, useState } from 'react';
import { Accessibility, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ViewId } from '@/components/accessbridge/app-shell';
import {
  addPhrase,
  deletePhrase,
  editPhrase,
  resetLibrary,
  toggleFavourite,
  useLibrary,
} from '@/hooks/use-library';
import { appendText } from '@/hooks/use-workspace';
import { CATEGORY_LABELS, PHRASE_CATEGORIES, searchPhrases, type LibraryPhrase } from '@/lib/phrases';
import { useToast } from '@/hooks/use-toast';

export default function LibraryView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const library = useLibrary();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<LibraryPhrase['category']>('needs');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const filtered = useMemo(
    () => searchPhrases(library.phrases, query).sort((a, b) => Number(b.favourite) - Number(a.favourite)),
    [library.phrases, query],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
          <Accessibility className="h-6 w-6 text-primary" aria-hidden /> Communication Library
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Your own quick phrases, ready to drop into the workspace. These are text shortcuts —
          they are separate from the signs the camera can recognise.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add a phrase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="new-phrase">Phrase</Label>
              <Input
                id="new-phrase"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newText.trim() !== '') {
                    addPhrase(newText, newCategory);
                    setNewText('');
                    toast({ title: 'Phrase saved' });
                  }
                }}
                placeholder="e.g. Please write it down"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-category">Category</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as LibraryPhrase['category'])}>
                <SelectTrigger id="new-category" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHRASE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={newText.trim() === ''}
            onClick={() => {
              addPhrase(newText, newCategory);
              setNewText('');
              toast({ title: 'Phrase saved' });
            }}
            className="min-h-11"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Save phrase
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Your phrases ({library.phrases.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search phrases"
                className="pl-8 w-56"
                aria-label="Search phrases"
              />
            </div>
          </div>
          <CardDescription>Favourites float to the top. Click a phrase to send it to the workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleFavourite(p.id)}
                  aria-label={p.favourite ? `Remove ${p.text} from favourites` : `Add ${p.text} to favourites`}
                  className="shrink-0"
                >
                  <Star
                    className={`h-4 w-4 ${p.favourite ? 'fill-chart-2 text-chart-2' : 'text-muted-foreground'}`}
                    aria-hidden
                  />
                </button>
                {editingId === p.id ? (
                  <Input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editPhrase(p.id, editingText);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => {
                      editPhrase(p.id, editingText);
                      setEditingId(null);
                    }}
                    className="h-8"
                    aria-label="Edit phrase"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      appendText(p.text, 'manual');
                      toast({ title: 'Added to the workspace', description: p.text });
                    }}
                    className="flex-1 text-left text-sm hover:underline min-h-8"
                  >
                    {p.text}
                  </button>
                )}
                <Badge variant="outline" className="shrink-0 hidden sm:inline-flex">
                  {CATEGORY_LABELS[p.category]}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id);
                    setEditingText(p.text);
                  }}
                  aria-label={`Edit ${p.text}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => deletePhrase(p.id)}
                  aria-label={`Delete ${p.text}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-sm text-muted-foreground py-6 text-center">
                {library.phrases.length === 0
                  ? 'No phrases yet — add your first one above.'
                  : 'Nothing matches that search.'}
              </li>
            )}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => onNavigate('workspace')} className="min-h-10">
              Open workspace
            </Button>
            <Button variant="ghost" onClick={resetLibrary} className="min-h-10 text-muted-foreground">
              Restore starter phrases
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
