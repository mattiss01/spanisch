'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStats, getVocab } from '@/lib/storage';
import { ProgressStats, ExerciseType } from '@/lib/types';

const quickStart: { id: ExerciseType; label: string; icon: string; desc: string }[] = [
  { id: 'fill_blank', label: 'Lückentext', icon: '✏️', desc: 'Grammatik & Struktur' },
  { id: 'conjugation', label: 'Konjugation', icon: '🔤', desc: 'Verbformen üben' },
  { id: 'vocabulary', label: 'Vokabeln', icon: '📝', desc: 'Wortschatz aufbauen' },
  { id: 'conversation', label: 'Konversation', icon: '💬', desc: 'Gespräch führen' },
];

const typeLabels: Partial<Record<ExerciseType, string>> = {
  fill_blank: 'Lückentext',
  translation: 'Übersetzung',
  multiple_choice: 'Multiple Choice',
  error_correction: 'Fehlerkorrektur',
  conjugation: 'Konjugation',
  reading: 'Leseverständnis',
  vocabulary: 'Vokabeln',
  conversation: 'Konversation',
};

export default function Dashboard() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [vocabCount, setVocabCount] = useState(0);

  useEffect(() => {
    setStats(getStats());
    setVocabCount(getVocab().length);
  }, []);

  const accuracy =
    stats && stats.totalAnswers > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
      : null;

  const topTypes = stats
    ? (Object.entries(stats.exercisesByType) as [ExerciseType, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : [];

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 p-5 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Hola! 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('de-DE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: stats?.exercisesCompleted ?? 0, label: 'Übungen', color: 'text-red-700' },
            { value: stats?.streak ?? 0, label: 'Streak 🔥', color: 'text-amber-600' },
            {
              value: accuracy !== null ? `${accuracy}%` : '–',
              label: 'Trefferquote',
              color: 'text-green-600',
            },
            { value: vocabCount, label: 'Vokabeln', color: 'text-blue-600' },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center"
            >
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm">B1 → B2 Fortschritt</p>
              <p className="text-xs text-gray-400">Ziel: 100 abgeschlossene Übungen</p>
            </div>
            <span className="text-sm font-bold text-red-700">
              {Math.min(100, stats?.exercisesCompleted ?? 0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((stats?.exercisesCompleted ?? 0) / 100) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Quick start */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Schnellstart</h2>
            <Link href="/uebungen" className="text-sm text-red-700 hover:underline">
              Alle Übungen →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickStart.map(type => (
              <Link
                key={type.id}
                href={`/uebungen?type=${type.id}`}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all group"
              >
                <p className="text-2xl mb-2">{type.icon}</p>
                <p className="font-semibold text-gray-800 text-sm group-hover:text-red-700 transition-colors">
                  {type.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Top types */}
        {topTypes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">
              Meistgenutzte Übungstypen
            </h2>
            <div className="space-y-2">
              {topTypes.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{typeLabels[type] ?? type}</span>
                  <span className="text-gray-400 font-medium">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {(!stats || stats.exercisesCompleted === 0) && (
          <div className="bg-red-700 rounded-xl p-5 text-white text-center">
            <p className="text-3xl mb-2">🚀</p>
            <p className="font-bold mb-1">Fang jetzt an!</p>
            <p className="text-red-200 text-sm mb-4">
              Wähle eine Übung und starte deine Lernreise zu B2.
            </p>
            <Link
              href="/uebungen"
              className="inline-block bg-white text-red-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Erste Übung starten
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
