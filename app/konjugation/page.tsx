'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConjugationRecords, recordExercise } from '@/lib/storage';
import { ConjugationRecord, ConjugationExercise } from '@/lib/types';
import Conjugation from '@/components/exercises/Conjugation';
import { VERB_CATALOG } from '@/lib/verb-catalog';

type Tab = 'lernen' | 'all' | 'mistakes';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
}

function TotalBar({ record }: { record: ConjugationRecord }) {
  const total = record.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
  const correct = record.sections.reduce((sum, s) => sum + s.totalCorrect, 0);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function KonjugationPage() {
  const [records, setRecords] = useState<ConjugationRecord[]>([]);
  const [tab, setTab] = useState<Tab>('lernen');
  const [practicing, setPracticing] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ConjugationExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => setRecords(await getConjugationRecords()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const withMistakes = records.filter(r =>
    r.sections.some(s => s.recentMistakes.length > 0)
  );
  const displayed = tab === 'mistakes' ? withMistakes : records;
  const mastered = records.filter(r => r.mastered).length;

  const learnedVerbs = new Set(records.map(r => r.verb.toLowerCase()));
  const unseenCount = VERB_CATALOG.filter(v => !learnedVerbs.has(v.infinitive.toLowerCase())).length;

  async function startNew() {
    setPracticing('__new__');
    setExercise(null);
    setError('');
    setLoading(true);
    try {
      const knownVerbs = records.map(r => r.verb);
      const res = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'conjugation', knownVerbs }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setExercise(data as ConjugationExercise);
    } catch {
      setError('Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function startPractice(record: ConjugationRecord) {
    if (practicing === record.id) {
      setPracticing(null);
      setExercise(null);
      return;
    }
    setPracticing(record.id);
    setExercise(null);
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conjugation',
          topic: '',
          difficulty: 'B1',
          verb: record.verb,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setExercise(data as ConjugationExercise);
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(correct: number, total: number) {
    await recordExercise('conjugation', correct, total);
    await refresh();
  }

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verben</h1>
          <p className="text-gray-400 text-sm mt-0.5">Konjugationen üben und Fehler wiederholen</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-800">{records.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Verben gelernt</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{mastered}</p>
            <p className="text-xs text-gray-400 mt-0.5">Gemeistert</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-red-600">{withMistakes.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Mit Fehlern</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            ['lernen', 'Lernen'],
            ['all', 'Alle Verben'],
            ['mistakes', 'Fehler'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setPracticing(null); setExercise(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {id === 'mistakes' && withMistakes.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {withMistakes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Lernen tab ── */}
        {tab === 'lernen' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{unseenCount}</span> von{' '}
                <span className="font-semibold text-gray-800">{VERB_CATALOG.length}</span> Verben noch nicht geübt
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${Math.round(((VERB_CATALOG.length - unseenCount) / VERB_CATALOG.length) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {VERB_CATALOG.length - unseenCount} gelernt · {mastered} gemeistert
              </p>
            </div>

            {practicing !== '__new__' && (
              <button
                onClick={startNew}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
              >
                {unseenCount > 0 ? 'Nächstes Verb lernen →' : 'Zufälliges Verb wiederholen →'}
              </button>
            )}

            {practicing === '__new__' && (
              <div>
                {loading && (
                  <p className="text-center text-sm text-gray-400 animate-pulse py-4">Wird geladen…</p>
                )}
                {error && (
                  <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">{error}</div>
                )}
                {exercise && !loading && (
                  <div className="space-y-4">
                    <Conjugation exercise={exercise} onComplete={handleComplete} />
                    <button
                      onClick={() => { setPracticing(null); setExercise(null); startNew(); }}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Nächstes Verb →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty states for other tabs */}
        {tab !== 'lernen' && displayed.length === 0 && (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">{tab === 'mistakes' ? '🎉' : '🔤'}</p>
            <p className="text-sm text-gray-500 font-medium">
              {tab === 'mistakes' ? 'Keine Fehler – alles gemeistert!' : 'Noch keine Verben geübt.'}
            </p>
          </div>
        )}

        {/* Verb cards */}
        {tab !== 'lernen' && (
        <div className="space-y-3">
          {displayed.map(record => {
            const isPracticing = practicing === record.id;
            const isExpanded = expanded.has(record.id);
            const totalMistakes = record.sections.reduce(
              (sum, s) => sum + s.recentMistakes.length,
              0
            );

            return (
              <div
                key={record.id}
                className={`bg-white rounded-xl border-2 shadow-sm transition-colors ${
                  isPracticing ? 'border-red-300' : 'border-gray-100'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">{record.verb}</span>
                        {record.mastered ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">
                            ✓ Gemeistert
                          </span>
                        ) : totalMistakes > 0 ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-medium">
                            ⚠ {totalMistakes} Fehler
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {record.sections.length} Zeitformen · {record.totalAttempts}× geübt ·{' '}
                        {timeAgo(record.lastAttempted)}
                      </p>
                    </div>
                    <button
                      onClick={() => startPractice(record)}
                      className={`shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        isPracticing
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {isPracticing ? 'Schließen' : 'Wiederholen'}
                    </button>
                  </div>

                  {/* Accuracy bar */}
                  <TotalBar record={record} />

                  {/* Per-tense breakdown toggle */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? 'Zeitformen ausblenden ▲' : `${record.sections.length} Zeitformen anzeigen ▼`}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pt-1">
                      {record.sections.map(s => {
                        const pct =
                          s.totalQuestions > 0
                            ? Math.round((s.totalCorrect / s.totalQuestions) * 100)
                            : 0;
                        return (
                          <div key={s.tense} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 font-medium">{s.tenseName_de}</span>
                              <span
                                className={`font-semibold ${
                                  pct === 100
                                    ? 'text-green-600'
                                    : pct >= 70
                                    ? 'text-amber-600'
                                    : 'text-red-500'
                                }`}
                              >
                                {s.totalCorrect}/{s.totalQuestions}
                              </span>
                            </div>
                            {s.recentMistakes.length > 0 && (
                              <div className="pl-2 space-y-0.5">
                                {s.recentMistakes.map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-400 w-32 shrink-0">{m.pronoun}</span>
                                    <span className="text-red-400 line-through">{m.userAnswer || '–'}</span>
                                    <span className="text-gray-300">→</span>
                                    <span className="text-green-700 font-medium">{m.correct}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Inline practice */}
                {isPracticing && (
                  <div className="border-t border-gray-100 p-4">
                    {loading && (
                      <p className="text-center text-sm text-gray-400 animate-pulse py-6">
                        Übung wird generiert…
                      </p>
                    )}
                    {error && (
                      <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">{error}</div>
                    )}
                    {exercise && !loading && (
                      <Conjugation exercise={exercise} onComplete={handleComplete} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </main>
  );
}
