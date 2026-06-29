import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VocabEntry, ProgressStats, ConjugationRecord, ArticleRecord, ArticleTopic, RaceState, SentenceProgress } from './types';

// ─── client ──────────────────────────────────────────────────────────────────

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase env not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function dbConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Same normalization the client uses to dedupe words (lib/storage.ts normWord).
export function normWord(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

// ─── row ↔ VocabEntry mapping ──────────────────────────────────────────────────

interface VocabRow {
  id: string;
  user_id: string;
  norm_word: string;
  word: string;
  translation: string;
  example: string | null;
  level: number;
  next_review: string | null;
  last_reviewed: string | null;
  review_count: number;
  added_at: string;
}

function rowToEntry(r: VocabRow): VocabEntry {
  return {
    id: r.id,
    word: r.word,
    translation: r.translation,
    example: r.example ?? undefined,
    level: r.level,
    nextReview: r.next_review ?? '',
    lastReviewed: r.last_reviewed ?? undefined,
    reviewCount: r.review_count ?? 0,
    addedAt: r.added_at,
  };
}

function entryToRow(userId: string, e: VocabEntry): Omit<VocabRow, 'id'> & { id?: string } {
  return {
    id: e.id && !e.id.startsWith('local-') ? e.id : undefined,
    user_id: userId,
    norm_word: normWord(e.word),
    word: e.word,
    translation: e.translation,
    example: e.example ?? null,
    level: e.level ?? 1,
    next_review: e.nextReview ? e.nextReview : null,
    last_reviewed: e.lastReviewed ? e.lastReviewed : null,
    review_count: e.reviewCount ?? 0,
    added_at: e.addedAt ?? new Date().toISOString(),
  };
}

// ─── vocab (per-row) ───────────────────────────────────────────────────────────

const VOCAB_PAGE = 1000; // Supabase default max rows per request

export async function getVocab(userId: string): Promise<VocabEntry[]> {
  const all: VocabEntry[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await db()
      .from('vocab')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: true })
      .range(from, from + VOCAB_PAGE - 1);
    if (error) throw new Error(error.message);
    const page = data as VocabRow[];
    if (!page.length) break;
    all.push(...page.map(rowToEntry));
    if (page.length < VOCAB_PAGE) break;
    from += VOCAB_PAGE;
  }

  return all;
}

export async function upsertVocabWord(userId: string, entry: VocabEntry): Promise<void> {
  const row = entryToRow(userId, entry);
  const { error } = await db()
    .from('vocab')
    .upsert(row, { onConflict: 'user_id,norm_word' });
  if (error) throw new Error(error.message);
}

export async function deleteVocabWord(userId: string, id: string): Promise<void> {
  const { error } = await db().from('vocab').delete().eq('user_id', userId).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── stats (one row) ────────────────────────────────────────────────────────────

interface StatsRow {
  user_id: string;
  exercises_completed: number;
  correct_answers: number;
  total_answers: number;
  streak: number;
  last_activity: string | null;
  exercises_by_type: Record<string, number>;
  daily: Record<string, number> | null;
}

export async function getStats(userId: string): Promise<ProgressStats | null> {
  const { data, error } = await db()
    .from('stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as StatsRow;
  return {
    exercisesCompleted: r.exercises_completed,
    correctAnswers: r.correct_answers,
    totalAnswers: r.total_answers,
    streak: r.streak,
    lastActivity: r.last_activity ?? '',
    exercisesByType: r.exercises_by_type ?? {},
    daily: r.daily ?? {},
  };
}

export async function setStats(userId: string, s: ProgressStats): Promise<void> {
  const row: StatsRow = {
    user_id: userId,
    exercises_completed: s.exercisesCompleted,
    correct_answers: s.correctAnswers,
    total_answers: s.totalAnswers,
    streak: s.streak,
    last_activity: s.lastActivity || null,
    exercises_by_type: s.exercisesByType ?? {},
    daily: s.daily ?? {},
  };
  const { error } = await db().from('stats').upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// Flashcard actions per user on `date` (Berlin 'YYYY-MM-DD'), from the stats rows.
// Counts every flashcard, including repeated reviews of the same word.
export async function getDailyActionCounts(date: string): Promise<Record<string, number>> {
  const { data, error } = await db().from('stats').select('user_id, daily');
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data as { user_id: string; daily: Record<string, number> | null }[]) ?? []) {
    const n = row.daily?.[date] ?? 0;
    if (n > 0) counts[row.user_id] = n;
  }
  return counts;
}

// Every user's full per-day activity map (Berlin 'YYYY-MM-DD' -> count), for the
// race's cumulative "Progress over time" chart. Same metric as getDailyActionCounts.
export async function getAllDailyMaps(): Promise<Record<string, Record<string, number>>> {
  const { data, error } = await db().from('stats').select('user_id, daily');
  if (error) throw new Error(error.message);
  const out: Record<string, Record<string, number>> = {};
  for (const row of (data as { user_id: string; daily: Record<string, number> | null }[]) ?? []) {
    out[row.user_id] = row.daily ?? {};
  }
  return out;
}

// ─── conjugation (one jsonb row) ─────────────────────────────────────────────────

export async function getConjugation(userId: string): Promise<ConjugationRecord[]> {
  const { data, error } = await db()
    .from('conjugation')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.data as ConjugationRecord[]) ?? []);
}

export async function setConjugation(userId: string, records: ConjugationRecord[]): Promise<void> {
  const { error } = await db()
    .from('conjugation')
    .upsert({ user_id: userId, data: records }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// ─── sentences (SRS for translating example sentences, one jsonb row per user) ───

export async function getSentenceProgress(userId: string): Promise<SentenceProgress[]> {
  const { data, error } = await db()
    .from('sentences')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.data as SentenceProgress[]) ?? []);
}

export async function setSentenceProgress(userId: string, rows: SentenceProgress[]): Promise<void> {
  const { error } = await db()
    .from('sentences')
    .upsert({ user_id: userId, data: rows }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// ─── article (one jsonb row) ─────────────────────────────────────────────────────

export async function getArticle(userId: string): Promise<ArticleRecord[]> {
  const { data, error } = await db()
    .from('article')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.data as ArticleRecord[]) ?? []);
}

export async function setArticle(userId: string, records: ArticleRecord[]): Promise<void> {
  const { error } = await db()
    .from('article')
    .upsert({ user_id: userId, data: records }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// ─── article_topics (AI-generated topics, one jsonb row per user) ────────────────

export async function getArticleTopics(userId: string): Promise<ArticleTopic[]> {
  const { data, error } = await db()
    .from('article_topics')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data?.data as ArticleTopic[]) ?? []);
}

export async function setArticleTopics(userId: string, topics: ArticleTopic[]): Promise<void> {
  const { error } = await db()
    .from('article_topics')
    .upsert({ user_id: userId, data: topics }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// ─── race (one global jsonb row, id='global') ────────────────────────────────────

const RACE_ROW_ID = 'global';
// Note: `settledMonths` is intentionally left undefined here — the race route treats
// "undefined" as "first run on the monthly model" and seeds it (no retroactive stars).
const EMPTY_RACE: RaceState = { dailyCounts: {}, settledDates: [], highscores: [], stars: {} };

export async function getRaceState(): Promise<RaceState> {
  const { data, error } = await db()
    .from('race')
    .select('data')
    .eq('id', RACE_ROW_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const s = data?.data as Partial<RaceState> | undefined;
  if (!s) return { ...EMPTY_RACE };
  return {
    dailyCounts: s.dailyCounts ?? {},
    settledDates: s.settledDates ?? [],
    highscores: s.highscores ?? [],
    stars: s.stars ?? {},
    settledMonths: s.settledMonths, // pass through; undefined ⇒ migrate/seed
  };
}

export async function setRaceState(state: RaceState): Promise<void> {
  const { error } = await db()
    .from('race')
    .upsert({ id: RACE_ROW_ID, data: state }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}
