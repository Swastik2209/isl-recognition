/**
 * Quick Gestures — the reliable, in-browser camera path.
 *
 * Built on Google's pretrained MediaPipe GestureRecognizer (7 canned
 * gestures + None). The labels below were verified from the model binary
 * itself (see scripts/ and REPO_ANALYSIS.md). Each gesture maps to a short,
 * genuinely useful phrase. This is a gesture board, NOT sign-language
 * translation — the UI says so explicitly.
 */

export const GESTURE_LABELS = [
  'Closed_Fist',
  'ILoveYou',
  'Open_Palm',
  'Pointing_Up',
  'Thumb_Down',
  'Thumb_Up',
  'Victory',
] as const;

export type GestureLabel = (typeof GESTURE_LABELS)[number];

export interface GestureInfo {
  label: GestureLabel;
  /** Word inserted into the workspace when the gesture is held steady. */
  phrase: string;
  /** Short teaching tip shown on the symbol card. */
  tip: string;
  symbol: string;
}

export const GESTURES: GestureInfo[] = [
  { label: 'Open_Palm', phrase: 'Hello', symbol: '🖐️', tip: 'Open hand, fingers together, palm facing the camera.' },
  { label: 'Thumb_Up', phrase: 'Yes', symbol: '👍', tip: 'Closed fist with the thumb pointing up.' },
  { label: 'Thumb_Down', phrase: 'No', symbol: '👎', tip: 'Closed fist with the thumb pointing down.' },
  { label: 'Closed_Fist', phrase: 'Wait', symbol: '✊', tip: 'Closed fist, thumb resting over the fingers.' },
  { label: 'Victory', phrase: 'Peace', symbol: '✌️', tip: 'Index and middle finger raised in a V.' },
  { label: 'Pointing_Up', phrase: 'Look', symbol: '☝️', tip: 'Index finger pointing up, other fingers closed.' },
  { label: 'ILoveYou', phrase: 'I love you', symbol: '🤟', tip: 'Thumb, index and little finger extended.' },
];

export const GESTURE_HOLD_MS = 500;

export const GESTURE_BY_LABEL: Record<string, GestureInfo> = Object.fromEntries(
  GESTURES.map((g) => [g.label, g]),
);

export const GESTURE_COMMIT_THRESHOLD = 0.6;

/**
 * Pure auto-commit policy used by the recognition loop.
 *
 * Returns the phrase to commit when the same gesture has been held above
 * the confidence threshold for `GESTURE_HOLD_MS`; commits once per hold.
 */
export interface AutoCommitInput {
  /** Current best gesture label ('None' when no gesture is visible). */
  label: string | null;
  score: number;
  at: number;
  /** Previously committed state. */
  last: {
    label: string | null;
    since: number;
    committed: boolean;
  } | null;
}

export interface AutoCommitResult {
  phrase: string | null;
  next: {
    label: string | null;
    since: number;
    committed: boolean;
  };
}

export function autoCommitPolicy(input: AutoCommitInput): AutoCommitResult {
  const { label, score, at } = input;

  // A real gesture label keeps the hold alive even when confidence dips;
  // only None / unknown labels reset it.
  const tracking = label !== null && label !== 'None' && GESTURE_BY_LABEL[label] !== undefined;
  if (!tracking) {
    return { phrase: null, next: { label: null, since: at, committed: false } };
  }

  const last = input.last;
  const sameHold = last !== null && last.label === label && !last.committed;
  const since = sameHold ? last.since : at;

  const confident = score >= GESTURE_COMMIT_THRESHOLD;
  if (confident && sameHold && at - since >= GESTURE_HOLD_MS) {
    return {
      phrase: GESTURE_BY_LABEL[label].phrase,
      next: { label, since, committed: true },
    };
  }

  return { phrase: null, next: { label, since, committed: false } };
}
