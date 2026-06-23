// Pure achievement/badge computation. Unlock state is derived from existing
// server data (no DB). Badges are grouped into a category and an ordered "series"
// (a single metric) so the UI can reveal the next tier only once the previous one
// is reached. Numeric tiers expose progress toward their threshold.

export interface Badge {
  id: string;
  icon: string;
  label: string;
  desc: string;
  category: string;
  series: string;       // ordered family on one metric (ascending thresholds)
  unlocked: boolean;
  progress?: { have: number; need: number };
}

export interface BadgeInput {
  wordsKnown: number;    // vocab at level 5
  wordsStarted: number;  // vocab entries in the list
  streak: number;
  stars: number;         // months won in THE RACE
  sentencesDone: number; // sentences practised
  verbsDone: number;     // conjugation verbs practised
  bestDay: number;       // best single-day activity count
  lifetimeCards: number; // cumulative items practised
  inTop5: boolean;       // appears in the all-time daily top-5
}

type Def = [need: number, label: string, desc: string];

function tiers(category: string, series: string, icon: string, have: number, defs: Def[]): Badge[] {
  return defs.map(([need, label, desc]) => ({
    category, series, icon, id: `${series}-${need}`, label, desc,
    unlocked: have >= need,
    progress: { have: Math.min(have, need), need },
  }));
}
function flag(category: string, id: string, icon: string, label: string, desc: string, unlocked: boolean): Badge {
  return { category, series: id, id, icon, label, desc, unlocked };
}

export function computeBadges(i: BadgeInput): Badge[] {
  const V = 'Vocabulary', S = 'Sentences', VB = 'Verbs', R = 'The Race', D = 'Dedication', ST = 'Streak';
  return [
    // ── Vocabulary: words known ──
    ...tiers(V, 'known', '📚', i.wordsKnown, [
      [1, 'First word', 'Learn your first word'],
      [10, 'Getting started', 'Know 10 words'],
      [25, 'Budding', 'Know 25 words'],
      [50, 'Wordsmith', 'Know 50 words'],
      [100, 'Century', 'Know 100 words'],
      [250, 'Bookworm', 'Know 250 words'],
      [500, 'Lexicon', 'Know 500 words'],
      [1000, 'Polyglot', 'Know 1,000 words'],
      [1500, 'Erudite', 'Know 1,500 words'],
      [2000, 'Walking dictionary', 'Know 2,000 words'],
      [3000, 'Loremaster', 'Know 3,000 words'],
      [5000, 'Native-like', 'Know 5,000 words'],
    ]),
    // ── Vocabulary: words encountered ──
    ...tiers(V, 'explorer', '🧭', i.wordsStarted, [
      [50, 'Explorer', 'Encounter 50 words'],
      [150, 'Wanderer', 'Encounter 150 words'],
      [400, 'Trailblazer', 'Encounter 400 words'],
      [800, 'Pathfinder', 'Encounter 800 words'],
      [1500, 'Cartographer', 'Encounter 1,500 words'],
      [3000, 'Globetrotter', 'Encounter 3,000 words'],
    ]),
    // ── Streak ──
    ...tiers(ST, 'streak', '🔥', i.streak, [
      [3, 'Spark', 'Reach a 3-day streak'],
      [7, 'On a roll', 'Reach a 7-day streak'],
      [14, 'Fortnight', 'Reach a 14-day streak'],
      [21, 'Habit formed', 'Reach a 21-day streak'],
      [30, 'Unstoppable', 'Reach a 30-day streak'],
      [50, 'Relentless', 'Reach a 50-day streak'],
      [75, 'Iron will', 'Reach a 75-day streak'],
      [100, 'Centurion', 'Reach a 100-day streak'],
      [150, 'Devoted', 'Reach a 150-day streak'],
      [200, 'Marathoner', 'Reach a 200-day streak'],
      [365, 'Year-round', 'Reach a 365-day streak'],
    ]),
    // ── Sentences ──
    ...tiers(S, 'sent', '✍️', i.sentencesDone, [
      [10, 'First lines', 'Translate 10 sentences'],
      [25, 'Translator', 'Translate 25 sentences'],
      [50, 'Phrasemaker', 'Translate 50 sentences'],
      [100, 'Interpreter', 'Translate 100 sentences'],
      [200, 'Wordsmith', 'Translate 200 sentences'],
      [350, 'Storyteller', 'Translate 350 sentences'],
      [500, 'Author', 'Translate 500 sentences'],
      [1000, 'Novelist', 'Translate 1,000 sentences'],
    ]),
    // ── Verbs ──
    ...tiers(VB, 'verbs', '🔤', i.verbsDone, [
      [5, 'Conjugator', 'Practise 5 verbs'],
      [10, 'Tense up', 'Practise 10 verbs'],
      [25, 'Verb master', 'Practise 25 verbs'],
      [50, 'Tense titan', 'Practise 50 verbs'],
      [100, 'Grammar guru', 'Practise 100 verbs'],
      [150, 'Conjugation king', 'Practise 150 verbs'],
      [250, 'Verb virtuoso', 'Practise 250 verbs'],
    ]),
    // ── The Race ──
    flag(R, 'record', '🏅', 'Record breaker', 'Reach the all-time daily top 5', i.inTop5),
    ...tiers(R, 'bigday', '🚀', i.bestDay, [
      [20, 'Warm-up', 'Score 20 in one day'],
      [30, 'Pacer', 'Score 30 in one day'],
      [50, 'Sprint', 'Score 50 in one day'],
      [75, 'Half marathon', 'Score 75 in one day'],
      [100, 'Marathon', 'Score 100 in one day'],
      [150, 'Ultra', 'Score 150 in one day'],
      [200, 'Beast mode', 'Score 200 in one day'],
      [300, 'Superhuman', 'Score 300 in one day'],
    ]),
    ...tiers(R, 'champion', '⭐', i.stars, [
      [1, 'Champion', 'Win a month'],
      [2, 'Back-to-back', 'Win 2 months'],
      [3, 'Triple crown', 'Win 3 months'],
      [5, 'High roller', 'Win 5 months'],
      [8, 'Dynasty', 'Win 8 months'],
      [12, 'Legend', 'Win 12 months'],
      [24, 'Hall of fame', 'Win 24 months'],
    ]),
    // ── Dedication: lifetime practice ──
    ...tiers(D, 'life', '🎓', i.lifetimeCards, [
      [100, 'First steps', 'Practise 100 items'],
      [250, 'Warmed up', 'Practise 250 items'],
      [500, 'Committed', 'Practise 500 items'],
      [1000, 'Dedicated', 'Practise 1,000 items'],
      [2500, 'Diligent', 'Practise 2,500 items'],
      [5000, 'Scholar', 'Practise 5,000 items'],
      [10000, 'Master', 'Practise 10,000 items'],
      [25000, 'Grandmaster', 'Practise 25,000 items'],
      [50000, 'Sage', 'Practise 50,000 items'],
      [100000, 'Living legend', 'Practise 100,000 items'],
    ]),
  ];
}

export const BADGE_CATEGORIES = ['Vocabulary', 'Sentences', 'Verbs', 'Streak', 'The Race', 'Dedication'];

// Within each series, show every unlocked tier plus the next locked one; hide
// further locked tiers until the previous is reached.
export function visibleBadges(badges: Badge[]): Badge[] {
  const seenLockedSeries = new Set<string>();
  const out: Badge[] = [];
  for (const b of badges) {
    if (b.unlocked) { out.push(b); continue; }
    if (!seenLockedSeries.has(b.series)) { out.push(b); seenLockedSeries.add(b.series); }
  }
  return out;
}
