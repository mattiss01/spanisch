'use client';

import { useState, useEffect } from 'react';
import { getVocab, removeVocabEntry, addVocabEntry, updateVocabReview } from '@/lib/storage';
import { VocabEntry } from '@/lib/types';

type View = 'list' | 'flashcard' | 'add';

export default function Vokabeln() {
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', translation: '', example: '', topic: '' });

  useEffect(() => {
    setVocab(getVocab());
  }, []);

  function refresh() {
    setVocab(getVocab());
  }

  function deleteWord(id: string) {
    removeVocabEntry(id);
    refresh();
  }

  function addWord() {
    if (!newWord.word.trim() || !newWord.translation.trim()) return;
    addVocabEntry(newWord);
    setNewWord({ word: '', translation: '', example: '', topic: '' });
    refresh();
    setView('list');
  }

  function nextCard() {
    setFlipped(false);
    setCardIndex(i => (i + 1) % filtered.length);
  }

  function prevCard() {
    setFlipped(false);
    setCardIndex(i => (i - 1 + filtered.length) % filtered.length);
  }

  function markReviewed() {
    updateVocabReview(filtered[cardIndex].id);
    refresh();
    nextCard();
  }

  const filtered = vocab.filter(
    e =>
      !search ||
      e.word.toLowerCase().includes(search.toLowerCase()) ||
      e.translation.toLowerCase().includes(search.toLowerCase())
  );

  const card = filtered[cardIndex];

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vokabeln</h1>
            <p className="text-gray-400 text-sm mt-0.5">{vocab.length} Wörter gespeichert</p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['list', 'flashcard', 'add'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setCardIndex(0); setFlipped(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'list' && '📋 Liste'}
              {v === 'flashcard' && '🃏 Karten'}
              {v === 'add' && '+ Hinzufügen'}
            </button>
          ))}
        </div>

        {/* List view */}
        {view === 'list' && (
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suchen..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400"
            />

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-300">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm text-gray-400">
                  {vocab.length === 0
                    ? 'Noch keine Vokabeln gespeichert. Generiere eine Vokabelübung und speichere Wörter!'
                    : 'Keine Treffer für deine Suche.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{entry.word}</p>
                        {entry.topic && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                            {entry.topic}
                          </span>
                        )}
                        {entry.reviewCount > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            {entry.reviewCount}× gelernt
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-0.5">{entry.translation}</p>
                      {entry.example && (
                        <p className="text-gray-400 text-xs mt-1 italic">„{entry.example}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWord(entry.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors text-lg shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flashcard view */}
        {view === 'flashcard' && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🃏</p>
                <p className="text-sm">Keine Vokabeln zum Üben. Füge zuerst Wörter hinzu.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 text-center">
                  {cardIndex + 1} / {filtered.length}
                </p>
                <div
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center cursor-pointer min-h-48 flex flex-col items-center justify-center gap-4 select-none hover:shadow-md transition-shadow"
                  onClick={() => setFlipped(v => !v)}
                >
                  {!flipped ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{card.word}</p>
                      {card.topic && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                          {card.topic}
                        </span>
                      )}
                      <p className="text-xs text-gray-300 mt-2">Tippen zum Aufdecken</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-green-700">{card.translation}</p>
                      {card.example && (
                        <p className="text-sm text-gray-500 italic max-w-xs">„{card.example}"</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevCard}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    ← Zurück
                  </button>
                  {flipped && (
                    <button
                      onClick={markReviewed}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      ✓ Gewusst
                    </button>
                  )}
                  <button
                    onClick={nextCard}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Weiter →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add word view */}
        {view === 'add' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Vokabel hinzufügen</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                  Spanisches Wort *
                </label>
                <input
                  type="text"
                  value={newWord.word}
                  onChange={e => setNewWord(p => ({ ...p, word: e.target.value }))}
                  placeholder="z.B. el viaje"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                  Deutsche Übersetzung *
                </label>
                <input
                  type="text"
                  value={newWord.translation}
                  onChange={e => setNewWord(p => ({ ...p, translation: e.target.value }))}
                  placeholder="z.B. die Reise"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                  Beispielsatz (optional)
                </label>
                <input
                  type="text"
                  value={newWord.example}
                  onChange={e => setNewWord(p => ({ ...p, example: e.target.value }))}
                  placeholder="z.B. El viaje fue increíble."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                  Thema (optional)
                </label>
                <input
                  type="text"
                  value={newWord.topic}
                  onChange={e => setNewWord(p => ({ ...p, topic: e.target.value }))}
                  placeholder="z.B. Reisen"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-400"
                />
              </div>
            </div>
            <button
              onClick={addWord}
              disabled={!newWord.word.trim() || !newWord.translation.trim()}
              className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium transition-colors"
            >
              Hinzufügen
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
