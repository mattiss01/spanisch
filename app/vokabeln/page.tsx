'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getVocab, processVocabSession, batchUpdateVocabStatus, addVocabEntry, getStats, recordExercise } from '@/lib/storage';
import { VocabEntry, ProgressStats } from '@/lib/types';
import { VOCAB_CATALOG } from '@/lib/vocab-catalog';
import { useProfile } from '@/lib/use-profile';
import StreakBanner from '@/components/StreakBanner';

const DAILY_GOAL = 20;

function isToday(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

type Tab = 'lernen' | 'wiederholen' | 'words';
type Phase = 'idle' | 'loading' | 'input' | 'results';
type Confidence = 'sicher' | 'unsicher' | 'bekannt';

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
  if (conf === 'bekannt') return 5;
  if (!correct) return Math.max(1, currentLevel - 1);
  if (conf === 'unsicher') return Math.max(1, currentLevel);
  return Math.min(5, currentLevel + 1);
}

function nextReviewDate(newLevel: number, correct: boolean, conf: Confidence): string {
  if (newLevel >= 5) return '';
  if (!correct) return new Date().toISOString();
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

// A translation may list several acceptable answers separated by "/",
// e.g. "leben / wohnen" or "el novio / la novia". Any one of them counts.
function splitVariants(s: string): string[] {
  return s.split('/').map(v => v.trim()).filter(Boolean);
}

function checkAnswer(user: string, correct: string): { correct: boolean; accentHint?: string } {
  const u = norm(user);
  if (u.length === 0) return { correct: false };

  const variants = splitVariants(correct);

  // Exact / prefix match against any variant
  for (const variant of variants) {
    const c = norm(variant);
    if (c.length === 0) continue;
    if (u === c || c.startsWith(u) || u.startsWith(c)) return { correct: true };
  }

  // Accent-insensitive match against any variant
  const su = stripAccents(u);
  for (const variant of variants) {
    const sc = stripAccents(norm(variant));
    if (sc.length === 0) continue;
    if (su === sc || sc.startsWith(su) || su.startsWith(sc)) {
      return { correct: true, accentHint: variant };
    }
  }

  return { correct: false };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VokabelnPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('lernen');
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<SessionItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [hints, setHints] = useState<(string | undefined)[]>([]);
  const [confidence, setConfidence] = useState<Confidence[]>([]);
  const [wordSearch, setWordSearch] = useState('');
  const [stats, setStats] = useState<ProgressStats | null>(null);

  // Add-your-own-word form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addNative, setAddNative] = useState('');
  const [addTarget, setAddTarget] = useState('');
  const [addExample, setAddExample] = useState('');
  const [addError, setAddError] = useState('');
  const [learnCount, setLearnCount] = useState(20);
  const [reviewCount, setReviewCount] = useState(20);

  useEffect(() => {
    if (ready && !profile) router.push('/profile');
  }, [ready, profile, router]);

  const refresh = useCallback(async () => {
    const [v, s] = await Promise.all([getVocab(), getStats()]);
    setVocab(v);
    setStats(s);
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

  const bekanntWords = vocab.filter(v => getLevel(v) === 5);
  const dueToday = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && isDue(v.nextReview); });
  const upcoming = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && !isDue(v.nextReview); });

  const seenWords = new Set(vocab.map(v => norm(v.word)));
  const unseenCount = VOCAB_CATALOG.filter(e => !seenWords.has(norm(e.es))).length;

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
    setAnswers([]);
    setResults([]);
    setHints([]);
    setConfidence([]);
  }

  function switchTab(t: Tab) {
    setTab(t);
    reset();
  }

  function startLernen() {
    const unseen = VOCAB_CATALOG.filter(e => !seenWords.has(norm(e.es)));
    const source = unseen.length > 0 ? unseen.slice(0, learnCount) : shuffle(VOCAB_CATALOG).slice(0, learnCount);
    const sessionItems = source.map(e => makeItem(e.de, e.es, ''));
    setItems(sessionItems);
    setAnswers(sessionItems.map(() => ''));
    setResults([]);
    setHints([]);
    setConfidence([]);
    setPhase('input');
  }

  function startWiederholen() {
    const wItems = dueToday.slice(0, reviewCount).map(v =>
      makeItem(v.translation, v.word, v.example ?? '', v.id, getLevel(v))
    );
    setItems(wItems);
    setAnswers(wItems.map(() => ''));
    setResults([]);
    setHints([]);
    setPhase('input');
  }

  function submit() {
    const checked = items.map((item, i) => checkAnswer(answers[i], item.answer));
    setResults(checked.map(c => c.correct));
    setHints(checked.map(c => c.accentHint));
    setConfidence(checked.map(c => (c.correct ? 'sicher' : 'sicher')));
    setPhase('results');
  }

  async function saveResults(conf: Confidence[]) {
    if (tab === 'lernen') {
      await processVocabSession(
        items.map((item, i) => {
          const newLevel = computeNewLevel(item.currentLevel, results[i], conf[i]);
          return {
            word: item.es,
            translation: item.de,
            example: item.example,
            level: newLevel,
            nextReview: nextReviewDate(newLevel, results[i], conf[i]),
          };
        })
      );
    } else {
      await batchUpdateVocabStatus(
        items
          .filter(item => item.vocabId)
          .map((item, i) => {
            const newLevel = computeNewLevel(item.currentLevel, results[i], conf[i]);
            return {
              id: item.vocabId!,
              level: newLevel,
              nextReview: nextReviewDate(newLevel, results[i], conf[i]),
            };
          })
      );
    }
    // Record the session so the daily streak advances (vocab activity counts too).
    await recordExercise('vocabulary', results.filter(Boolean).length, items.length);
    await refresh();
  }

  async function handleAddWord() {
    setAddError('');
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
    await addVocabEntry({
      word: spanish,
      translation: german,
      example: addExample.trim() || undefined,
      level: 1,
      nextReview: new Date().toISOString(),
    });
    setAddNative('');
    setAddTarget('');
    setAddExample('');
    setShowAddForm(false);
    await refresh();
  }

  const correctCount = results.filter(Boolean).length;
  const wordsFiltered = vocab.filter(
    v =>
      !wordSearch ||
      v.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
      v.translation.toLowerCase().includes(wordSearch.toLowerCase())
  );

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
            {phase === 'idle' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    New words from the catalog.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {unseenCount > 0
                      ? `${unseenCount} of ${VOCAB_CATALOG.length} words not seen yet`
                      : `All ${VOCAB_CATALOG.length} catalog words already seen`}
                  </p>
                  {VOCAB_CATALOG.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.round((vocab.length / VOCAB_CATALOG.length) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <CountPicker
                  label="How many words?"
                  value={learnCount}
                  onChange={setLearnCount}
                  max={unseenCount > 0 ? unseenCount : VOCAB_CATALOG.length}
                />
                <button
                  onClick={startLernen}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Start round →
                </button>
              </div>
            )}

            {phase === 'idle' && addWordSection}

            {(phase === 'input' || phase === 'results') && (
              <SessionPanel
                items={items}
                answers={answers}
                results={results}
                hints={hints}
                confidence={confidence}
                phase={phase}
                correctCount={correctCount}
                answerPlaceholder={answerLang}
                onAnswerChange={(i, v) =>
                  setAnswers(prev => { const n = [...prev]; n[i] = v; return n; })
                }
                onConfidenceChange={(i, v) =>
                  setConfidence(prev => { const n = [...prev]; n[i] = v; return n; })
                }
                onSubmit={submit}
                onSave={saveResults}
                onReset={reset}
              />
            )}
          </div>
        )}

        {/* ===== REVIEW ===== */}
        {tab === 'wiederholen' && (
          <div className="space-y-4">
            {phase === 'idle' &&
              (dueToday.length === 0 ? (
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
                    You have <strong>{dueToday.length}</strong> words due today.
                  </p>
                  <CountPicker
                    label="How many to review?"
                    value={reviewCount}
                    onChange={setReviewCount}
                    max={dueToday.length}
                  />
                  <button
                    onClick={startWiederholen}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Start review →
                  </button>
                </div>
              ))}

            {(phase === 'input' || phase === 'results') && (
              <SessionPanel
                items={items}
                answers={answers}
                results={results}
                hints={hints}
                confidence={confidence}
                phase={phase}
                correctCount={correctCount}
                answerPlaceholder={answerLang}
                onAnswerChange={(i, v) =>
                  setAnswers(prev => { const n = [...prev]; n[i] = v; return n; })
                }
                onConfidenceChange={(i, v) =>
                  setConfidence(prev => { const n = [...prev]; n[i] = v; return n; })
                }
                onSubmit={submit}
                onSave={saveResults}
                onReset={reset}
              />
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
                <p className="text-xs text-gray-400">{wordsFiltered.length} words seen</p>
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
                            <p className="text-gray-400 text-xs mt-0.5 italic">"{entry.example}"</p>
                          )}
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

// ─── SessionPanel ────────────────────────────────────────────────────────────

interface SessionPanelProps {
  items: SessionItem[];
  answers: string[];
  results: boolean[];
  hints: (string | undefined)[];
  confidence: Confidence[];
  phase: Phase;
  correctCount: number;
  answerPlaceholder: string;
  onAnswerChange: (index: number, value: string) => void;
  onConfidenceChange: (index: number, value: Confidence) => void;
  onSubmit: () => void;
  onSave: (confidence: Confidence[]) => Promise<void>;
  onReset: () => void;
}

function SessionPanel({
  items,
  answers,
  results,
  hints,
  confidence,
  phase,
  correctCount,
  answerPlaceholder,
  onAnswerChange,
  onConfidenceChange,
  onSubmit,
  onSave,
  onReset,
}: SessionPanelProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const bekanntOverrideCount = confidence.filter((c, i) => results[i] && c === 'bekannt').length;
  const unsicherCount = confidence.filter((c, i) => results[i] && c === 'unsicher').length;
  const toRepeat = results.filter(r => !r).length + unsicherCount;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="space-y-4">
      {phase === 'results' && (
        <div
          className={`p-4 rounded-xl font-semibold ${
            correctCount === items.length
              ? 'bg-green-100 text-green-800'
              : correctCount >= Math.ceil(items.length * 0.7)
              ? 'bg-amber-50 text-amber-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          <p className="text-center text-lg">
            {correctCount}/{items.length} correct
            {correctCount === items.length && ' 🎉'}
          </p>
          <p className="text-center text-xs font-normal mt-1 opacity-70">
            {toRepeat} to review · {toKeep(results, confidence)} level up
            {bekanntOverrideCount > 0 && ` · ${bekanntOverrideCount} directly known`}
          </p>
          <p className="text-center text-xs font-normal mt-2 opacity-60">
            Correct answers: <strong>Unsure</strong> to review again, <strong>Known</strong> to hide immediately
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items.map((item, i) => {
          const ok = results[i] === true;
          const wrong = phase === 'results' && results[i] === false;
          const conf = confidence[i];
          const hint = hints[i];
          return (
            <div
              key={i}
              className={`flex flex-col gap-1 px-3 py-2.5 border-b border-gray-50 last:border-b-0 ${
                phase === 'results'
                  ? conf === 'bekannt' && ok
                    ? 'bg-green-100'
                    : ok && conf === 'unsicher'
                    ? 'bg-amber-50'
                    : ok
                    ? 'bg-green-50'
                    : wrong
                    ? 'bg-red-50'
                    : ''
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 shrink-0 tabular-nums">{i + 1}.</span>
                <span className="text-xs font-medium text-gray-700 w-28 shrink-0 leading-tight">
                  {item.question}
                </span>
                <input
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  value={answers[i]}
                  disabled={phase === 'results'}
                  onChange={e => onAnswerChange(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (i < items.length - 1) inputRefs.current[i + 1]?.focus();
                      else onSubmit();
                    }
                  }}
                  placeholder={answerPlaceholder}
                  className={`flex-1 min-w-0 border-b bg-transparent text-sm py-0.5 outline-none transition-colors disabled:opacity-100 ${
                    phase === 'results' && ok && conf === 'bekannt'
                      ? 'border-green-500 text-green-800'
                      : phase === 'results' && ok && conf === 'unsicher'
                      ? 'border-amber-400 text-amber-700'
                      : ok
                      ? 'border-green-400 text-green-700'
                      : wrong
                      ? 'border-red-400 text-red-600'
                      : 'border-gray-300 focus:border-red-600 text-gray-900'
                  }`}
                />

                {wrong && (
                  <span className="text-xs text-green-700 font-semibold shrink-0">{item.answer}</span>
                )}

                {phase === 'results' && ok && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => onConfidenceChange(i, 'unsicher')}
                      className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                        conf === 'unsicher'
                          ? 'bg-amber-400 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700'
                      }`}
                    >
                      Unsure
                    </button>
                    <button
                      onClick={() => onConfidenceChange(i, 'sicher')}
                      className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                        conf === 'sicher'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      Sure
                    </button>
                    <button
                      onClick={() => onConfidenceChange(i, 'bekannt')}
                      className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                        conf === 'bekannt'
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-800'
                      }`}
                    >
                      Known ✓
                    </button>
                  </div>
                )}

                {wrong && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                    ↩
                  </span>
                )}
              </div>

              {phase === 'results' && ok && hint && (
                <p className="text-xs text-blue-600 pl-[calc(1rem+7rem+0.5rem)] pb-0.5">
                  Tip: with accent → <span className="font-semibold">{hint}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'input' ? (
        <button
          onClick={onSubmit}
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
        >
          Check
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Save & Done
          </button>
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            New round →
          </button>
        </div>
      )}
    </div>
  );
}

function toKeep(results: boolean[], confidence: Confidence[]): number {
  return results.filter((r, i) => r && confidence[i] === 'sicher').length;
}

// ─── CountPicker ───────────────────────────────────────────────────────────────

function CountPicker({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  if (max <= 0) return null;
  const presets = [5, 10, 20, 30].filter(n => n < max);
  const options = [...presets, max]; // last option = "All"
  const effective = Math.min(value, max);

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((n, i) => {
          const isAll = i === options.length - 1;
          const active = effective === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-red-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isAll ? `All (${max})` : n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
