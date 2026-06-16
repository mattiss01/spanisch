'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConjugationRecords, upsertConjugationAttempt, recordExercise } from '@/lib/storage';
import { ConjugationRecord, ConjugationExercise } from '@/lib/types';
import Conjugation from '@/components/exercises/Conjugation';

type Tab = 'all' | 'mistakes';

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

function AccuracyBar({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-16 text-right">
        {correct}/{total} richtig
      </span>
    </div>
  );
}

export default function KonjugationPage() {
  const [records, setRecords] = useState<ConjugationRecord[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [practicing, setPracticing] = useState<string | null>(null); // record id being practiced
  const [exercise, setExercise] = useState<ConjugationExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setRecords(getConjugationRecords());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayed =
    tab === 'mistakes'
      ? records.filter(r => r.recentMistakes.length > 0)
      : records;

  const masteredCount = records.filter(r => r.mastered).length;
  const mistakeCount = records.filter(r => r.recentMistakes.length > 0).length;

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
          tense: record.tense,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setExercise(data as ConjugationExercise);
      }
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  function handleComplete(correct: number, total: number) {
    recordExercise('conjugation', correct, total);
    refresh();
  }

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verben</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Konjugationen üben und Fehler wiederholen
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-800">{records.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Verben geübt</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Gemeistert</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-red-600">{mistakeCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Mit Fehlern</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Alle Verben
            {records.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                {records.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('mistakes')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'mistakes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Fehler wiederholen
            {mistakeCount > 0 && (
              <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {mistakeCount}
              </span>
            )}
          </button>
        </div>

        {/* Empty states */}
        {displayed.length === 0 && (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-3">{tab === 'mistakes' ? '🎉' : '🔤'}</p>
            <p className="text-sm text-gray-500 font-medium">
              {tab === 'mistakes'
                ? 'Keine Fehler – alles gemeistert!'
                : 'Noch keine Verben geübt.'}
            </p>
            {tab === 'all' && (
              <p className="text-xs text-gray-400 mt-1">
                Mach eine Konjugationsübung unter{' '}
                <a href="/uebungen?type=conjugation" className="text-red-600 hover:underline">
                  Übungen
                </a>
                , um hier Verben zu sehen.
              </p>
            )}
          </div>
        )}

        {/* Verb list */}
        <div className="space-y-3">
          {displayed.map(record => {
            const isPracticing = practicing === record.id;
            const accuracy =
              record.totalQuestions > 0
                ? Math.round((record.totalCorrect / record.totalQuestions) * 100)
                : 0;

            return (
              <div key={record.id}>
                <div
                  className={`bg-white rounded-xl border-2 transition-colors shadow-sm ${
                    isPracticing ? 'border-red-300' : 'border-gray-100'
                  }`}
                >
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{record.verb}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                            {record.tenseName_de}
                          </span>
                          {record.mastered ? (
                            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-md font-medium">
                              ✓ Gemeistert
                            </span>
                          ) : record.recentMistakes.length > 0 ? (
                            <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-md font-medium">
                              ⚠ {record.recentMistakes.length} Fehler
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 italic">{record.tense}</p>
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

                    {/* Stats row */}
                    <AccuracyBar correct={record.totalCorrect} total={record.totalQuestions} />
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-300">{accuracy}% Trefferquote</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-300">
                        {record.totalAttempts}× versucht
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-300">{timeAgo(record.lastAttempted)}</span>
                    </div>

                    {/* Recent mistakes */}
                    {!isPracticing && record.recentMistakes.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl space-y-1">
                        <p className="text-xs font-semibold text-red-700 mb-1.5">
                          Letzte Fehler:
                        </p>
                        {record.recentMistakes.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-32 shrink-0">{m.pronoun}</span>
                            <span className="text-red-500 line-through">{m.userAnswer || '(leer)'}</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-green-700 font-medium">{m.correct}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline practice panel */}
                  {isPracticing && (
                    <div className="border-t border-gray-100 p-4">
                      {loading && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="animate-pulse text-sm">Übung wird generiert…</p>
                        </div>
                      )}
                      {error && (
                        <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">{error}</div>
                      )}
                      {exercise && !loading && (
                        <Conjugation
                          exercise={exercise}
                          onComplete={(c, t) => {
                            handleComplete(c, t);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
