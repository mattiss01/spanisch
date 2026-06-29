// Shared spaced-repetition helpers used by Vocabulary and Sentences practice.
// Vocabulary: levels 1–5 are learning phases, 6 = known.
// Sentences: levels 1–4 are learning phases, 5 = known.

export type Confidence = 'sicher' | 'unsicher' | 'bekannt' | 'again';

export const VOCAB_KNOWN_LEVEL = 6;
export const SENTENCE_KNOWN_LEVEL = 5;

// Days until the next review for each level (index = level).
export const SENTENCE_INTERVALS = [0, 1, 3, 7, 14];
export const VOCAB_INTERVALS = [0, 1, 3, 7, 14, 30];

/** @deprecated Use SENTENCE_INTERVALS or VOCAB_INTERVALS */
export const LEVEL_INTERVALS = SENTENCE_INTERVALS;

export interface SrsOptions {
  knownLevel?: number;
  intervals?: number[];
}

const SENTENCE_DEFAULTS: Required<SrsOptions> = {
  knownLevel: SENTENCE_KNOWN_LEVEL,
  intervals: SENTENCE_INTERVALS,
};

// Before Phase 5 existed, vocab stored Known as level 5 with no nextReview.
export function effectiveVocabLevel(level: number, nextReview?: string): number {
  if (level === 5 && !nextReview) return VOCAB_KNOWN_LEVEL;
  return level;
}

export function isKnownLevel(
  level: number,
  nextReview?: string,
  knownLevel: number = SENTENCE_KNOWN_LEVEL,
): boolean {
  const effective =
    knownLevel === VOCAB_KNOWN_LEVEL ? effectiveVocabLevel(level, nextReview) : level;
  return effective >= knownLevel;
}

export function isReviewable(
  level: number,
  nextReview?: string,
  knownLevel: number = SENTENCE_KNOWN_LEVEL,
): boolean {
  const effective =
    knownLevel === VOCAB_KNOWN_LEVEL ? effectiveVocabLevel(level, nextReview) : level;
  return effective > 0 && effective < knownLevel;
}

export function isDue(nextReview?: string): boolean {
  if (!nextReview) return true;
  return new Date(nextReview) <= new Date();
}

export function computeNewLevel(
  currentLevel: number,
  correct: boolean,
  conf: Confidence,
  knownLevel: number = SENTENCE_KNOWN_LEVEL,
): number {
  if (conf === 'again') return 1; // restart from phase 1
  if (!correct) return Math.max(1, currentLevel - 1); // wrong: drop a phase
  if (conf === 'bekannt') return knownLevel; // Easy: mark known
  if (conf === 'unsicher') return Math.max(1, currentLevel); // Hard: stay in phase
  return Math.min(knownLevel, currentLevel + 1); // Good: +1 phase
}

export function nextReviewDate(
  newLevel: number,
  correct: boolean,
  conf: Confidence,
  opts: SrsOptions = {},
): string {
  const { knownLevel, intervals } = { ...SENTENCE_DEFAULTS, ...opts };
  // "Again" (restart) or wrong: due now → shows in Review today.
  if (conf === 'again' || !correct) return new Date().toISOString();
  if (newLevel >= knownLevel) return '';
  // "Hard" / "Keep phase": review tomorrow.
  if (conf === 'unsicher') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  const days = intervals[newLevel] ?? 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
