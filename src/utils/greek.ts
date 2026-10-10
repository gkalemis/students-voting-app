/**
 * Greek Orthography & Typography Utilities
 *
 * Rule of Modern Greek monotonic orthography:
 * When Greek text is in all-caps / uppercase, NO Greek capital letter may retain an accent (tonos).
 * (e.g. Ά -> Α, Έ -> Ε, Ή -> Η, Ί -> Ι, Ό -> Ο, Ύ -> Υ, Ώ -> Ω)
 *
 * Browsers apply this automatically under :lang(el) for CSS text-transform: uppercase,
 * but when the application language is set to English (or any non-Greek locale),
 * standard Unicode casing leaves or creates accented Greek capital letters (e.g. Ά, Έ, etc.).
 *
 * These utilities guarantee that all uppercase Greek text has accents removed across all locales.
 */

const GREEK_ACCENTED_CAPITALS_MAP: Record<string, string> = {
  'Ά': 'Α',
  'Έ': 'Ε',
  'Ή': 'Η',
  'Ί': 'Ι',
  'Ό': 'Ο',
  'Ύ': 'Υ',
  'Ώ': 'Ω',
  'ΐ': 'Ϊ',
  'ΰ': 'Ϋ',
};

const GREEK_LOWER_ACCENTS_MAP: Record<string, string> = {
  'ά': 'α',
  'έ': 'ε',
  'ή': 'η',
  'ί': 'ι',
  'ό': 'ο',
  'ύ': 'υ',
  'ώ': 'ω',
  'ϊ': 'ι',
  'ϋ': 'υ',
  'ΐ': 'ι',
  'ΰ': 'υ',
};

/**
 * Removes accents (tonoi) from capital Greek letters (Ά, Έ, Ή, Ί, Ό, Ύ, Ώ).
 */
export function removeGreekCapitalAccents(str: string): string {
  if (!str) return '';
  return str.replace(/[ΆΈΉΊΌΎΏΐΰ]/g, match => GREEK_ACCENTED_CAPITALS_MAP[match] || match);
}

/**
 * Removes all monotonic accents from Greek characters (both uppercase and lowercase).
 */
export function removeAllGreekAccents(str: string): string {
  if (!str) return '';
  return str
    .replace(/[ΆΈΉΊΌΎΏΐΰ]/g, match => GREEK_ACCENTED_CAPITALS_MAP[match] || match)
    .replace(/[άέήίόύώϊϋ]/g, match => GREEK_LOWER_ACCENTS_MAP[match] || match);
}

/**
 * Converts a string to uppercase following Greek orthography:
 * 1. Pre-strips all monotonic vowel accents (ά->α, έ->ε, etc.)
 * 2. Converts to uppercase using the Greek locale ('el')
 * 3. Strips any accented capital vowels (Ά->Α, Έ->Ε, etc.)
 *
 * Safe for any string (Greek, English, numbers, symbols, mixed).
 */
export function toGreekUppercase(str: string): string {
  if (!str) return '';
  // Step 1: Pre-clean lowercase monotonic accents
  const preCleaned = str.replace(/[άέήίόύώΐΰ]/g, match => {
    if (match === 'ΐ') return 'Ϊ';
    if (match === 'ΰ') return 'Ϋ';
    return GREEK_LOWER_ACCENTS_MAP[match] || match;
  });

  // Step 2: Uppercase with Greek locale rules
  const upper = preCleaned.toLocaleUpperCase('el');

  // Step 3: Ensure no capital letter with tonos remains
  return removeGreekCapitalAccents(upper);
}

/**
 * Checks if a string contains any Greek characters.
 */
export function containsGreek(str: string): boolean {
  if (!str) return false;
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(str);
}
