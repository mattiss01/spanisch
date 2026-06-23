// Pure achievement/badge computation. Unlock state is derived from existing
// server data (no DB) so it's deterministic; the UI tracks "newly unlocked" via
// localStorage. Numeric badges expose progress toward the next threshold.

export interface Badge {
  id: string;
  icon: string;
  label: string;
  desc: string;
  unlocked: boolean;
  progress?: { have: number; need: number };
}

export interface BadgeInput {
  wordsKnown: number;   // vocab at level 5
  streak: number;
  stars: number;        // months won
  sentencesDone: number;
  verbsDone: number;    // conjugation records practiced
  inTop5: boolean;      // appears in the all-time daily top-5
}

function tier(id: string, icon: string, label: string, have: number, need: number, desc: string): Badge {
  return { id, icon, label, desc, unlocked: have >= need, progress: { have: Math.min(have, need), need } };
}

export function computeBadges(i: BadgeInput): Badge[] {
  return [
    tier('first-word', '🌱', 'First steps', i.wordsKnown, 1, 'Learn your first word'),
    tier('wordsmith-50', '📚', 'Wordsmith', i.wordsKnown, 50, 'Know 50 words'),
    tier('wordsmith-200', '📚', 'Wordsmith II', i.wordsKnown, 200, 'Know 200 words'),
    tier('wordsmith-500', '📚', 'Wordsmith III', i.wordsKnown, 500, 'Know 500 words'),
    tier('streak-7', '🔥', 'On a roll', i.streak, 7, 'Reach a 7-day streak'),
    tier('streak-30', '🔥', 'Unstoppable', i.streak, 30, 'Reach a 30-day streak'),
    tier('streak-100', '🔥', 'Centurion', i.streak, 100, 'Reach a 100-day streak'),
    tier('translator-25', '✍️', 'Translator', i.sentencesDone, 25, 'Translate 25 sentences'),
    tier('translator-100', '✍️', 'Translator II', i.sentencesDone, 100, 'Translate 100 sentences'),
    tier('conjugator-10', '🔤', 'Conjugator', i.verbsDone, 10, 'Practise 10 verbs'),
    tier('conjugator-50', '🔤', 'Conjugator II', i.verbsDone, 50, 'Practise 50 verbs'),
    { id: 'record', icon: '🏅', label: 'Record breaker', desc: 'Reach the all-time daily top 5', unlocked: i.inTop5 },
    { id: 'champion', icon: '⭐', label: 'Champion', desc: 'Win a month of THE RACE', unlocked: i.stars >= 1 },
  ];
}
