'use client';

import { useMemo, useState } from 'react';
import { ArticleExercise as ArticleExerciseType } from '@/lib/types';
import { upsertArticleAttempt } from '@/lib/storage';

interface Props {
  exercise: ArticleExerciseType;
  onComplete?: (correct: number, total: number) => void;
  // When false, skip writing a per-topic progress record (used for unsaved
  // generated drafts whose topicId isn't a real saved topic yet).
  persist?: boolean;
}

type Mode = 'type' | 'mc';

function isCorrect(value: string, answer: string, alternatives?: string[]): boolean {
  const a = value.trim().toLowerCase();
  return a === answer.toLowerCase() || (alternatives ?? []).some(alt => alt.toLowerCase() === a);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ArticleExercise({ exercise, onComplete, persist = true }: Props) {
  const items = exercise.items;
  const [mode, setMode] = useState<Mode>('type');
  const [typed, setTyped] = useState<string[]>(items.map(() => ''));
  const [selected, setSelected] = useState<(string | null)[]>(items.map(() => null));
  const [retypes, setRetypes] = useState<string[]>(items.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Shuffle each item's MC options once per exercise so the answer isn't always first.
  const mcOptions = useMemo(() => items.map(it => shuffle(it.options)), [items]);

  const userAnswers = mode === 'type' ? typed : selected.map(s => s ?? '');
  const results = checked
    ? userAnswers.map((a, i) => isCorrect(a, items[i].answer, items[i].alternatives))
    : [];
  const correct = results.filter(Boolean).length;

  const allFilled =
    mode === 'type' ? typed.every(t => t.trim().length > 0) : selected.every(s => s !== null);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setChecked(false);
    setShowExplanation(false);
    setTyped(items.map(() => ''));
    setSelected(items.map(() => null));
    setRetypes(items.map(() => ''));
  }

  async function check() {
    setChecked(true);
    if (persist) {
      await upsertArticleAttempt(
        exercise.topicId,
        exercise.title,
        exercise.title_es,
        items,
        userAnswers
      );
    }
    onComplete?.(correct, items.length);
  }

  function reset() {
    setTyped(items.map(() => ''));
    setSelected(items.map(() => null));
    setRetypes(items.map(() => ''));
    setChecked(false);
    setShowExplanation(false);
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          ['type', 'Escribir'],
          ['mc', 'Elegir'],
        ] as [Mode, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              mode === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-3">
        {items.map((item, i) => {
          const ok = checked && results[i];
          const wrong = checked && !results[i];
          const retypeOk = wrong && retypes[i].trim().toLowerCase() === item.answer.toLowerCase();
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 transition-colors ${
                ok ? 'border-green-400 bg-green-50' : wrong ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              {mode === 'type' ? (
                <p className="text-gray-800 leading-relaxed flex items-baseline flex-wrap gap-x-1">
                  <span>{item.before}</span>
                  <input
                    type="text"
                    value={typed[i]}
                    disabled={checked}
                    onChange={e => {
                      const next = [...typed];
                      next[i] = e.target.value;
                      setTyped(next);
                    }}
                    placeholder="..."
                    className={`border-b-2 bg-transparent px-1 min-w-20 max-w-44 text-center transition-colors disabled:opacity-100 ${
                      ok
                        ? 'border-green-500 text-green-700'
                        : wrong
                        ? 'border-red-400 text-red-700'
                        : 'border-gray-400 focus:border-red-600 text-gray-900'
                    }`}
                  />
                  <span>{item.after}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-800 leading-relaxed">
                    {item.before}
                    <span className="font-semibold text-gray-400">＿＿</span>
                    {item.after}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mcOptions[i].map(opt => {
                      const isSel = selected[i] === opt;
                      const isAnswer = checked && isCorrect(opt, item.answer, item.alternatives);
                      const isWrongSel = checked && isSel && !isAnswer;
                      return (
                        <button
                          key={opt}
                          disabled={checked}
                          onClick={() => {
                            if (checked) return;
                            const next = [...selected];
                            next[i] = opt;
                            setSelected(next);
                          }}
                          className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            isAnswer
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : isWrongSel
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : isSel
                              ? 'border-red-600 bg-red-50 text-red-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-white'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback after checking */}
              {wrong && (
                <p className="mt-2 text-sm text-red-700">
                  ✓ <strong>{item.answer}</strong>
                  <span className="text-gray-500 ml-2 font-normal">({item.hint_es})</span>
                </p>
              )}
              {ok && <p className="mt-2 text-xs text-green-700">{item.hint_es}</p>}

              {/* Rewrite-to-learn (type mode only) */}
              {mode === 'type' && wrong && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-amber-600 shrink-0">Reescribe para aprender:</span>
                  <input
                    type="text"
                    value={retypes[i]}
                    onChange={e => {
                      const next = [...retypes];
                      next[i] = e.target.value;
                      setRetypes(next);
                    }}
                    placeholder={item.answer}
                    className={`flex-1 min-w-0 border-b bg-transparent text-sm py-0.5 outline-none transition-colors ${
                      retypeOk
                        ? 'border-green-500 text-green-700'
                        : 'border-amber-400 text-amber-700 focus:border-amber-600'
                    }`}
                  />
                  {retypeOk && <span className="text-green-600 text-sm shrink-0">✓</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={!allFilled}
          className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium transition-colors"
        >
          Überprüfen
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={`p-4 rounded-xl text-center font-medium ${
              correct === items.length
                ? 'bg-green-100 text-green-800'
                : correct >= items.length / 2
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {correct} von {items.length} richtig
            {correct === items.length && ' – Perfekt! 🎉'}
          </div>
          <button
            onClick={() => setShowExplanation(v => !v)}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm transition-colors"
          >
            {showExplanation ? 'Ocultar explicación' : 'Mostrar explicación gramatical'}
          </button>
          {showExplanation && (
            <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-900 leading-relaxed">
              {exercise.explanation_es}
            </div>
          )}
          <button
            onClick={reset}
            className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
