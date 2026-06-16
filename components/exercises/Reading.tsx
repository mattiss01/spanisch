'use client';

import { useState } from 'react';
import { ReadingExercise } from '@/lib/types';

interface Props {
  exercise: ReadingExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function Reading({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(exercise.questions.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [showText, setShowText] = useState(true);

  function check() {
    setChecked(true);
    onComplete?.(exercise.questions.length, exercise.questions.length);
  }

  function reset() {
    setAnswers(exercise.questions.map(() => ''));
    setChecked(false);
    setShowText(true);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowText(v => !v)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="font-medium text-gray-800 text-sm">📖 Lesetext</span>
          <span className="text-gray-400 text-xs">{showText ? 'Ausblenden ↑' : 'Anzeigen ↓'}</span>
        </button>
        {showText && (
          <div className="p-4 bg-white">
            <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">{exercise.text}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-600 text-sm mb-4">{exercise.instruction}</p>
        <div className="space-y-4">
          {exercise.questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <label className="text-sm font-medium text-gray-800">
                {i + 1}. {q.question}
              </label>
              <textarea
                value={answers[i]}
                disabled={checked}
                onChange={e => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                rows={2}
                placeholder="Deine Antwort auf Deutsch..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none disabled:bg-gray-50 focus:border-red-400"
              />
              {checked && (
                <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                  <strong>Musterlösung:</strong> {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!checked ? (
        <button
          onClick={check}
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium transition-colors"
        >
          Musterlösungen anzeigen
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-sm text-center font-medium">
            Vergleiche deine Antworten mit den Musterlösungen.
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
