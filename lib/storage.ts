import {
  VocabEntry,
  ProgressStats,
  ExerciseType,
  ConjugationRecord,
  ConjugationSectionRecord,
} from './types';
import { PROFILE_STORAGE_KEY } from './profiles';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'default';
}

function normWord(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, {
      cache: 'no-store',
      headers: { 'x-user-id': getUserId() },
    });
    if (!res.ok) return fallback;
    return res.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

async function putJson(path: string, data: unknown): Promise<void> {
  await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
    body: JSON.stringify(data),
  });
}

// ─── vocab ───────────────────────────────────────────────────────────────────

export async function getVocab(): Promise<VocabEntry[]> {
  return getJson('/api/data/vocab', []);
}

export async function addVocabEntry(
  entry: Omit<VocabEntry, 'id' | 'addedAt' | 'reviewCount'>
): Promise<void> {
  const entries = await getVocab();
  const newEntry: VocabEntry = {
    ...entry,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
    reviewCount: 0,
  };
  await putJson('/api/data/vocab', [newEntry, ...entries]);
}

export async function removeVocabEntry(id: string): Promise<void> {
  const entries = await getVocab();
  await putJson('/api/data/vocab', entries.filter(e => e.id !== id));
}

export async function updateVocabReview(id: string): Promise<void> {
  const entries = await getVocab();
  await putJson(
    '/api/data/vocab',
    entries.map(e =>
      e.id === id
        ? { ...e, reviewCount: e.reviewCount + 1, lastReviewed: new Date().toISOString() }
        : e
    )
  );
}

export async function updateVocabStatus(id: string, correct: boolean): Promise<void> {
  const entries = await getVocab();
  const now = new Date().toISOString();
  await putJson(
    '/api/data/vocab',
    entries.map(e =>
      e.id === id
        ? {
            ...e,
            level: correct ? 5 : 1,
            nextReview: correct ? '' : now,
            reviewCount: e.reviewCount + 1,
            lastReviewed: now,
          }
        : e
    )
  );
}

// Batch-save for a full learning/review session (2 API calls total)
export async function processVocabSession(
  session: Array<{ word: string; translation: string; example?: string; level: number; nextReview: string }>
): Promise<void> {
  const existing = await getVocab();
  const existingByNorm = new Map(existing.map(v => [normWord(v.word), v.id]));

  const updated = existing.map(e => ({ ...e }));
  const toAdd: VocabEntry[] = [];
  const now = new Date().toISOString();

  for (const item of session) {
    const existingId = existingByNorm.get(normWord(item.word));
    if (existingId) {
      const idx = updated.findIndex(e => e.id === existingId);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          level: item.level,
          nextReview: item.nextReview,
          reviewCount: updated[idx].reviewCount + 1,
          lastReviewed: now,
        };
      }
    } else {
      toAdd.push({
        word: item.word,
        translation: item.translation,
        example: item.example,
        level: item.level,
        nextReview: item.nextReview,
        id: crypto.randomUUID(),
        addedAt: now,
        reviewCount: 0,
      });
    }
  }

  await putJson('/api/data/vocab', [...toAdd, ...updated]);
}

// Batch-update existing words by id (for wiederholen sessions)
export async function batchUpdateVocabStatus(
  updates: { id: string; level: number; nextReview: string }[]
): Promise<void> {
  const entries = await getVocab();
  const map = new Map(updates.map(u => [u.id, u]));
  const now = new Date().toISOString();
  await putJson(
    '/api/data/vocab',
    entries.map(e => {
      const upd = map.get(e.id);
      if (!upd) return e;
      return {
        ...e,
        level: upd.level,
        nextReview: upd.nextReview,
        reviewCount: e.reviewCount + 1,
        lastReviewed: now,
      };
    })
  );
}

// ─── stats ───────────────────────────────────────────────────────────────────

const defaultStats: ProgressStats = {
  exercisesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  streak: 0,
  lastActivity: '',
  exercisesByType: {},
};

export async function getStats(): Promise<ProgressStats> {
  const data = await getJson<ProgressStats | null>('/api/data/stats', null);
  return data ? { ...defaultStats, ...data } : defaultStats;
}

export async function recordExercise(
  type: ExerciseType,
  correct: number,
  total: number
): Promise<void> {
  const stats = await getStats();
  const today = new Date().toDateString();
  const lastDay = stats.lastActivity ? new Date(stats.lastActivity).toDateString() : '';
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const newStats: ProgressStats = {
    ...stats,
    exercisesCompleted: stats.exercisesCompleted + 1,
    correctAnswers: stats.correctAnswers + correct,
    totalAnswers: stats.totalAnswers + total,
    streak:
      lastDay === yesterday ? stats.streak + 1 : lastDay === today ? stats.streak : 1,
    lastActivity: new Date().toISOString(),
    exercisesByType: {
      ...stats.exercisesByType,
      [type]: (stats.exercisesByType[type] ?? 0) + 1,
    },
  };

  await putJson('/api/data/stats', newStats);
}

// ─── conjugation ─────────────────────────────────────────────────────────────

export async function getConjugationRecords(): Promise<ConjugationRecord[]> {
  const data = await getJson<unknown[]>('/api/data/conjugation', []);
  return data.filter(
    (r): r is ConjugationRecord =>
      typeof r === 'object' && r !== null && Array.isArray((r as ConjugationRecord).sections)
  );
}

export interface SectionAttempt {
  tense: string;
  tenseName_de: string;
  pronouns: string[];
  correctAnswers: string[];
  userAnswers: string[];
}

export async function upsertConjugationAttempt(
  verb: string,
  sections: SectionAttempt[]
): Promise<void> {
  const records = await getConjugationRecords();

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
          !correct[i]
            ? { pronoun: p, correct: s.correctAnswers[i], userAnswer: s.userAnswers[i] }
            : null
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
    for (const cs of computed) {
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
    }
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

  await putJson('/api/data/conjugation', records);
}
