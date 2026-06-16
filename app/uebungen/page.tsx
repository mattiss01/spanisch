'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Exercise, ExerciseType, Difficulty } from '@/lib/types';
import ExerciseRenderer from '@/components/ExerciseRenderer';
import { recordExercise, getConjugationRecords } from '@/lib/storage';

const TYPES: { id: ExerciseType; label: string; icon: string }[] = [
  { id: 'fill_blank', label: 'Lückentext', icon: '✏️' },
  { id: 'translation', label: 'Übersetzung', icon: '🔄' },
  { id: 'multiple_choice', label: 'Multiple Choice', icon: '☑️' },
  { id: 'error_correction', label: 'Fehlerkorrektur', icon: '🔍' },
  { id: 'conjugation', label: 'Konjugation', icon: '🔤' },
  { id: 'reading', label: 'Leseverständnis', icon: '📖' },
  { id: 'vocabulary', label: 'Vokabeln', icon: '📝' },
  { id: 'conversation', label: 'Konversation', icon: '💬' },
];

function UebungenContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as ExerciseType) ?? null;

  const [selectedType, setSelectedType] = useState<ExerciseType | null>(initialType);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('B1');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  async function generate() {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    setExercise(null);
    setCompleted(false);

    try {
      const knownVerbs =
        selectedType === 'conjugation'
          ? getConjugationRecords().map(r => r.verb)
          : undefined;

      const res = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, topic, difficulty, knownVerbs }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error + (data.details ? ` – ${data.details}` : ''));
      } else {
        setExercise(data);
      }
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  function handleComplete(correct: number, total: number) {
    setCompleted(true);
    if (selectedType) recordExercise(selectedType, correct, total);
  }

  function selectType(id: ExerciseType) {
    setSelectedType(id);
    setExercise(null);
    setCompleted(false);
    setError('');
  }

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto p-5 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Übungen</h1>

        {/* Type selector */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Übungstyp wählen
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => selectType(t.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedType === t.id
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-xl mb-1">{t.icon}</p>
                <p
                  className={`text-xs font-medium leading-tight ${
                    selectedType === t.id ? 'text-red-700' : 'text-gray-600'
                  }`}
                >
                  {t.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {selectedType && (
          <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Thema{' '}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="z.B. Reisen, Essen, Arbeit, Familie, Umwelt..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:border-red-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Schwierigkeit
              </label>
              <div className="flex gap-2">
                {(['B1', 'B2'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      difficulty === d
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {selectedType && (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3.5 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Übung wird generiert…
              </>
            ) : (
              '✨ Übung generieren'
            )}
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {!selectedType && (
          <div className="text-center py-16 text-gray-300">
            <p className="text-5xl mb-3">☝️</p>
            <p className="text-sm text-gray-400">Wähle einen Übungstyp, um zu starten.</p>
          </div>
        )}

        {exercise && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">
                  {(exercise as unknown as { title: string }).title}
                </h2>
                {(exercise as unknown as { topic?: string }).topic && (
                  <p className="text-xs text-gray-400 mt-1">
                    Thema: {(exercise as unknown as { topic: string }).topic}
                  </p>
                )}
              </div>
              <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-semibold shrink-0 ml-3">
                {difficulty}
              </span>
            </div>

            <ExerciseRenderer exercise={exercise} onComplete={handleComplete} />

            {completed && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={generate}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Neue Übung generieren →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Uebungen() {
  return (
    <Suspense>
      <UebungenContent />
    </Suspense>
  );
}
