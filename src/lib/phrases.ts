/**
 * Communication Library — seed phrases.
 *
 * Custom communication vocabulary (user-defined quick phrases) is kept
 * strictly separate from the trained recognition vocabulary. A custom
 * phrase is a convenience shortcut; it is never presented as a sign the
 * model can recognise.
 */

export interface LibraryPhrase {
  id: string;
  text: string;
  category: 'needs' | 'feelings' | 'social' | 'care';
  favourite: boolean;
}

export const SEED_PHRASES: LibraryPhrase[] = [
  { id: 'p1', text: 'I need help', category: 'needs', favourite: true },
  { id: 'p2', text: 'Please wait', category: 'needs', favourite: false },
  { id: 'p3', text: 'Water, please', category: 'needs', favourite: false },
  { id: 'p4', text: 'I am in pain', category: 'care', favourite: false },
  { id: 'p5', text: 'Call my doctor', category: 'care', favourite: false },
  { id: 'p6', text: 'I feel fine', category: 'feelings', favourite: false },
  { id: 'p7', text: 'I feel tired', category: 'feelings', favourite: false },
  { id: 'p8', text: 'Thank you', category: 'social', favourite: true },
  { id: 'p9', text: 'Good morning', category: 'social', favourite: false },
  { id: 'p10', text: 'Good night', category: 'social', favourite: false },
  { id: 'p11', text: 'Hello, my name is …', category: 'social', favourite: false },
  { id: 'p12', text: 'Yes', category: 'needs', favourite: false },
  { id: 'p13', text: 'No', category: 'needs', favourite: false },
  { id: 'p14', text: 'I love you', category: 'feelings', favourite: false },
];

export const PHRASE_CATEGORIES: LibraryPhrase['category'][] = ['needs', 'feelings', 'social', 'care'];

export const CATEGORY_LABELS: Record<LibraryPhrase['category'], string> = {
  needs: 'Everyday needs',
  feelings: 'Feelings',
  social: 'Social',
  care: 'Care & health',
};

export function searchPhrases(phrases: LibraryPhrase[], query: string): LibraryPhrase[] {
  const q = query.trim().toLowerCase();
  if (q === '') return phrases;
  return phrases.filter((p) => p.text.toLowerCase().includes(q));
}
