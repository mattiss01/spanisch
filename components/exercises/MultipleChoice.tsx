'use client';

import { useState } from 'react';
import { MultipleChoiceExercise } from '@/lib/types';

interface Props {
  exercise: MultipleChoiceExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function MultipleChoice({ exercise, onComplete }: Props) {
  const [selected, setSelected] = useState<(number | null)[]>(exercise.items.map(() => null));
  const [checked, setChecked] = useState(false);

  const results = checked
    ? selected.map((s, i) => s === exercise.items[i].correctIndex)
    : [];

  const correct = results.filter(Boolean).length;

  function check() {
    setChecked(true);
    onComplete?.(correct, exercise.items.length);
  }

  function reset() {
    setSelected(exercise.items.map(() => null));
    setChecked(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-6">
        {exercise.items.map((item, i) => (
          <div key={i} className="space-y-2">
            <p className="font-medium text-gray-900 text-sm">
              <span className="text-gray-300 mr-2">{i + 1}.</span>
              {item.question}
            </p>
            <div className="grid gap-2">
              {item.options.map((opt, j) => {
                const isSel = selected[i] === j;
                const isCorrect = checked && j === item.correctIndex;
                const isWrong = checked && isSel && j !== item.correctIndex;
                return (
                  <button
                    key={j}
                    disabled={checked}
                    onClick={() => {
                      if (!checked) {
                        const next = [...selected];
                        next[i] = j;
                        setSelected(next);
                      }
                    }}
                    className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 text-green-800 font-medium'
                        : isWrong
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : isSel
                        ? 'border-red-600 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-gray-300 mr-2">{String.fromCharCode(65 + j)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {checked && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  results[i] ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'
                }`}
              >
                {item.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={selected.some(s => s === null)}
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
            {correct === exercise.items.length && ' 🎉'}
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
