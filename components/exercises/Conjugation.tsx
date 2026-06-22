'use client';

import { useState } from 'react';
import { ConjugationExercise } from '@/lib/types';
import { upsertConjugationAttempt } from '@/lib/storage';

interface Props {
  exercise: ConjugationExercise;
  onComplete?: (correct: number, total: number) => void;
}

// Conjugation answers are checked accent-insensitively: a missing or wrong accent
// (e.g. "hablo" vs "habló", "comi" vs "comí") still counts as correct. For German,
// "ß" and "ss" are treated as equal so it can be typed on any keyboard
// (e.g. "heißt" vs "heisst", "groß" vs "gross").
function answersMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
  return norm(a) === norm(b);
}

export default function Conjugation({ exercise, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[][]>(
    exercise.sections.map(s => s.pronouns.map(() => ''))
  );
  const [checked, setChecked] = useState(false);
  // Rewrite-to-learn: after checking, the learner retypes each wrong form.
  const [retypes, setRetypes] = useState<string[][]>(
    exercise.sections.map(s => s.pronouns.map(() => ''))
  );

  const results: boolean[][] = checked
    ? exercise.sections.map((s, si) =>
        s.pronouns.map((_, pi) => answersMatch(answers[si][pi], s.answers[pi]))
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

  function setRetype(si: number, pi: number, value: string) {
    setRetypes(prev => {
      const next = prev.map(row => [...row]);
      next[si][pi] = value;
      return next;
    });
  }

  async function check() {
    setChecked(true);
    await upsertConjugationAttempt(
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
    setRetypes(exercise.sections.map(s => s.pronouns.map(() => '')));
    setChecked(false);
  }

  return (
    <div className="space-y-5">
      {/* Verb header */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Verb</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{exercise.verb}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Tenses</p>
          <p className="text-sm font-semibold text-red-700 mt-0.5">{exercise.sections.length} forms</p>
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
                  const target = section.answers[pi];
                  const retypeOk = isWrong && answersMatch(retypes[si][pi], target);
                  return (
                    <div
                      key={pi}
                      className={`px-4 py-2 ${
                        isCorrect ? 'bg-green-50' : isWrong ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
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
                            {target}
                          </span>
                        )}
                      </div>

                      {isWrong && (
                        <div className="flex items-center gap-2 mt-1.5 sm:pl-[9.75rem]">
                          <span className="text-xs text-amber-600 shrink-0">Rewrite to learn:</span>
                          <input
                            type="text"
                            value={retypes[si][pi]}
                            onChange={e => setRetype(si, pi, e.target.value)}
                            placeholder={target}
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
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium transition-colors"
        >
          Check
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
            {perfectSections}/{exercise.sections.length} tenses perfect ·{' '}
            {totalCorrect}/{totalQuestions} forms correct
            {totalCorrect === totalQuestions && ' 🎉'}
          </div>
          <button
            onClick={reset}
            className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
