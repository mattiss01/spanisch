'use client';

import { useState } from 'react';
import { FillBlankExercise } from '@/lib/types';

interface Props {
  exercise: FillBlankExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function FillBlank({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(exercise.items.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const results = checked
    ? answers.map((a, i) => a.trim().toLowerCase() === exercise.items[i].answer.toLowerCase())
    : [];

  const correct = results.filter(Boolean).length;

  function check() {
    setChecked(true);
    onComplete?.(correct, exercise.items.length);
  }

  function reset() {
    setAnswers(exercise.items.map(() => ''));
    setChecked(false);
    setShowExplanation(false);
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-3">
        {exercise.items.map((item, i) => {
          const isCorrect = checked && results[i];
          const isWrong = checked && !results[i];
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 transition-colors ${
                isCorrect
                  ? 'border-green-400 bg-green-50'
                  : isWrong
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className="text-gray-800 leading-relaxed flex items-baseline flex-wrap gap-x-1">
                <span>{item.before}</span>
                <input
                  type="text"
                  value={answers[i]}
                  disabled={checked}
                  onChange={e => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="..."
                  className={`border-b-2 bg-transparent px-1 min-w-20 max-w-40 text-center transition-colors disabled:opacity-100 ${
                    isCorrect
                      ? 'border-green-500 text-green-700'
                      : isWrong
                      ? 'border-red-400 text-red-700'
                      : 'border-gray-400 focus:border-red-600 text-gray-900'
                  }`}
                />
                <span>{item.after}</span>
              </p>
              {isWrong && (
                <p className="mt-2 text-sm text-red-700">
                  ✓ <strong>{exercise.items[i].answer}</strong>
                  {item.hint && <span className="text-gray-400 ml-2 font-normal">({item.hint})</span>}
                </p>
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
            {correct === exercise.items.length && ' – Perfekt! 🎉'}
          </div>
          <button
            onClick={() => setShowExplanation(v => !v)}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm transition-colors"
          >
            {showExplanation ? 'Erklärung ausblenden' : 'Grammatik-Erklärung anzeigen'}
          </button>
          {showExplanation && (
            <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-900 leading-relaxed">
              {exercise.explanation}
            </div>
          )}
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
