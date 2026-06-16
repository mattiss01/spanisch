'use client';

import { useState } from 'react';
import { ConjugationExercise } from '@/lib/types';

interface Props {
  exercise: ConjugationExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function Conjugation({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(exercise.pronouns.map(() => ''));
  const [checked, setChecked] = useState(false);

  const results = checked
    ? answers.map((a, i) => a.trim().toLowerCase() === exercise.answers[i].toLowerCase())
    : [];

  const correct = results.filter(Boolean).length;

  function check() {
    setChecked(true);
    onComplete?.(correct, exercise.pronouns.length);
  }

  function reset() {
    setAnswers(exercise.pronouns.map(() => ''));
    setChecked(false);
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Verb</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{exercise.verb}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Zeitform</p>
          <p className="text-sm font-semibold text-red-700 mt-0.5">{exercise.tenseName_de}</p>
          <p className="text-xs text-gray-400 italic">{exercise.tense}</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-2">
        {exercise.pronouns.map((pronoun, i) => {
          const isCorrect = checked && results[i];
          const isWrong = checked && !results[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-colors ${
                isCorrect
                  ? 'border-green-400 bg-green-50'
                  : isWrong
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-sm text-gray-400 w-40 shrink-0">{pronoun}</span>
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
                className={`flex-1 border-b bg-transparent text-sm transition-colors disabled:opacity-100 ${
                  isCorrect
                    ? 'border-green-400 text-green-700'
                    : isWrong
                    ? 'border-red-400 text-red-700'
                    : 'border-gray-300 focus:border-red-600 text-gray-900'
                }`}
              />
              {isWrong && (
                <span className="text-sm text-green-700 font-semibold shrink-0">
                  {exercise.answers[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {exercise.notes && (
        <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
          <strong>Hinweis:</strong> {exercise.notes}
        </div>
      )}

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
              correct === exercise.pronouns.length
                ? 'bg-green-100 text-green-800'
                : correct >= exercise.pronouns.length / 2
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {correct} von {exercise.pronouns.length} richtig
            {correct === exercise.pronouns.length && ' 🎉'}
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
