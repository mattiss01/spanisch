'use client';

import { useState } from 'react';
import { ConjugationExercise } from '@/lib/types';
import { upsertConjugationAttempt } from '@/lib/storage';

interface Props {
  exercise: ConjugationExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function Conjugation({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[][]>(
    exercise.sections.map(s => s.pronouns.map(() => ''))
  );
  const [checked, setChecked] = useState(false);

  const results: boolean[][] = checked
    ? exercise.sections.map((s, si) =>
        s.pronouns.map((_, pi) =>
          answers[si][pi].trim().toLowerCase() === s.answers[pi].toLowerCase()
        )
      )
    : exercise.sections.map(s => s.pronouns.map(() => false));

  const totalCorrect = results.flat().filter(Boolean).length;
  const totalQuestions = exercise.sections.reduce((sum, s) => sum + s.pronouns.length, 0);
  const perfectSections = checked ? results.filter(r => r.every(Boolean)).length : 0;

  function setAnswer(si: number, pi: number, value: string) {
    setAnswers(prev => {
      const next = prev.map(row => [...row]);
      next[si][pi] = value;
      return next;
    });
  }

  function check() {
    setChecked(true);
    upsertConjugationAttempt(
      exercise.verb,
      exercise.sections.map((s, si) => ({
        tense: s.tense,
        tenseName_de: s.tenseName_de,
        pronouns: s.pronouns,
        correctAnswers: s.answers,
        userAnswers: answers[si],
      }))
    );
    onComplete?.(totalCorrect, totalQuestions);
  }

  function reset() {
    setAnswers(exercise.sections.map(s => s.pronouns.map(() => '')));
    setChecked(false);
  }

  const allFilled = answers.every(row => row.every(a => a.trim().length > 0));

  return (
    <div className="space-y-5">
      {/* Verb header */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Verb</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{exercise.verb}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Zeitformen</p>
          <p className="text-sm font-semibold text-red-700 mt-0.5">{exercise.sections.length} Formen</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      {/* Tense sections */}
      <div className="space-y-4">
        {exercise.sections.map((section, si) => {
          const sectionResults = checked ? results[si] : [];
          const sectionCorrect = sectionResults.filter(Boolean).length;
          const sectionPerfect = checked && sectionResults.every(Boolean);
          const sectionWrong = checked && !sectionPerfect;

          return (
            <div
              key={si}
              className={`rounded-xl border-2 overflow-hidden transition-colors ${
                sectionPerfect
                  ? 'border-green-300'
                  : sectionWrong
                  ? 'border-red-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Section header */}
              <div
                className={`px-4 py-2.5 flex items-center justify-between ${
                  sectionPerfect
                    ? 'bg-green-50'
                    : sectionWrong
                    ? 'bg-red-50'
                    : 'bg-gray-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-gray-800 text-sm">{section.tenseName_de}</span>
                  <span className="text-gray-400 text-xs ml-2 italic">{section.tense}</span>
                </div>
                {checked && (
                  <span
                    className={`text-xs font-semibold ${
                      sectionPerfect ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {sectionCorrect}/{section.pronouns.length}
                    {sectionPerfect && ' ✓'}
                  </span>
                )}
              </div>

              {/* Pronoun rows */}
              <div className="bg-white divide-y divide-gray-100">
                {section.pronouns.map((pronoun, pi) => {
                  const isCorrect = checked && results[si][pi];
                  const isWrong = checked && !results[si][pi];
                  return (
                    <div
                      key={pi}
                      className={`flex items-center gap-3 px-4 py-2 ${
                        isCorrect ? 'bg-green-50' : isWrong ? 'bg-red-50' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-400 w-36 shrink-0">{pronoun}</span>
                      <input
                        type="text"
                        value={answers[si][pi]}
                        disabled={checked}
                        onChange={e => setAnswer(si, pi, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const nextPi = pi + 1;
                            const nextSi = si + (nextPi >= section.pronouns.length ? 1 : 0);
                            const actualPi = nextPi >= section.pronouns.length ? 0 : nextPi;
                            if (nextSi < exercise.sections.length) {
                              const id = `inp-${nextSi}-${actualPi}`;
                              document.getElementById(id)?.focus();
                            }
                          }
                        }}
                        id={`inp-${si}-${pi}`}
                        placeholder="..."
                        className={`flex-1 border-b bg-transparent text-sm transition-colors disabled:opacity-100 ${
                          isCorrect
                            ? 'border-green-400 text-green-700'
                            : isWrong
                            ? 'border-red-400 text-red-600'
                            : 'border-gray-300 focus:border-red-600 text-gray-900'
                        }`}
                      />
                      {isWrong && (
                        <span className="text-sm text-green-700 font-semibold shrink-0">
                          {section.answers[pi]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {section.notes && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                  {section.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
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
              totalCorrect === totalQuestions
                ? 'bg-green-100 text-green-800'
                : totalCorrect >= totalQuestions * 0.7
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {perfectSections}/{exercise.sections.length} Zeitformen perfekt ·{' '}
            {totalCorrect}/{totalQuestions} Formen richtig
            {totalCorrect === totalQuestions && ' 🎉'}
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
