'use client';

import { VocabEntry, ProgressStats, ExerciseType, ConjugationRecord, ConjugationSectionRecord } from './types';

const VOCAB_KEY = 'spanisch_vocab';
const STATS_KEY = 'spanisch_stats';
const CONJUGATION_KEY = 'spanisch_conjugation';

export function getVocab(): VocabEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVocab(entries: VocabEntry[]): void {
  localStorage.setItem(VOCAB_KEY, JSON.stringify(entries));
}

export function addVocabEntry(entry: Omit<VocabEntry, 'id' | 'addedAt' | 'reviewCount'>): void {
  const entries = getVocab();
  const newEntry: VocabEntry = {
    ...entry,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
    reviewCount: 0,
  };
  saveVocab([newEntry, ...entries]);
}

export function removeVocabEntry(id: string): void {
  saveVocab(getVocab().filter(e => e.id !== id));
}

export function updateVocabReview(id: string): void {
  saveVocab(
    getVocab().map(e =>
      e.id === id
        ? { ...e, reviewCount: e.reviewCount + 1, lastReviewed: new Date().toISOString() }
        : e
    )
  );
}

const defaultStats: ProgressStats = {
  exercisesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  streak: 0,
  lastActivity: '',
  exercisesByType: {},
};

export function getStats(): ProgressStats {
  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats, ...JSON.parse(raw) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

export function getConjugationRecords(): ConjugationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONJUGATION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    // Filter out old-format records that predate the sections[] structure
    return parsed.filter(
      (r): r is ConjugationRecord => typeof r === 'object' && r !== null && Array.isArray((r as ConjugationRecord).sections)
    );
  } catch {
    return [];
  }
}

export interface SectionAttempt {
  tense: string;
  tenseName_de: string;
  pronouns: string[];
  correctAnswers: string[];
  userAnswers: string[];
}

export function upsertConjugationAttempt(verb: string, sections: SectionAttempt[]): void {
  const records = getConjugationRecords();

  const computed: ConjugationSectionRecord[] = sections.map(s => {
    const correct = s.userAnswers.map(
      (a, i) => a.trim().toLowerCase() === s.correctAnswers[i].toLowerCase()
    );
    return {
      tense: s.tense,
      tenseName_de: s.tenseName_de,
      pronouns: s.pronouns,
      correctAnswers: s.correctAnswers,
      totalAttempts: 1,
      totalCorrect: correct.filter(Boolean).length,
      totalQuestions: s.pronouns.length,
      recentMistakes: s.pronouns
        .map((p, i) =>
          !correct[i] ? { pronoun: p, correct: s.correctAnswers[i], userAnswer: s.userAnswers[i] } : null
        )
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };
  });

  const mastered = computed.every(s => s.recentMistakes.length === 0);
  const existing = records.find(r => r.id === verb);

  if (existing) {
    existing.totalAttempts += 1;
    existing.lastAttempted = new Date().toISOString();
    existing.mastered = mastered;
    computed.forEach(cs => {
      const es = existing.sections.find(s => s.tense === cs.tense);
      if (es) {
        es.totalAttempts += 1;
        es.totalCorrect += cs.totalCorrect;
        es.totalQuestions += cs.totalQuestions;
        es.recentMistakes = cs.recentMistakes;
        es.correctAnswers = cs.correctAnswers;
      } else {
        existing.sections.push(cs);
      }
    });
  } else {
    records.unshift({
      id: verb,
      verb,
      sections: computed,
      totalAttempts: 1,
      lastAttempted: new Date().toISOString(),
      mastered,
    });
  }

  localStorage.setItem(CONJUGATION_KEY, JSON.stringify(records));
}

export function recordExercise(type: ExerciseType, correct: number, total: number): void {
  const stats = getStats();
  const today = new Date().toDateString();
  const lastDay = stats.lastActivity ? new Date(stats.lastActivity).toDateString() : '';
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const newStats: ProgressStats = {
    ...stats,
    exercisesCompleted: stats.exercisesCompleted + 1,
    correctAnswers: stats.correctAnswers + correct,
    totalAnswers: stats.totalAnswers + total,
    streak:
      lastDay === yesterday
        ? stats.streak + 1
        : lastDay === today
        ? stats.streak
        : 1,
    lastActivity: new Date().toISOString(),
    exercisesByType: {
      ...stats.exercisesByType,
      [type]: (stats.exercisesByType[type] ?? 0) + 1,
    },
  };

  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
}
