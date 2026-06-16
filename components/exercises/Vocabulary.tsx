'use client';

import { useState } from 'react';
import { VocabularyExercise } from '@/lib/types';
import { addVocabEntry } from '@/lib/storage';

interface Props {
  exercise: VocabularyExercise;
  onComplete?: (correct: number, total: number) => void;
}

const posLabel: Record<string, string> = {
  noun: 'Nomen',
  verb: 'Verb',
  adjective: 'Adj.',
  expression: 'Ausdruck',
  adverb: 'Adverb',
};

const posColor: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-green-100 text-green-700',
  adjective: 'bg-purple-100 text-purple-700',
  expression: 'bg-amber-100 text-amber-700',
  adverb: 'bg-gray-100 text-gray-600',
};

export default function Vocabulary({ exercise, onComplete }: Props) {
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  function saveWord(i: number) {
    const item = exercise.items[i];
    addVocabEntry({
      word: item.word + (item.gender ? ` (${item.gender}.)` : ''),
      translation: item.translation,
      example: item.example_es,
      topic: exercise.topic,
    });
    setSaved(prev => new Set([...prev, i]));
  }

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">{exercise.instruction}</p>

      <div className="space-y-2">
        {exercise.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => toggleExpand(i)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-semibold text-gray-900 text-sm">{item.word}</span>
                {item.gender && (
                  <span className="text-xs text-gray-400">({item.gender}.)</span>
                )}
                {item.plural && (
                  <span className="text-xs text-gray-300">Pl: {item.plural}</span>
                )}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                    posColor[item.partOfSpeech] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {posLabel[item.partOfSpeech] ?? item.partOfSpeech}
                </span>
              </div>
              <span className="text-gray-300 ml-2 text-xs">{expanded.has(i) ? '▲' : '▼'}</span>
            </button>

            {expanded.has(i) && (
              <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-gray-100 pt-3">
                <p className="text-gray-800 font-medium text-sm">{item.translation}</p>
                <div className="space-y-0.5 text-sm bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-700 italic">„{item.example_es}"</p>
                  <p className="text-gray-400 text-xs">{item.example_de}</p>
                </div>
                <button
                  onClick={() => saveWord(i)}
                  disabled={saved.has(i)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    saved.has(i)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {saved.has(i) ? '✓ Gespeichert' : '+ Zur Vokabelliste hinzufügen'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onComplete?.(exercise.items.length, exercise.items.length)}
        className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium transition-colors"
      >
        Vokabeln gelernt ✓
      </button>
    </div>
  );
}
