'use client';

import { useState } from 'react';
import { TranslationExercise } from '@/lib/types';

interface Props {
  exercise: TranslationExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function Translation({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(exercise.items.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>(exercise.items.map(() => false));

  const fromFlag = exercise.direction === 'de_to_es' ? '🇩🇪' : '🇪🇸';
  const toFlag = exercise.direction === 'de_to_es' ? '🇪🇸' : '🇩🇪';

  function reveal(i: number) {
    const next = [...revealed];
    next[i] = true;
    setRevealed(next);
  }

  function check() {
    setChecked(true);
    const done = answers.filter(a => a.trim().length > 0).length;
    onComplete?.(done, exercise.items.length);
  }

  function reset() {
    setAnswers(exercise.items.map(() => ''));
    setChecked(false);
    setRevealed(exercise.items.map(() => false));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{fromFlag}</span>
        <span className="text-gray-300">→</span>
        <span>{toFlag}</span>
        <span className="ml-1">{exercise.instruction}</span>
      </div>

      <div className="space-y-4">
        {exercise.items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-3">
            <p className="font-medium text-gray-900">{item.source}</p>
            <textarea
              value={answers[i]}
              disabled={checked}
              onChange={e => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              rows={2}
              placeholder="Deine Übersetzung..."
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 resize-none disabled:bg-gray-50 focus:border-red-400"
            />
            {checked || revealed[i] ? (
              <div className="text-sm space-y-1">
                <p className="text-green-700 font-medium">✓ {item.answer}</p>
                {item.alternatives && item.alternatives.length > 0 && (
                  <p className="text-gray-400">Auch möglich: {item.alternatives.join('; ')}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => reveal(i)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Lösung anzeigen
              </button>
            )}
          </div>
        ))}
      </div>

      {exercise.tips && (
        <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
          <strong>Tipps:</strong> {exercise.tips}
        </div>
      )}

      {!checked ? (
        <button
          onClick={check}
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium transition-colors"
        >
          Abschließen & Lösungen anzeigen
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-green-50 text-green-800 text-sm text-center font-medium">
            Vergleiche deine Übersetzungen mit den Musterlösungen. ✓
          </div>
          <button
            onClick={reset}
            className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Neu versuchen
          </button>
        </div>
      )}
    </div>
  );
}
