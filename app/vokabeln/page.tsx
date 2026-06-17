'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getVocab, updateVocabStatus, processVocabSession, batchUpdateVocabStatus } from '@/lib/storage';
import { VocabEntry } from '@/lib/types';
import { VOCAB_CATALOG } from '@/lib/vocab-catalog';

type Tab = 'lernen' | 'wiederholen' | 'bekannt';
type Phase = 'idle' | 'loading' | 'input' | 'results';
type Confidence = 'sicher' | 'unsicher' | 'bekannt';

interface SessionItem {
  de: string;
  es: string;
  example: string;
  vocabId?: string;
  currentLevel: number;
}

// ─── Interval/level helpers ──────────────────────────────────────────────────

const LEVEL_INTERVALS = [0, 1, 3, 7, 14]; // days for levels 0–4

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
  if (!correct) return new Date().toISOString(); // failed → show again immediately
  if (conf === 'unsicher') {
    // Not confident → review again tomorrow
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
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function checkAnswer(user: string, correct: string): { correct: boolean; accentHint?: string } {
  const u = norm(user);
  const c = norm(correct);
  if (u.length === 0) return { correct: false };
  if (u === c || c.startsWith(u) || u.startsWith(c)) return { correct: true };
  const su = stripAccents(u);
  const sc = stripAccents(c);
  if (su === sc || sc.startsWith(su) || su.startsWith(sc)) {
    return { correct: true, accentHint: correct };
  }
  return { correct: false };
}

// ─── Misc ────────────────────────────────────────────────────────────────────

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
  const [tab, setTab] = useState<Tab>('lernen');
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<SessionItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [hints, setHints] = useState<(string | undefined)[]>([]);
  const [confidence, setConfidence] = useState<Confidence[]>([]);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => setVocab(await getVocab()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const bekanntWords = vocab.filter(v => getLevel(v) === 5);
  const dueToday = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && isDue(v.nextReview); });
  const upcoming = vocab.filter(v => { const l = getLevel(v); return l > 0 && l < 5 && !isDue(v.nextReview); });

  const seenWords = new Set(vocab.map(v => norm(v.word)));
  const unseenCount = VOCAB_CATALOG.filter(e => !seenWords.has(norm(e.es))).length;

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
    const source = unseen.length > 0 ? unseen.slice(0, 20) : shuffle(VOCAB_CATALOG).slice(0, 20);
    const sessionItems = source.map(e => ({ de: e.de, es: e.es, example: '', currentLevel: 0 }));
    setItems(sessionItems);
    setAnswers(sessionItems.map(() => ''));
    setResults([]);
    setHints([]);
    setConfidence([]);
    setPhase('input');
  }

  function startWiederholen() {
    const wItems = dueToday.slice(0, 20).map(v => ({
      de: v.translation,
      es: v.word,
      example: v.example ?? '',
      vocabId: v.id,
      currentLevel: getLevel(v),
    }));
    setItems(wItems);
    setAnswers(wItems.map(() => ''));
    setResults([]);
    setHints([]);
    setPhase('input');
  }

  function submit() {
    const checked = items.map((item, i) => checkAnswer(answers[i], item.es));
    setResults(checked.map(c => c.correct));
    setHints(checked.map(c => c.accentHint));
    setConfidence(checked.map(c => c.correct ? 'sicher' : 'sicher')); // all default to sicher; user adjusts
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
    await refresh();
  }

  const correctCount = results.filter(Boolean).length;
  const bekanntFiltered = bekanntWords.filter(
    v =>
      !search ||
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vokabeln</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {bekanntWords.length} bekannt · {dueToday.length} heute fällig
            {upcoming.length > 0 && ` · ${upcoming.length} demnächst`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{bekanntWords.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Bekannt</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-amber-500">{dueToday.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Heute fällig</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-blue-500">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Demnächst</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(
            [
              ['lernen', 'Lernen'],
              ['wiederholen', dueToday.length > 0 ? `Wiederholen (${dueToday.length})` : 'Wiederholen'],
              ['bekannt', bekanntWords.length > 0 ? `Bekannt (${bekanntWords.length})` : 'Bekannt'],
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

        {/* ===== LERNEN ===== */}
        {tab === 'lernen' && (
          <div className="space-y-4">
            {phase === 'idle' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Nächste 20 unbekannte Wörter aus dem Katalog.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {unseenCount > 0
                      ? `${unseenCount} von ${VOCAB_CATALOG.length} Wörtern noch nicht gesehen`
                      : `Alle ${VOCAB_CATALOG.length} Katalogwörter bereits gesehen`}
                  </p>
                  {VOCAB_CATALOG.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.round((bekanntWords.length / VOCAB_CATALOG.length) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={startLernen}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Lernrunde starten →
                </button>
              </div>
            )}

            {(phase === 'input' || phase === 'results') && (
              <SessionPanel
                items={items}
                answers={answers}
                results={results}
                hints={hints}
                confidence={confidence}
                phase={phase}
                correctCount={correctCount}
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

        {/* ===== WIEDERHOLEN ===== */}
        {tab === 'wiederholen' && (
          <div className="space-y-4">
            {phase === 'idle' &&
              (dueToday.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-sm font-medium text-gray-500">Keine Wörter heute fällig!</p>
                  {upcoming.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {upcoming.length} Wörter kommen demnächst zurück.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <p className="text-sm text-gray-600">
                    Du hast <strong>{dueToday.length}</strong> fällige Wörter heute.
                    {dueToday.length > 20 && ' Es werden 20 abgefragt.'}
                  </p>
                  <button
                    onClick={startWiederholen}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Wiederholungsrunde starten →
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

        {/* ===== BEKANNT ===== */}
        {tab === 'bekannt' && (
          <div className="space-y-3">
            {bekanntWords.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-sm text-gray-400">
                  Noch keine bekannten Wörter. Mach eine Lernrunde!
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Suchen…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
                />
                <p className="text-xs text-gray-400">{bekanntFiltered.length} Wörter</p>
                <div className="space-y-2">
                  {bekanntFiltered.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{entry.word}</p>
                        <p className="text-gray-500 text-sm">{entry.translation}</p>
                        {entry.example && (
                          <p className="text-gray-400 text-xs mt-0.5 italic">„{entry.example}"</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await updateVocabStatus(entry.id, false);
                          await refresh();
                        }}
                        title="Zurück in Wiederholen"
                        className="text-gray-300 hover:text-amber-500 transition-colors text-lg shrink-0"
                      >
                        ↩
                      </button>
                    </div>
                  ))}
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
  onAnswerChange,
  onConfidenceChange,
  onSubmit,
  onSave,
  onReset,
}: SessionPanelProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const allFilled = answers.every(a => a.trim().length > 0);

  const bekanntOverrideCount = confidence.filter((c, i) => results[i] && c === 'bekannt').length;
  const unsicherCount = confidence.filter((c, i) => results[i] && c === 'unsicher').length;
  const toRepeat = results.filter(r => !r).length + unsicherCount;
  const toBeKannt = correctCount - unsicherCount - bekanntOverrideCount;
  const toDirectBeKannt = bekanntOverrideCount + (results.filter((r, i) => r && confidence[i] === 'bekannt').length - bekanntOverrideCount);

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
            {correctCount}/{items.length} richtig
            {correctCount === items.length && ' 🎉'}
          </p>
          <p className="text-center text-xs font-normal mt-1 opacity-70">
            {toRepeat} zu wiederholen · {toKeep(results, confidence)} Stufe höher
            {bekanntOverrideCount > 0 && ` · ${bekanntOverrideCount} direkt bekannt`}
          </p>
          <p className="text-center text-xs font-normal mt-2 opacity-60">
            Richtige Antworten: <strong>Unsicher</strong> zum Wiederholen, <strong>Bekannt</strong> zum sofortigen Ausblenden
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
                <span className="text-xs font-medium text-gray-700 w-28 shrink-0 leading-tight">{item.de}</span>
                <input
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  value={answers[i]}
                  disabled={phase === 'results'}
                  onChange={e => onAnswerChange(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (i < items.length - 1) inputRefs.current[i + 1]?.focus();
                      else if (allFilled) onSubmit();
                    }
                  }}
                  placeholder="Spanisch…"
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
                  <span className="text-xs text-green-700 font-semibold shrink-0">{item.es}</span>
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
                      Unsicher
                    </button>
                    <button
                      onClick={() => onConfidenceChange(i, 'sicher')}
                      className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                        conf === 'sicher'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      Sicher
                    </button>
                    <button
                      onClick={() => onConfidenceChange(i, 'bekannt')}
                      className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                        conf === 'bekannt'
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-800'
                      }`}
                    >
                      Bekannt ✓
                    </button>
                  </div>
                )}

                {wrong && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                    ↩
                  </span>
                )}
              </div>

              {/* Accent hint */}
              {phase === 'results' && ok && hint && (
                <p className="text-xs text-blue-600 pl-[calc(1rem+7rem+0.5rem)] pb-0.5">
                  Tipp: mit Akzent → <span className="font-semibold">{hint}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'input' ? (
        <button
          onClick={onSubmit}
          disabled={!allFilled}
          className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors"
        >
          Überprüfen
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Speichern & Fertig
          </button>
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Neue Runde →
          </button>
        </div>
      )}
    </div>
  );
}

function toKeep(results: boolean[], confidence: Confidence[]): number {
  return results.filter((r, i) => r && confidence[i] === 'sicher').length;
}
