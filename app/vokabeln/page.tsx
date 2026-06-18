'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadVocabStrict, upsertVocabWord, getStats, recordExercise } from '@/lib/storage';
import { VocabEntry, ProgressStats } from '@/lib/types';
import { VOCAB_CATALOG } from '@/lib/vocab-catalog';
import { STARTER_VOCAB } from '@/lib/vocab-starter';
import { useProfile } from '@/lib/use-profile';
import { isBeginner } from '@/lib/profiles';
import StreakBanner from '@/components/StreakBanner';

const DAILY_GOAL = 20;

function isToday(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

type Tab = 'lernen' | 'wiederholen' | 'words';
type Phase = 'idle' | 'active' | 'done';
type Confidence = 'sicher' | 'unsicher' | 'bekannt';
type WordSort = 'alpha' | 'phase' | 'review';

interface SessionItem {
  de: string;
  es: string;
  example: string;
  vocabId?: string;
  currentLevel: number;
  question: string;
  answer: string;
}

// ─── Interval/level helpers ──────────────────────────────────────────────────

const LEVEL_INTERVALS = [0, 1, 3, 7, 14];

function getLevel(v: VocabEntry): number {
  if (v.level !== undefined) return v.level;
  return v.status === 'bekannt' ? 5 : 1;
}

function isDue(nextReview?: string): boolean {
  if (!nextReview) return true;
  return new Date(nextReview) <= new Date();
}

function computeNewLevel(currentLevel: number, correct: boolean, conf: Confidence): number {
  if (!correct) return Math.max(1, currentLevel - 1); // wrong: drop a phase
  if (conf === 'bekannt') return 5;                          // Easy: mark known
  if (conf === 'unsicher') return Math.max(1, currentLevel); // Hard: stay in phase
  return Math.min(5, currentLevel + 1);                      // Good: +1 phase
}

function nextReviewDate(newLevel: number, correct: boolean, conf: Confidence): string {
  if (newLevel >= 5) return '';
  // "Again" (didn't know it): due now → shows in Review today.
  if (!correct) return new Date().toISOString();
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

// ─── Answer checking ─────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// German keyboard substitutes: ä→ae, ö→oe, ü→ue, ß→ss (and accept the reverse).
function germanFold(s: string): string {
  return s
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

// A translation may list several acceptable answers separated by "/",
// e.g. "leben / wohnen" or "el novio / la novia". Any one of them counts.
function splitVariants(s: string): string[] {
  return s.split('/').map(v => v.trim()).filter(Boolean);
}

function checkAnswer(user: string, correct: string): { correct: boolean; accentHint?: string } {
  const u = norm(user);
  if (u.length === 0) return { correct: false };

  const variants = splitVariants(correct);

  // Exact match against any variant (articles/parentheticals already stripped by norm)
  for (const variant of variants) {
    const c = norm(variant);
    if (c.length === 0) continue;
    if (u === c) return { correct: true };
  }

  // Tolerant exact match: accent-stripped (ä→a) or German-folded (ä→ae, ß→ss)
  const su = stripAccents(u);
  const fu = germanFold(u);
  for (const variant of variants) {
    const c = norm(variant);
    if (c.length === 0) continue;
    if (stripAccents(c) === su || germanFold(c) === fu) {
      return { correct: true, accentHint: variant };
    }
  }

  return { correct: false };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VokabelnPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('lernen');
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [wordSearch, setWordSearch] = useState('');
  const [wordSort, setWordSort] = useState<WordSort>('alpha');
  const [wordSortDir, setWordSortDir] = useState<'asc' | 'desc'>('asc');

  // Flashcard session state (one word at a time)
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<SessionItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  // Serializes per-word saves so concurrent writes don't clobber each other.
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const [saveError, setSaveError] = useState(false);
  const [vocabLoaded, setVocabLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Add-your-own-word form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addNative, setAddNative] = useState('');
  const [addTarget, setAddTarget] = useState('');
  const [addExample, setAddExample] = useState('');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (ready && !profile) router.push('/profile');
  }, [ready, profile, router]);

  const refresh = useCallback(async () => {
    try {
      const v = await loadVocabStrict();
      setVocab(v);
      setVocabLoaded(true);
      setLoadError(false);
    } catch {
      // Do NOT blank vocab on a failed load — keep whatever we have and flag it,
      // so a later write can't overwrite real data with an empty list.
      setLoadError(true);
    }
    setStats(await getStats());
  }, []);
  // Stats-only reconcile — used after a session so we never overwrite the
  // optimistic vocab state (which already matches what we wrote to the server).
  const refreshStats = useCallback(async () => {
    setStats(await getStats());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  if (!ready || !profile) {
    return (
      <main className="md:ml-56 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  const direction = profile.direction;
  const answerLang = direction === 'es_to_de' ? 'German…' : 'Spanish…';

  // Beginners (A1) learn from an ordered starter set first, then flow into the full
  // catalog (deduped) so they never run out. Everyone else uses the full catalog.
  const starterEs = new Set(STARTER_VOCAB.map(w => norm(w.es)));
  const sourceCatalog = isBeginner(profile)
    ? [...STARTER_VOCAB, ...VOCAB_CATALOG.filter(w => !starterEs.has(norm(w.es)))]
    : VOCAB_CATALOG;

  const bekanntWords = vocab.filter(v => getLevel(v) === 5);
  const dueToday = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && isDue(v.nextReview); });
  const upcoming = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && !isDue(v.nextReview); });

  const seenWords = new Set(vocab.map(v => norm(v.word)));
  const unseenCount = sourceCatalog.filter(e => !seenWords.has(norm(e.es))).length;

  const todayCount = vocab.filter(v => isToday(v.lastReviewed)).length;
  // If there's activity today, the streak is at least 1 even if stats lag behind.
  const displayStreak = Math.max(stats?.streak ?? 0, todayCount > 0 ? 1 : 0);

  function makeItem(de: string, es: string, example: string, vocabId?: string, currentLevel = 0): SessionItem {
    return {
      de, es, example, vocabId, currentLevel,
      question: direction === 'es_to_de' ? es : de,
      answer:   direction === 'es_to_de' ? de : es,
    };
  }

  function reset() {
    setPhase('idle');
    setItems([]);
    setCurrent(0);
    setDoneCount(0);
    setSessionCorrect(0);
  }

  function switchTab(t: Tab) {
    setTab(t);
    reset();
    // Opening the Words list: let pending saves land, then reload so entries
    // carry their real server ids (needed for manual phase edits).
    if (t === 'words') {
      saveChain.current = saveChain.current.then(() => refresh()).catch(() => {});
    }
  }

  // Update local state and persist only the one changed/added word (per-row upsert).
  // A single word in flight can never clobber the rest of the list.
  function persistVocab(next: VocabEntry[], changed: VocabEntry) {
    setVocab(next);
    saveChain.current = saveChain.current
      .then(() => upsertVocabWord(changed))
      .catch(() => setSaveError(true));
  }

  // Manually move a word to a different phase from the Words list.
  function setWordLevel(entry: VocabEntry, newLevel: number) {
    if (!vocabLoaded) { setSaveError(true); return; }
    const clamped = Math.max(1, Math.min(5, newLevel));
    if (clamped === getLevel(entry)) return;
    let nr = '';
    if (clamped < 5) {
      const d = new Date();
      d.setDate(d.getDate() + (LEVEL_INTERVALS[clamped] ?? 14));
      nr = d.toISOString();
    }
    const changed = { ...entry, level: clamped, nextReview: nr };
    persistVocab(vocab.map(v => (v.id === entry.id ? changed : v)), changed);
  }

  function startLernen() {
    if (!vocabLoaded) return;
    const unseen = sourceCatalog.filter(e => !seenWords.has(norm(e.es)));
    if (unseen.length === 0) return;
    // New words start at phase 1, so Hard keeps them at phase 1 and Good promotes to phase 2.
    setItems(unseen.map(e => makeItem(e.de, e.es, '', undefined, 1)));
    setCurrent(0);
    setDoneCount(0);
    setSessionCorrect(0);
    setPhase('active');
  }

  function startWiederholen() {
    if (!vocabLoaded || dueToday.length === 0) return;
    setItems(dueToday.map(v => makeItem(v.translation, v.word, v.example ?? '', v.id, getLevel(v))));
    setCurrent(0);
    setDoneCount(0);
    setSessionCorrect(0);
    setPhase('active');
  }

  // After all queued saves land, reconcile only the streak from the server.
  function drainAndRefresh() {
    saveChain.current = saveChain.current.then(() => refreshStats()).catch(() => {});
  }

  // Rate one word: update the UI instantly, advance immediately, and write the
  // full updated list (queued so saves run in order).
  function handleRate(correct: boolean, conf: Confidence) {
    if (!vocabLoaded) { setSaveError(true); return; }
    const item = items[current];
    const isLearn = tab === 'lernen';
    const newLevel = computeNewLevel(item.currentLevel, correct, conf);
    const nr = nextReviewDate(newLevel, correct, conf);
    const now = new Date().toISOString();
    const isLast = current + 1 >= items.length;

    // compute the changed/added word and the new full list (for local display)
    let changed: VocabEntry;
    let next: VocabEntry[];
    if (isLearn) {
      const key = norm(item.es);
      const idx = vocab.findIndex(v => norm(v.word) === key);
      if (idx >= 0) {
        changed = { ...vocab[idx], level: newLevel, nextReview: nr, lastReviewed: now, reviewCount: vocab[idx].reviewCount + 1 };
        next = vocab.map((v, i) => (i === idx ? changed : v));
      } else {
        changed = {
          id: crypto.randomUUID(),
          word: item.es,
          translation: item.de,
          example: item.example || undefined,
          level: newLevel,
          nextReview: nr,
          lastReviewed: now,
          addedAt: now,
          reviewCount: 1,
        };
        next = [changed, ...vocab];
      }
    } else {
      const idx = vocab.findIndex(v => v.id === item.vocabId);
      changed = { ...vocab[idx], level: newLevel, nextReview: nr, lastReviewed: now, reviewCount: vocab[idx].reviewCount + 1 };
      next = vocab.map(v => (v.id === item.vocabId ? changed : v));
    }

    persistVocab(next, changed);
    setStats(prev => (prev ? { ...prev, lastActivity: now } : prev));
    setDoneCount(d => d + 1);
    if (correct) setSessionCorrect(c => c + 1);

    if (isLast) setPhase('done');
    else setCurrent(c => c + 1);

    saveChain.current = saveChain.current
      .then(() => recordExercise('vocabulary', correct ? 1 : 0, 1))
      .catch(() => {});

    if (isLast) drainAndRefresh();
  }

  function handleAddWord() {
    setAddError('');
    if (!vocabLoaded) { setAddError('Still loading your words — try again in a moment.'); return; }
    const spanish = (direction === 'es_to_de' ? addNative : addTarget).trim();
    const german = (direction === 'es_to_de' ? addTarget : addNative).trim();
    if (!spanish || !german) {
      setAddError('Please fill in both words.');
      return;
    }
    if (seenWords.has(norm(spanish))) {
      setAddError('That word is already in your list.');
      return;
    }
    const now = new Date().toISOString();
    const entry: VocabEntry = {
      id: crypto.randomUUID(),
      word: spanish,
      translation: german,
      example: addExample.trim() || undefined,
      level: 1,
      nextReview: now,
      addedAt: now,
      reviewCount: 0,
    };
    persistVocab([entry, ...vocab], entry);
    setAddNative('');
    setAddTarget('');
    setAddExample('');
    setShowAddForm(false);
  }

  const wordsFiltered = vocab
    .filter(
      v =>
        !wordSearch ||
        v.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
        v.translation.toLowerCase().includes(wordSearch.toLowerCase())
    )
    .sort((a, b) => {
      let cmp: number;
      if (wordSort === 'phase') {
        cmp = getLevel(a) - getLevel(b);
      } else if (wordSort === 'review') {
        const ra = a.nextReview ? new Date(a.nextReview).getTime() : Infinity;
        const rb = b.nextReview ? new Date(b.nextReview).getTime() : Infinity;
        cmp = ra - rb;
      } else {
        // alphabetical by the language being learned
        const la = (direction === 'es_to_de' ? a.translation : a.word).toLowerCase();
        const lb = (direction === 'es_to_de' ? b.translation : b.word).toLowerCase();
        cmp = la.localeCompare(lb);
      }
      return wordSortDir === 'asc' ? cmp : -cmp;
    });

  const addWordSection = (
    !showAddForm ? (
      <button
        onClick={() => { setShowAddForm(true); setAddError(''); }}
        className="w-full py-2.5 border border-dashed border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600 rounded-xl text-sm font-medium transition-colors"
      >
        ＋ Add a word
      </button>
    ) : (
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <input
          type="text"
          value={addNative}
          onChange={e => setAddNative(e.target.value)}
          placeholder={direction === 'es_to_de' ? 'Spanish word' : 'German word'}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
        />
        <input
          type="text"
          value={addTarget}
          onChange={e => setAddTarget(e.target.value)}
          placeholder={direction === 'es_to_de' ? 'German translation' : 'Spanish translation'}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
        />
        <input
          type="text"
          value={addExample}
          onChange={e => setAddExample(e.target.value)}
          placeholder="Example sentence (optional)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
        />
        {addError && <p className="text-xs text-red-600">{addError}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleAddWord}
            className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Add word
          </button>
          <button
            onClick={() => { setShowAddForm(false); setAddError(''); }}
            className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  );

  // Shared session view (active flashcard or completion summary) for both tabs.
  const sessionView =
    phase === 'active' && items[current] ? (
      <Flashcard
        key={current}
        item={items[current]}
        answerPlaceholder={answerLang}
        position={current + 1}
        total={items.length}
        onRate={handleRate}
        onFinish={() => { setPhase('done'); drainAndRefresh(); }}
      />
    ) : phase === 'done' ? (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
        <p className="text-4xl">🎉</p>
        <p className="font-semibold text-gray-900">Session complete</p>
        <p className="text-sm text-gray-500">
          {sessionCorrect} / {doneCount} correct
        </p>
        <div className="flex gap-2 justify-center pt-1">
          <button
            onClick={reset}
            className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Done
          </button>
          {tab === 'lernen' && unseenCount > 0 && (
            <button
              onClick={startLernen}
              className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Keep learning →
            </button>
          )}
          {tab === 'wiederholen' && dueToday.length > 0 && (
            <button
              onClick={startWiederholen}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Keep reviewing →
            </button>
          )}
        </div>
      </div>
    ) : null;

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {bekanntWords.length} known · {dueToday.length} due today
            {upcoming.length > 0 && ` · ${upcoming.length} coming up`}
          </p>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>⚠ Couldn&apos;t load your words. Learning is paused so nothing gets overwritten.</span>
            <button
              onClick={() => { refresh(); }}
              className="shrink-0 text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>⚠ Some changes couldn&apos;t be saved. Check your connection.</span>
            <button
              onClick={() => { setSaveError(false); refresh(); }}
              className="shrink-0 text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <StreakBanner streak={displayStreak} todayCount={todayCount} goal={DAILY_GOAL} />

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{bekanntWords.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Known</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-amber-500">{dueToday.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Due today</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-blue-500">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Coming up</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(
            [
              ['lernen', 'Learn'],
              ['wiederholen', dueToday.length > 0 ? `Review (${dueToday.length})` : 'Review'],
              ['words', vocab.length > 0 ? `Words (${vocab.length})` : 'Words'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== LEARN ===== */}
        {tab === 'lernen' && (
          <div className="space-y-4">
            {phase === 'idle' ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Learn new words one at a time.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {unseenCount > 0
                        ? `${unseenCount} of ${sourceCatalog.length} words not seen yet`
                        : `All ${sourceCatalog.length} catalog words already seen 🎉`}
                    </p>
                    {sourceCatalog.length > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.round((vocab.length / sourceCatalog.length) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={startLernen}
                    disabled={unseenCount === 0 || !vocabLoaded}
                    className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors"
                  >
                    {!vocabLoaded ? 'Loading…' : unseenCount > 0 ? 'Start learning →' : 'All words learned'}
                  </button>
                </div>
                {addWordSection}
              </>
            ) : (
              sessionView
            )}
          </div>
        )}

        {/* ===== REVIEW ===== */}
        {tab === 'wiederholen' && (
          <div className="space-y-4">
            {phase === 'idle' ? (
              dueToday.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-sm font-medium text-gray-500">No words due today!</p>
                  {upcoming.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {upcoming.length} words coming up soon.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <p className="text-sm text-gray-600">
                    <strong>{dueToday.length}</strong> words due today. Review them one at a time.
                  </p>
                  <button
                    onClick={startWiederholen}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Start review →
                  </button>
                </div>
              )
            ) : (
              sessionView
            )}
          </div>
        )}

        {/* ===== WORDS ===== */}
        {tab === 'words' && (
          <div className="space-y-3">
            {addWordSection}

            {vocab.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-sm text-gray-400">
                  No words seen yet. Start a learning round!
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={wordSearch}
                  onChange={e => setWordSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 shrink-0">{wordsFiltered.length} words</p>
                  <div className="flex gap-1">
                    {([
                      ['alpha', 'A–Z'],
                      ['phase', 'Phase'],
                      ['review', 'Next review'],
                    ] as [WordSort, string][]).map(([id, label]) => {
                      const active = wordSort === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            if (active) setWordSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                            else { setWordSort(id); setWordSortDir('asc'); }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-red-700 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {label}{active ? (wordSortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  {wordsFiltered.map(entry => {
                    const level = getLevel(entry);
                    const levelLabels = ['', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Known'];
                    const levelColors = [
                      '',
                      'bg-red-100 text-red-700',
                      'bg-orange-100 text-orange-700',
                      'bg-amber-100 text-amber-700',
                      'bg-blue-100 text-blue-700',
                      'bg-green-100 text-green-700',
                    ];
                    const reviewDate = entry.nextReview
                      ? new Date(entry.nextReview).toLocaleDateString()
                      : null;
                    return (
                      <div
                        key={entry.id}
                        className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-start gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">
                              {direction === 'es_to_de' ? entry.word : entry.translation}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${levelColors[level]}`}>
                              {levelLabels[level]}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">
                            {direction === 'es_to_de' ? entry.translation : entry.word}
                          </p>
                          {level < 5 && reviewDate && (
                            <p className="text-gray-400 text-xs mt-0.5">
                              Next review: {reviewDate}
                            </p>
                          )}
                          {entry.example && (
                            <p className="text-gray-400 text-xs mt-0.5 italic">&bdquo;{entry.example}&ldquo;</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => setWordLevel(entry, level + 1)}
                            disabled={level >= 5}
                            title="Move up a phase"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-colors"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => setWordLevel(entry, level - 1)}
                            disabled={level <= 1}
                            title="Move down a phase"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-colors"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Flashcard (one word at a time) ────────────────────────────────────────────

function Flashcard({
  item,
  answerPlaceholder,
  position,
  total,
  onRate,
  onFinish,
}: {
  item: SessionItem;
  answerPlaceholder: string;
  position: number;
  total: number;
  onRate: (correct: boolean, conf: Confidence) => void | Promise<void>;
  onFinish: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retype, setRetype] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const retypeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const evaluation = checked ? checkAnswer(answer, item.answer) : null;
  const correct = evaluation?.correct ?? false;

  // On a wrong answer, the learner must type the correct word once before rating.
  const retypeOk = checkAnswer(retype, item.answer).correct;

  useEffect(() => {
    if (checked && !correct) retypeRef.current?.focus();
  }, [checked, correct]);

  async function rate(asCorrect: boolean, conf: Confidence) {
    if (saving) return;
    setSaving(true);
    await onRate(asCorrect, conf);
    // component is remounted (key changes) on advance; no local reset needed
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="tabular-nums">{position} / {total}</span>
        <button onClick={onFinish} className="hover:text-gray-600 transition-colors">
          Finish
        </button>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-600 rounded-full transition-all"
          style={{ width: `${Math.round((position / total) * 100)}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center py-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Translate</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{item.question}</p>
      </div>

      {!checked ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setChecked(true); }}
            placeholder={answerPlaceholder}
            className="w-full border-b-2 border-gray-300 focus:border-red-600 bg-transparent text-lg text-center py-1.5 outline-none transition-colors"
          />
          <button
            onClick={() => setChecked(true)}
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
          >
            Check
          </button>
        </>
      ) : (
        <>
          {/* Result */}
          <div
            className={`rounded-xl p-4 text-center ${
              correct ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p className={`text-lg font-bold ${correct ? 'text-green-700' : 'text-red-600'}`}>
              {correct ? '✓ Correct' : '✗ Not quite'}
            </p>
            {!correct && (
              <p className="text-sm text-gray-600 mt-1">
                Your answer: <span className="line-through">{answer || '—'}</span>
              </p>
            )}
            <p className="text-base font-semibold text-gray-900 mt-1">{item.answer}</p>
            {evaluation?.accentHint && correct && (
              <p className="text-xs text-blue-600 mt-1">
                Tip: with accent → <span className="font-semibold">{evaluation.accentHint}</span>
              </p>
            )}
          </div>

          {/* Rating */}
          {correct ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => rate(true, 'unsicher')}
                disabled={saving}
                className="py-2.5 rounded-xl text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition-colors"
              >
                Hard
                <span className="block text-[10px] font-normal opacity-70">stay · tomorrow</span>
              </button>
              <button
                onClick={() => rate(true, 'sicher')}
                disabled={saving}
                className="py-2.5 rounded-xl text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
              >
                Good
                <span className="block text-[10px] font-normal opacity-70">level up</span>
              </button>
              <button
                onClick={() => rate(true, 'bekannt')}
                disabled={saving}
                className="py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                Easy
                <span className="block text-[10px] font-normal opacity-80">mark known</span>
              </button>
            </div>
          ) : (
            <>
              {/* Write-it-again reinforcement */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Write it again to remember:
                </label>
                <input
                  ref={retypeRef}
                  type="text"
                  value={retype}
                  onChange={e => setRetype(e.target.value)}
                  placeholder={item.answer}
                  className={`w-full border-b-2 bg-transparent text-lg text-center py-1.5 outline-none transition-colors ${
                    retypeOk ? 'border-green-500 text-green-700' : 'border-gray-300 focus:border-red-600'
                  }`}
                />
                <p className="text-[11px] text-gray-400 text-center mt-1">
                  {retypeOk ? '✓ Now choose below' : 'Type the correct word to continue'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => rate(false, 'sicher')}
                  disabled={saving || !retypeOk}
                  className="py-2.5 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 transition-colors"
                >
                  Again
                  <span className="block text-[10px] font-normal opacity-70">review today</span>
                </button>
                <button
                  onClick={() => rate(true, 'unsicher')}
                  disabled={saving || !retypeOk}
                  className="py-2.5 rounded-xl text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40 transition-colors"
                >
                  Keep phase
                  <span className="block text-[10px] font-normal opacity-70">typo / misclick</span>
                </button>
                <button
                  onClick={() => rate(true, 'bekannt')}
                  disabled={saving || !retypeOk}
                  className="py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 transition-colors"
                >
                  Known
                  <span className="block text-[10px] font-normal opacity-80">mark known</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Was it a typo? Keep the phase or mark it known instead of going back.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
