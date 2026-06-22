import {
  VocabEntry,
  ProgressStats,
  ExerciseType,
  ConjugationRecord,
  ConjugationSectionRecord,
  ArticleRecord,
  ArticleItem,
  ArticleTopic,
  RaceResponse,
  SentenceProgress,
} from './types';
import { PROFILE_STORAGE_KEY } from './profiles';
import { berlinToday } from './race';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'default';
}

// Tolerant read — returns fallback on any error. Use only for display.
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

// Strict read — THROWS on failure. Use before any read-modify-write so that a
// transient read error aborts the write instead of overwriting the file with
// empty/partial data (which would wipe real progress).
async function getJsonStrict<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    cache: 'no-store',
    headers: { 'x-user-id': getUserId() },
  });
  if (!res.ok) throw new Error(`Read failed for ${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function putJson(path: string, data: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Write failed for ${path}: HTTP ${res.status}`);
}

async function postJson(path: string, data: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Write failed for ${path}: HTTP ${res.status}`);
}

// ─── vocab ───────────────────────────────────────────────────────────────────

export async function getVocab(): Promise<VocabEntry[]> {
  return getJson('/api/data/vocab', []);
}

// Strict load — throws on failure so the caller never treats a failed read as
// "no words". Backed by Postgres (Supabase), so reads are strongly consistent.
export async function loadVocabStrict(): Promise<VocabEntry[]> {
  return getJsonStrict<VocabEntry[]>('/api/data/vocab');
}

// Upsert a single word (per-row in the DB, keyed by user + normalized word).
// One word in flight per call, so nothing can clobber the rest of the list.
export async function upsertVocabWord(entry: VocabEntry): Promise<void> {
  await postJson('/api/data/vocab', entry);
}

// ─── stats ───────────────────────────────────────────────────────────────────

const defaultStats: ProgressStats = {
  exercisesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  streak: 0,
  lastActivity: '',
  exercisesByType: {},
  daily: {},
};

// Keep the per-day counter from growing without bound. ~1 year so the race's
// "Progress over time" chart can show long-term cumulative history.
const KEEP_DAILY_DAYS = 365;
function pruneDaily(daily: Record<string, number>): Record<string, number> {
  const cutoff = new Date(Date.now() - KEEP_DAILY_DAYS * 86400000).toISOString().slice(0, 10);
  const out: Record<string, number> = {};
  for (const [d, n] of Object.entries(daily)) if (d >= cutoff) out[d] = n;
  return out;
}

export async function getStats(): Promise<ProgressStats> {
  const data = await getJson<ProgressStats | null>('/api/data/stats', null);
  return data ? { ...defaultStats, ...data } : defaultStats;
}

export async function recordExercise(
  type: ExerciseType,
  correct: number,
  total: number
): Promise<void> {
  const raw = await getJsonStrict<ProgressStats | null>('/api/data/stats');
  const stats = raw ? { ...defaultStats, ...raw } : defaultStats;
  const today = new Date().toDateString();
  const lastDay = stats.lastActivity ? new Date(stats.lastActivity).toDateString() : '';
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Per-day activity tally: every vocabulary flashcard (+1); every conjugated form
  // and every article (declension) item count for half credit, repeats included.
  // Drives the daily goal and the race.
  const dayKey = berlinToday();
  const daily = pruneDaily({ ...(stats.daily ?? {}) });
  if (type === 'vocabulary') {
    daily[dayKey] = (daily[dayKey] ?? 0) + total;
  } else if (type === 'conjugation' || type === 'article') {
    daily[dayKey] = (daily[dayKey] ?? 0) + Math.round(total / 2); // half credit per item
  } else if (type === 'sentence') {
    daily[dayKey] = (daily[dayKey] ?? 0) + total * 2; // 2 points per translated sentence
  }

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
    daily,
  };

  await putJson('/api/data/stats', newStats);
}

// ─── sentence translation SRS ──────────────────────────────────────────────────

// Tolerant read for display.
export async function getSentenceProgress(): Promise<SentenceProgress[]> {
  const data = await getJson<unknown[]>('/api/data/sentences', []);
  return data.filter(
    (r): r is SentenceProgress =>
      typeof r === 'object' && r !== null && typeof (r as SentenceProgress).key === 'string'
  );
}

export async function setSentenceProgress(rows: SentenceProgress[]): Promise<void> {
  await putJson('/api/data/sentences', rows);
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
  const raw = await getJsonStrict<unknown[]>('/api/data/conjugation');
  const records = raw.filter(
    (r): r is ConjugationRecord =>
      typeof r === 'object' && r !== null && Array.isArray((r as ConjugationRecord).sections)
  );

  // Accent-insensitive, matching the Conjugation component's answer check.
  const foldAccents = (s: string) =>
    s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const computed: ConjugationSectionRecord[] = sections.map(s => {
    const correct = s.userAnswers.map(
      (a, i) => foldAccents(a) === foldAccents(s.correctAnswers[i])
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

// ─── article (German declension topics) ───────────────────────────────────────

export async function getArticleRecords(): Promise<ArticleRecord[]> {
  const data = await getJson<unknown[]>('/api/data/artikel', []);
  return data.filter(
    (r): r is ArticleRecord =>
      typeof r === 'object' && r !== null && typeof (r as ArticleRecord).id === 'string'
  );
}

// Records one attempt at a topic: counts correct answers and stores the wrong
// ones. Read-modify-write of the single per-user JSONB row, like conjugation.
export async function upsertArticleAttempt(
  topicId: string,
  topic: string,
  topic_es: string,
  items: ArticleItem[],
  userAnswers: string[]
): Promise<void> {
  const raw = await getJsonStrict<unknown[]>('/api/data/artikel');
  const records = raw.filter(
    (r): r is ArticleRecord =>
      typeof r === 'object' && r !== null && typeof (r as ArticleRecord).id === 'string'
  );

  const correct = items.map((it, i) => {
    const a = userAnswers[i]?.trim().toLowerCase() ?? '';
    return a === it.answer.toLowerCase() || (it.alternatives ?? []).some(alt => alt.toLowerCase() === a);
  });
  const totalCorrect = correct.filter(Boolean).length;
  const totalQuestions = items.length;
  const recentMistakes = items
    .map((it, i) =>
      !correct[i]
        ? { prompt: `${it.before}___${it.after}`, correct: it.answer, userAnswer: userAnswers[i] ?? '' }
        : null
    )
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const mastered = recentMistakes.length === 0;

  const existing = records.find(r => r.id === topicId);
  if (existing) {
    existing.totalAttempts += 1;
    existing.totalCorrect += totalCorrect;
    existing.totalQuestions += totalQuestions;
    existing.recentMistakes = recentMistakes;
    existing.lastAttempted = new Date().toISOString();
    existing.mastered = mastered;
    existing.topic = topic;
    existing.topic_es = topic_es;
  } else {
    records.unshift({
      id: topicId,
      topic,
      topic_es,
      totalAttempts: 1,
      totalCorrect,
      totalQuestions,
      recentMistakes,
      lastAttempted: new Date().toISOString(),
      mastered,
    });
  }

  await putJson('/api/data/artikel', records);
}

// ─── generated article topics (saved AI exercises) ─────────────────────────────

export async function getGeneratedTopics(): Promise<ArticleTopic[]> {
  const data = await getJson<unknown[]>('/api/data/article-topics', []);
  return data.filter(
    (t): t is ArticleTopic =>
      typeof t === 'object' && t !== null && typeof (t as ArticleTopic).id === 'string'
  );
}

// Save a newly generated topic (read-modify-write of the single per-user row).
export async function addGeneratedTopic(topic: ArticleTopic): Promise<void> {
  const raw = await getJsonStrict<unknown[]>('/api/data/article-topics');
  const topics = raw.filter(
    (t): t is ArticleTopic =>
      typeof t === 'object' && t !== null && typeof (t as ArticleTopic).id === 'string'
  );
  topics.unshift(topic);
  await putJson('/api/data/article-topics', topics);
}

// ─── the race (global standings) ───────────────────────────────────────────────

const emptyRace: RaceResponse = {
  month: '',
  today: '',
  racers: [],
  highscores: [],
  history: { dates: [], series: [] },
  stars: {},
};

// Global leaderboard — no user header needed. Tolerant read for display only.
export async function getRace(): Promise<RaceResponse> {
  return getJson<RaceResponse>('/api/race', emptyRace);
}

// Accumulated months-won (⭐) per user, for app-wide display. Tolerant read.
export async function getStars(): Promise<{ stars: Record<string, number>; month: string }> {
  return getJson<{ stars: Record<string, number>; month: string }>('/api/race/stars', {
    stars: {},
    month: '',
  });
}

export async function deleteGeneratedTopic(id: string): Promise<void> {
  const raw = await getJsonStrict<unknown[]>('/api/data/article-topics');
  const topics = raw.filter(
    (t): t is ArticleTopic =>
      typeof t === 'object' && t !== null && typeof (t as ArticleTopic).id === 'string'
  );
  await putJson('/api/data/article-topics', topics.filter(t => t.id !== id));
}
