'use client';

import { VocabEntry, ProgressStats, ExerciseType, ConjugationRecord } from './types';

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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function upsertConjugationAttempt(
  verb: string,
  tense: string,
  tenseName_de: string,
  pronouns: string[],
  correctAnswers: string[],
  userAnswers: string[]
): void {
  const records = getConjugationRecords();
  const id = `${verb}|${tense}`;

  const correct = userAnswers.map(
    (a, i) => a.trim().toLowerCase() === correctAnswers[i].toLowerCase()
  );
  const correctCount = correct.filter(Boolean).length;
  const recentMistakes = pronouns
    .map((p, i) =>
      !correct[i] ? { pronoun: p, correct: correctAnswers[i], userAnswer: userAnswers[i] } : null
    )
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const existing = records.find(r => r.id === id);
  if (existing) {
    existing.totalAttempts += 1;
    existing.totalCorrect += correctCount;
    existing.totalQuestions += pronouns.length;
    existing.recentMistakes = recentMistakes;
    existing.lastAttempted = new Date().toISOString();
    existing.mastered = recentMistakes.length === 0;
    existing.correctAnswers = correctAnswers;
    existing.tenseName_de = tenseName_de;
  } else {
    records.unshift({
      id,
      verb,
      tense,
      tenseName_de,
      pronouns,
      correctAnswers,
      totalAttempts: 1,
      totalCorrect: correctCount,
      totalQuestions: pronouns.length,
      recentMistakes,
      lastAttempted: new Date().toISOString(),
      mastered: recentMistakes.length === 0,
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
