import { describe, expect, it } from 'vitest';
import {
  appendToWorkspace,
  makeHistoryEntry,
  speakableText,
  workspaceStats,
  workspaceToTxt,
} from '@/lib/workspace';

describe('workspace append rule — never overwrites', () => {
  it('appends on a new line', () => {
    expect(appendToWorkspace('SOS', 'I need help')).toBe('SOS\nI need help');
  });

  it('empty existing text just takes the incoming text', () => {
    expect(appendToWorkspace('', 'Hello')).toBe('Hello');
    expect(appendToWorkspace('   ', 'Hello')).toBe('Hello');
  });

  it('empty incoming text is a no-op', () => {
    expect(appendToWorkspace('SOS', '')).toBe('SOS');
    expect(appendToWorkspace('SOS', '   ')).toBe('SOS');
  });

  it('module results accumulate in order', () => {
    let text = '';
    text = appendToWorkspace(text, 'Hello');
    text = appendToWorkspace(text, 'SOS');
    text = appendToWorkspace(text, 'Water please');
    expect(text).toBe('Hello\nSOS\nWater please');
  });

  it('trims trailing whitespace of the existing text', () => {
    expect(appendToWorkspace('SOS\n', 'Hi')).toBe('SOS\nHi');
  });
});

describe('speakable text', () => {
  it('joins lines with sentence breaks and drops blank lines', () => {
    expect(speakableText('Hello\n\nSOS\n\nBye')).toBe('Hello. SOS. Bye');
  });

  it('handles empty text', () => {
    expect(speakableText('')).toBe('');
  });
});

describe('workspace stats', () => {
  it('counts words, chars and lines', () => {
    expect(workspaceStats('SOS\nI need help')).toEqual({ words: 4, chars: 15, lines: 2 });
    expect(workspaceStats('')).toEqual({ words: 0, chars: 0, lines: 0 });
  });
});

describe('txt export', () => {
  it('adds a trailing newline', () => {
    expect(workspaceToTxt('SOS')).toBe('SOS\n');
    expect(workspaceToTxt('SOS\n')).toBe('SOS\n');
    expect(workspaceToTxt('')).toBe('');
  });
});

describe('history entries', () => {
  it('creates stable monotonic ids', () => {
    const a = makeHistoryEntry(1, 'morse', 'SOS', 100);
    const b = makeHistoryEntry(2, 'sign', 'Hello', 200);
    expect(a.id).toBe('h1');
    expect(b.id).toBe('h2');
    expect(a.source).toBe('morse');
    expect(b.at).toBe(200);
  });
});
