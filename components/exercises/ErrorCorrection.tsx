'use client';

import { useState } from 'react';
import { ErrorCorrectionExercise } from '@/lib/types';

interface Props {
  exercise: ErrorCorrectionExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function ErrorCorrection({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(exercise.items.map(() => ''));
  const [checked, setChecked] = useState(false);

  const results = checked
    ? answers.map((a, i) => a.trim().toLowerCase() === exercise.items[i].correct.toLowerCase())
    : [];

  const correct = results.filter(Boolean).length;

  function check() {
    setChecked(true);
    onComplete?.(correct, exercise.items.length);
  }

  function reset() {
    setAnswers(exercise.items.map(() => ''));
    setChecked(false);
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-4">
        {exercise.items.map((item, i) => {
          const isCorrect = checked && results[i];
          const isWrong = checked && !results[i];
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 space-y-3 transition-colors ${
                isCorrect
                  ? 'border-green-400 bg-green-50'
                  : isWrong
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Fehler – {item.errorType}
                </span>
                <p className="mt-1 text-red-600 line-through text-sm">{item.incorrect}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Deine Korrektur
                </span>
                <input
                  type="text"
                  value={answers[i]}
                  disabled={checked}
                  onChange={e => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="Korrigierter Satz..."
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-red-400 disabled:bg-transparent disabled:border-transparent"
                />
              </div>
              {checked && (
                <div className="text-sm space-y-1 pt-1 border-t border-gray-100">
                  <p className="text-green-700 font-medium">✓ {item.correct}</p>
                  <p className="text-gray-500">{item.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={answers.some(a => !a.trim())}
          className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium transition-colors"
        >
          Überprüfen
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={`p-4 rounded-xl text-center font-medium ${
              correct === exercise.items.length
                ? 'bg-green-100 text-green-800'
                : correct >= exercise.items.length / 2
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {correct} von {exercise.items.length} richtig
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
