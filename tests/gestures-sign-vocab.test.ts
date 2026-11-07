import { describe, expect, it } from 'vitest';
import { autoCommitPolicy, GESTURE_BY_LABEL, GESTURES, GESTURE_HOLD_MS } from '@/lib/gestures';
import { softmax, isConfident } from '@/lib/sign-client';
import { searchPhrases, SEED_PHRASES } from '@/lib/phrases';
import { ASL_CLASSES, ASL_CLASS_COUNT, aslClassInfo, EVERYDAY_WORDS } from '@/lib/asl-vocab';

describe('gesture library', () => {
  it('maps all seven verified gestures to useful phrases', () => {
    expect(GESTURES).toHaveLength(7);
    for (const g of GESTURES) {
      expect(GESTURE_BY_LABEL[g.label].phrase.length).toBeGreaterThan(0);
      expect(g.tip.length).toBeGreaterThan(0);
    }
    expect(GESTURE_BY_LABEL.Open_Palm.phrase).toBe('Hello');
    expect(GESTURE_BY_LABEL.Thumb_Up.phrase).toBe('Yes');
    expect(GESTURE_BY_LABEL.Thumb_Down.phrase).toBe('No');
    expect(GESTURE_BY_LABEL.Closed_Fist.phrase).toBe('Wait');
    expect(GESTURE_BY_LABEL.Victory.phrase).toBe('Peace');
    expect(GESTURE_BY_LABEL.Pointing_Up.phrase).toBe('Look');
    expect(GESTURE_BY_LABEL.ILoveYou.phrase).toBe('I love you');
  });
});

describe('auto-commit policy', () => {
  const T0 = 50_000;

  it('does nothing while confidence is below threshold', () => {
    const r = autoCommitPolicy({ label: 'Open_Palm', score: 0.5, at: T0, last: null });
    expect(r.phrase).toBeNull();
    expect(r.next.label).toBe('Open_Palm');
  });

  it('does nothing for None or unknown labels', () => {
    expect(autoCommitPolicy({ label: 'None', score: 0.99, at: T0, last: null }).phrase).toBeNull();
    expect(autoCommitPolicy({ label: 'Weird', score: 0.99, at: T0, last: null }).phrase).toBeNull();
  });

  it('commits after the hold threshold elapses on the same gesture', () => {
    const start = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0, last: null });
    expect(start.phrase).toBeNull();

    const before = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + GESTURE_HOLD_MS - 10, last: start.next });
    expect(before.phrase).toBeNull();

    const commit = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + GESTURE_HOLD_MS, last: start.next });
    expect(commit.phrase).toBe('Hello');
    expect(commit.next.committed).toBe(true);
  });

  it('commits once per hold, then resets when the hand leaves', () => {
    const start = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0, last: null }).next;
    const committed = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + 600, last: start });
    expect(committed.phrase).toBe('Hello');

    // Still held: no second commit.
    const again = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + 1200, last: committed.next });
    expect(again.phrase).toBeNull();

    // Hand leaves, comes back: fresh hold.
    const left = autoCommitPolicy({ label: 'None', score: 0.1, at: T0 + 1300, last: committed.next });
    const fresh = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + 1500, last: left.next });
    expect(fresh.phrase).toBeNull();
    const second = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0 + 2100, last: fresh.next });
    expect(second.phrase).toBe('Hello');
  });

  it('a different gesture starts a new hold immediately', () => {
    const start = autoCommitPolicy({ label: 'Open_Palm', score: 0.9, at: T0, last: null }).next;
    const switched = autoCommitPolicy({ label: 'Thumb_Up', score: 0.9, at: T0 + 100, last: start });
    expect(switched.phrase).toBeNull();
    const commit = autoCommitPolicy({ label: 'Thumb_Up', score: 0.9, at: T0 + 100 + GESTURE_HOLD_MS, last: switched.next });
    expect(commit.phrase).toBe('Yes');
  });
});

describe('sign client helpers', () => {
  it('softmax produces a valid distribution', () => {
    const p = softmax([2.0, 1.0, 0.1]);
    const sum = p.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(p[0]).toBeGreaterThan(p[1]);
  });

  it('confidence threshold comparison', () => {
    expect(isConfident(0.4, 0.3)).toBe(true);
    expect(isConfident(0.2, 0.3)).toBe(false);
  });
});

describe('ASL vocabulary (generated from the real model map)', () => {
  it('has at least 50 real classes — the core project requirement', () => {
    expect(ASL_CLASS_COUNT).toBe(250);
    expect(ASL_CLASSES.length).toBe(ASL_CLASS_COUNT);
  });

  it('maps ids consistently both ways', () => {
    const info = aslClassInfo('hello');
    expect(info).not.toBeNull();
    expect(ASL_CLASSES[info!.id]).toBe('hello');
    expect(aslClassInfo('not-a-real-sign')).toBeNull();
  });

  it('everyday guide words are real model classes', () => {
    for (const w of EVERYDAY_WORDS) expect(ASL_CLASSES).toContain(w);
  });
});

describe('communication library search', () => {
  it('filters by substring case-insensitively', () => {
    const hits = searchPhrases(SEED_PHRASES, 'help');
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe('I need help');
    expect(searchPhrases(SEED_PHRASES, '   ')).toHaveLength(SEED_PHRASES.length);
  });
});
