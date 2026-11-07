/**
 * International Morse codec.
 *
 * Conventions (documented in the UI and README):
 *  - `.` = dot, `-` = dash
 *  - Single space separates letters, `/` separates words
 *  - Unknown sequences decode to `[?]` (honest failure, never a guess)
 */

export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '@': '.--.-.',
};

export const UNKNOWN = '[?]';

const REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([char, seq]) => [seq, char]),
);

/** Sequence → character map (the reverse of MORSE_TABLE). */
export const MORSE_REVERSE: Record<string, string> = REVERSE;

export interface DecodeResult {
  text: string;
  /** Indices into the token list that could not be decoded. */
  unknownTokens: number[];
}

/**
 * Decode a Morse string into text.
 * Tokens: letters separated by single spaces, words by `/`.
 */
export function decodeMorse(input: string): DecodeResult {
  const trimmed = input.trim();
  if (trimmed === '') return { text: '', unknownTokens: [] };

  const words = trimmed.split('/').map((w) => w.trim()).filter((w) => w !== '');
  const unknownTokens: number[] = [];
  let tokenIndex = -1;
  const decodedWords = words.map((word) => {
    const letters = word.split(/\s+/).filter(Boolean);
    const chars = letters.map((seq) => {
      tokenIndex += 1;
      const char = REVERSE[seq];
      if (char === undefined) {
        unknownTokens.push(tokenIndex);
        return UNKNOWN;
      }
      return char;
    });
    return chars.join('');
  });
  return { text: decodedWords.join(' '), unknownTokens };
}

/** Encode plain text to Morse (letters spaced by ' ', words by '/'). */
export function encodeMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split('')
        .map((c) => MORSE_TABLE[c] ?? '')
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join(' / ');
}
