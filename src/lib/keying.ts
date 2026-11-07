/**
 * Timing keying engine — press-and-hold Morse entry.
 *
 * Timing model (International Morse):
 *  - dot              : hold <  dotMs        (default 200 ms)
 *  - dash             : hold >= dotMs
 *  - letter gap       : silence >= letterGapMs (default 600 ms)
 *  - word gap         : silence >= wordGapMs   (default 1600 ms)
 *
 * The engine is pure: state in, events in, new state out. The React layer
 * only feeds pointer/keyboard events and renders the returned snapshot.
 */

export interface KeyingConfig {
  dotMs: number;
  letterGapMs: number;
  wordGapMs: number;
}

export const DEFAULT_KEYING_CONFIG: KeyingConfig = {
  dotMs: 200,
  letterGapMs: 600,
  wordGapMs: 1600,
};

export type KeyEvent =
  | { type: 'press'; at: number }
  | { type: 'release'; at: number }
  | { type: 'tick'; at: number };

export interface KeyingSnapshot {
  /** True while the key is held down. */
  holding: boolean;
  /** Sequence for the letter currently being built ('' when idle). */
  currentLetter: string;
  /** Decoded text so far (words separated by single spaces). */
  text: string;
  /** Measured hold duration of the active press in ms, null when silent. */
  holdMs: number | null;
}

export interface KeyingState {
  config: KeyingConfig;
  holding: boolean;
  pressStart: number | null;
  currentLetter: string;
  text: string;
  /** Time of the last release, for gap measurement. */
  lastRelease: number | null;
  /** True once the pending letter has been committed to `text`. */
  letterClosed: boolean;
  holdMs: number | null;
}

export function createKeyingState(config: KeyingConfig = DEFAULT_KEYING_CONFIG): KeyingState {
  return {
    config,
    holding: false,
    pressStart: null,
    currentLetter: '',
    text: '',
    lastRelease: null,
    letterClosed: false,
    holdMs: null,
  };
}

const DASH = '-';
const DOT = '.';

export function decodeLetterSequence(seq: string, table: Record<string, string>): string {
  if (seq === '') return '';
  return table[seq] ?? '[?]';
}

/**
 * Process pending gaps at time `now`.
 * Returns the same state when nothing needs to change.
 */
function processGaps(state: KeyingState, now: number, table: Record<string, string>): KeyingState {
  if (state.lastRelease === null) return state;
  const gap = now - state.lastRelease;

  if (gap >= state.config.wordGapMs) {
    // Word gap: commit pending letter, then append a word separator.
    const letter = decodeLetterSequence(state.currentLetter, table);
    const base = state.text + letter;
    const withSpace = base === '' ? '' : base.endsWith(' ') ? base : base + ' ';
    return {
      ...state,
      text: withSpace,
      currentLetter: '',
      letterClosed: true,
      lastRelease: null,
    };
  }

  if (gap >= state.config.letterGapMs && !state.letterClosed) {
    return {
      ...state,
      text: state.text + decodeLetterSequence(state.currentLetter, table),
      currentLetter: '',
      letterClosed: true,
    };
  }

  return state;
}

/** Advance the engine with one event. Pure: returns a new state. */
export function stepKeying(state: KeyingState, event: KeyEvent, table: Record<string, string>): KeyingState {
  switch (event.type) {
    case 'press': {
      if (state.holding) return state;
      // Close pending gaps before the new press.
      const closed = processGaps(state, event.at, table);
      return { ...closed, holding: true, pressStart: event.at, holdMs: null };
    }

    case 'release': {
      if (!state.holding || state.pressStart === null) return state;
      const hold = Math.max(0, event.at - state.pressStart);
      const symbol = hold < state.config.dotMs ? DOT : DASH;
      return {
        ...state,
        holding: false,
        pressStart: null,
        currentLetter: state.currentLetter + symbol,
        letterClosed: false,
        lastRelease: event.at,
        holdMs: null,
      };
    }

    case 'tick': {
      if (state.holding && state.pressStart !== null) {
        return { ...state, holdMs: event.at - state.pressStart };
      }
      const processed = processGaps(state, event.at, table);
      return { ...processed, holdMs: null };
    }
  }
}

/** Force-finalise the pending letter (manual "close letter" control). */
export function closeLetter(state: KeyingState, table: Record<string, string>): KeyingState {
  if (state.holding || state.currentLetter === '' || state.letterClosed) return state;
  return {
    ...state,
    text: state.text + decodeLetterSequence(state.currentLetter, table),
    currentLetter: '',
    letterClosed: true,
  };
}

/** Force-finalise a word boundary (manual word-space control). */
export function closeWord(state: KeyingState, table: Record<string, string>): KeyingState {
  if (state.holding) return state;
  const letter = decodeLetterSequence(state.currentLetter, table);
  const base = state.text + letter;
  if (base === '' || base.endsWith(' ')) {
    return { ...state, currentLetter: '', letterClosed: true };
  }
  return { ...state, text: base + ' ', currentLetter: '', letterClosed: true, lastRelease: null };
}

/** Commit all pending work so the text can be consumed elsewhere. */
export function finaliseKeying(state: KeyingState, table: Record<string, string>): KeyingState {
  const closed = closeLetter(state, table);
  return { ...closed, text: closed.text.trimEnd(), lastRelease: null };
}

/** Snapshot for the UI. */
export function snapshotKeying(state: KeyingState): KeyingSnapshot {
  return {
    holding: state.holding,
    currentLetter: state.currentLetter,
    text: state.text,
    holdMs: state.holding ? state.holdMs : null,
  };
}
