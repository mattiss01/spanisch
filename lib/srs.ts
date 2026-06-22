// Shared spaced-repetition helpers used by Vocabulary and Sentences practice.
// Levels: 1–4 are learning phases, 5 = known (no further review).

export type Confidence = 'sicher' | 'unsicher' | 'bekannt' | 'again';

// Days until the next review for each level (index = level).
export const LEVEL_INTERVALS = [0, 1, 3, 7, 14];

export function isDue(nextReview?: string): boolean {
  if (!nextReview) return true;
  return new Date(nextReview) <= new Date();
}

export function computeNewLevel(currentLevel: number, correct: boolean, conf: Confidence): number {
  if (conf === 'again') return 1; // restart from phase 1
  if (!correct) return Math.max(1, currentLevel - 1); // wrong: drop a phase
  if (conf === 'bekannt') return 5; // Easy: mark known
  if (conf === 'unsicher') return Math.max(1, currentLevel); // Hard: stay in phase
  return Math.min(5, currentLevel + 1); // Good: +1 phase
}

export function nextReviewDate(newLevel: number, correct: boolean, conf: Confidence): string {
  // "Again" (restart) or wrong: due now → shows in Review today.
  if (conf === 'again' || !correct) return new Date().toISOString();
  if (newLevel >= 5) return '';
  // "Hard" / "Keep phase": review tomorrow.
  if (conf === 'unsicher') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  const days = LEVEL_INTERVALS[newLevel] ?? 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
