import { describe, expect, it } from 'vitest';
import {
  closeLetter,
  closeWord,
  createKeyingState,
  finaliseKeying,
  snapshotKeying,
  stepKeying,
  type KeyEvent,
} from '@/lib/keying';
import { MORSE_REVERSE } from '@/lib/morse';

const T0 = 1_000_000;

function feed(state: ReturnType<typeof createKeyingState>, events: KeyEvent[]) {
  let s = state;
  for (const e of events) s = stepKeying(s, e, MORSE_REVERSE);
  return s;
}

describe('keying — holds become dots and dashes', () => {
  it('a short hold is a dot; after the letter gap it decodes to E', () => {
    const s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 90 },
      { type: 'tick', at: T0 + 90 + 700 },
    ]);
    expect(s.currentLetter).toBe('');
    expect(s.text).toBe('E');
  });

  it('a long hold is a dash (T after keying to 300ms)', () => {
    const s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 300 },
      { type: 'tick', at: T0 + 300 + 700 },
    ]);
    expect(s.text).toBe('T');
  });

  it('builds multi-symbol letters (S = ...)', () => {
    const s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 80 },
      { type: 'press', at: T0 + 180 },
      { type: 'release', at: T0 + 260 },
      { type: 'press', at: T0 + 360 },
      { type: 'release', at: T0 + 440 },
      { type: 'tick', at: T0 + 440 + 700 },
    ]);
    expect(s.text).toBe('S');
  });

  it('word gap inserts a space (hello = .... . .-.. .-.. ---)', () => {
    const s = feed(createKeyingState(), [
      // E
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 80 },
      // word gap (>1600ms silence)
      { type: 'tick', at: T0 + 80 + 1700 },
      // T
      { type: 'press', at: T0 + 80 + 1700 + 50 },
      { type: 'release', at: T0 + 80 + 1700 + 50 + 300 },
      { type: 'tick', at: T0 + 80 + 1700 + 50 + 300 + 700 },
    ]);
    expect(s.text).toBe('E T');
  });
});

describe('keying — manual controls', () => {
  it('closeLetter commits the pending letter immediately', () => {
    let s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 300 },
    ]);
    s = closeLetter(s, MORSE_REVERSE);
    expect(s.text).toBe('T');
    expect(s.currentLetter).toBe('');
  });

  it('closeWord commits pending letter and word space', () => {
    let s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 80 },
      { type: 'tick', at: T0 + 90 },
    ]);
    s = closeWord(s, MORSE_REVERSE);
    expect(s.text).toBe('E ');
    // finalise trims the trailing space
    expect(finaliseKeying(s, MORSE_REVERSE).text).toBe('E');
  });

  it('closeLetter is a no-op when idle or already closed', () => {
    const idle = createKeyingState();
    expect(closeLetter(idle, MORSE_REVERSE)).toBe(idle);
    const s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'release', at: T0 + 80 },
      { type: 'tick', at: T0 + 800 },
    ]);
    expect(closeLetter(s, MORSE_REVERSE)).toBe(s);
  });
});

describe('keying — snapshot', () => {
  it('reports holding state and measured hold', () => {
    let s = feed(createKeyingState(), [
      { type: 'press', at: T0 },
      { type: 'tick', at: T0 + 120 },
    ]);
    let snap = snapshotKeying(s);
    expect(snap.holding).toBe(true);
    expect(snap.holdMs).toBe(120);

    s = feed(s, [{ type: 'release', at: T0 + 200 }]);
    snap = snapshotKeying(s);
    expect(snap.holding).toBe(false);
    expect(snap.holdMs).toBe(null);
    expect(snap.currentLetter).toBe('-');
  });

  it('ignores double press and stray release', () => {
    const s = feed(createKeyingState(), [
      { type: 'release', at: T0 },
      { type: 'press', at: T0 },
      { type: 'press', at: T0 + 10 },
    ]);
    expect(s.holding).toBe(true);
    expect(s.pressStart).toBe(T0);
  });
});
