/**
 * Shared text workspace — pure operations.
 *
 * The workspace is the single funnel through which all generated text
 * flows. Modules append on a new line; they never overwrite existing
 * content. Every function here is pure and unit-tested.
 */

export const EMPTY_WORKSPACE_TEXT = '';

/** Append incoming text on its own line. Never clobbers existing text. */
export function appendToWorkspace(existing: string, incoming: string): string {
  const trimmedIncoming = incoming.trim();
  if (trimmedIncoming === '') return existing;
  if (existing.trim() === '') return trimmedIncoming;
  return `${existing.replace(/\s+$/, '')}\n${trimmedIncoming}`;
}

/** Text as spoken by Read Aloud — collapses stray blank lines. */
export function speakableText(text: string): string {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('. ');
}

/** Word and character statistics for the workspace status bar. */
export function workspaceStats(text: string): { words: number; chars: number; lines: number } {
  const trimmed = text.trim();
  return {
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    chars: text.length,
    lines: text === '' ? 0 : text.split('\n').length,
  };
}

/** Downloadable .txt payload (adds a trailing newline for POSIX friendliness). */
export function workspaceToTxt(text: string): string {
  return text.endsWith('\n') || text === '' ? text : text + '\n';
}

export interface HistoryEntry {
  id: string;
  at: number;
  source: 'sign' | 'morse' | 'captions' | 'manual';
  text: string;
}

/** Create a history entry with a monotonic id. */
export function makeHistoryEntry(
  seq: number,
  source: HistoryEntry['source'],
  text: string,
  now = Date.now(),
): HistoryEntry {
  return { id: `h${seq}`, at: now, source, text };
}
