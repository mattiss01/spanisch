'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getVocab, updateVocabStatus, processVocabSession, batchUpdateVocabStatus } from '@/lib/storage';
import { VocabEntry, VocabStatus } from '@/lib/types';
import { VOCAB_CATALOG } from '@/lib/vocab-catalog';

type Tab = 'lernen' | 'wiederholen' | 'bekannt';
type Phase = 'idle' | 'loading' | 'input' | 'results';

interface SessionItem {
  de: string;
  es: string;
  example: string;
  vocabId?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

function isCorrect(user: string, correct: string): boolean {
  const u = norm(user);
  const c = norm(correct);
  return u.length > 0 && (u === c || c.startsWith(u) || u.startsWith(c));
}

export default function VokabelnPage() {
  const [tab, setTab] = useState<Tab>('lernen');
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<SessionItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [confidence, setConfidence] = useState<('sicher' | 'unsicher')[]>([]);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => setVocab(await getVocab()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const wiederholen = vocab.filter(v => !v.status || v.status === 'wiederholen');
  const bekannt = vocab.filter(v => v.status === 'bekannt');

  const seenWords = new Set(vocab.map(v => norm(v.word)));
  const unseenCount = VOCAB_CATALOG.filter(e => !seenWords.has(norm(e.es))).length;

  function reset() {
    setPhase('idle');
    setItems([]);
    setAnswers([]);
    setResults([]);
    setConfidence([]);
  }

  function switchTab(t: Tab) {
    setTab(t);
    reset();
  }

  function startLernen() {
    const unseen = VOCAB_CATALOG.filter(e => !seenWords.has(norm(e.es)));
    if (unseen.length === 0) {
      // all catalog words done — fall back to a random shuffle of all
      const all = shuffle(VOCAB_CATALOG).slice(0, 20);
      const sessionItems = all.map(e => ({ de: e.de, es: e.es, example: '' }));
      setItems(sessionItems);
      setAnswers(sessionItems.map(() => ''));
      setResults([]);
      setConfidence([]);
      setPhase('input');
      return;
    }
    const batch = unseen.slice(0, 20);
    const sessionItems = batch.map(e => ({ de: e.de, es: e.es, example: '' }));
    setItems(sessionItems);
    setAnswers(sessionItems.map(() => ''));
    setResults([]);
    setConfidence([]);
    setPhase('input');
  }

  function startWiederholen() {
    const wItems = wiederholen.slice(0, 20).map(v => ({
      de: v.translation,
      es: v.word,
      example: v.example ?? '',
      vocabId: v.id,
    }));
    setItems(wItems);
    setAnswers(wItems.map(() => ''));
    setResults([]);
    setPhase('input');
  }

  function submit() {
    const res = items.map((item, i) => isCorrect(answers[i], item.es));
    setResults(res);
    setConfidence(res.map(() => 'sicher')); // default: sicher — user marks uncertain ones
    setPhase('results');
  }

  async function saveResults(conf: ('sicher' | 'unsicher')[]) {
    const finalStatus = (i: number): VocabStatus =>
      results[i] && conf[i] === 'sicher' ? 'bekannt' : 'wiederholen';

    if (tab === 'lernen') {
      await processVocabSession(
        items.map((item, i) => ({
          word: item.es,
          translation: item.de,
          example: item.example,
          status: finalStatus(i),
        }))
      );
    } else {
      await batchUpdateVocabStatus(
        items
          .filter(item => item.vocabId)
          .map((item, i) => ({ id: item.vocabId!, correct: finalStatus(i) === 'bekannt' }))
      );
    }
    await refresh();
  }

  const correctCount = results.filter(Boolean).length;
  const bekanntFiltered = bekannt.filter(
    v =>
      !search ||
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vokabeln</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {bekannt.length} bekannt · {wiederholen.length} zu wiederholen
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{bekannt.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Bekannt</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-amber-500">{wiederholen.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Zu wiederholen</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(
            [
              ['lernen', 'Lernen'],
              ['wiederholen', wiederholen.length > 0 ? `Wiederholen (${wiederholen.length})` : 'Wiederholen'],
              ['bekannt', bekannt.length > 0 ? `Bekannt (${bekannt.length})` : 'Bekannt'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== LERNEN ===== */}
        {tab === 'lernen' && (
          <div className="space-y-4">
            {phase === 'idle' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Nächste 20 unbekannte Wörter aus dem Katalog.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {unseenCount > 0
                      ? `${unseenCount} von ${VOCAB_CATALOG.length} Wörtern noch nicht gesehen`
                      : `Alle ${VOCAB_CATALOG.length} Katalogwörter bereits gesehen`}
                  </p>
                  {VOCAB_CATALOG.length > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.round((bekannt.length / VOCAB_CATALOG.length) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={startLernen}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Lernrunde starten →
                </button>
              </div>
            )}



            {(phase === 'input' || phase === 'results') && (
              <SessionPanel
                items={items}
                answers={answers}
                results={results}
                confidence={confidence}
                phase={phase}
                correctCount={correctCount}
                onAnswerChange={(i, v) =>
                  setAnswers(prev => {
                    const n = [...prev];
                    n[i] = v;
                    return n;
                  })
                }
                onConfidenceChange={(i, v) =>
                  setConfidence(prev => {
                    const n = [...prev];
                    n[i] = v;
                    return n;
                  })
                }
                onSubmit={submit}
                onSave={saveResults}
                onReset={reset}
              />
            )}
          </div>
        )}

        {/* ===== WIEDERHOLEN ===== */}
        {tab === 'wiederholen' && (
          <div className="space-y-4">
            {phase === 'idle' &&
              (wiederholen.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-sm font-medium text-gray-500">Keine Wörter zu wiederholen!</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Mach eine Lernrunde, um neue Wörter zu üben.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <p className="text-sm text-gray-600">
                    Du hast <strong>{wiederholen.length}</strong> Wörter zum Wiederholen.
                    {wiederholen.length > 20 && ' Es werden die ersten 20 abgefragt.'}
                  </p>
                  <button
                    onClick={startWiederholen}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Wiederholungsrunde starten →
                  </button>
                </div>
              ))}

            {(phase === 'input' || phase === 'results') && (
              <SessionPanel
                items={items}
                answers={answers}
                results={results}
                confidence={confidence}
                phase={phase}
                correctCount={correctCount}
                onAnswerChange={(i, v) =>
                  setAnswers(prev => {
                    const n = [...prev];
                    n[i] = v;
                    return n;
                  })
                }
                onConfidenceChange={(i, v) =>
                  setConfidence(prev => {
                    const n = [...prev];
                    n[i] = v;
                    return n;
                  })
                }
                onSubmit={submit}
                onSave={saveResults}
                onReset={reset}
              />
            )}
          </div>
        )}

        {/* ===== BEKANNT ===== */}
        {tab === 'bekannt' && (
          <div className="space-y-3">
            {bekannt.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-sm text-gray-400">
                  Noch keine bekannten Wörter. Mach eine Lernrunde!
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Suchen…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none"
                />
                <p className="text-xs text-gray-400">{bekanntFiltered.length} Wörter</p>
                <div className="space-y-2">
                  {bekanntFiltered.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{entry.word}</p>
                        <p className="text-gray-500 text-sm">{entry.translation}</p>
                        {entry.example && (
                          <p className="text-gray-400 text-xs mt-0.5 italic">„{entry.example}"</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await updateVocabStatus(entry.id, false);
                          await refresh();
                        }}
                        title="Zurück in Wiederholen"
                        className="text-gray-300 hover:text-amber-500 transition-colors text-lg shrink-0"
                      >
                        ↩
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

interface SessionPanelProps {
  items: SessionItem[];
  answers: string[];
  results: boolean[];
  confidence: ('sicher' | 'unsicher')[];
  phase: Phase;
  correctCount: number;
  onAnswerChange: (index: number, value: string) => void;
  onConfidenceChange: (index: number, value: 'sicher' | 'unsicher') => void;
  onSubmit: () => void;
  onSave: (confidence: ('sicher' | 'unsicher')[]) => Promise<void>;
  onReset: () => void;
}

function SessionPanel({
  items,
  answers,
  results,
  confidence,
  phase,
  correctCount,
  onAnswerChange,
  onConfidenceChange,
  onSubmit,
  onSave,
  onReset,
}: SessionPanelProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const allFilled = answers.every(a => a.trim().length > 0);

  const unsicherCount = confidence.filter((c, i) => results[i] && c === 'unsicher').length;
  const toRepeat = results.filter(r => !r).length + unsicherCount;
  const toKeep = correctCount - unsicherCount;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="space-y-4">
      {phase === 'results' && (
        <div
          className={`p-4 rounded-xl font-semibold ${
            correctCount === items.length
              ? 'bg-green-100 text-green-800'
              : correctCount >= Math.ceil(items.length * 0.7)
              ? 'bg-amber-50 text-amber-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          <p className="text-center text-lg">
            {correctCount}/{items.length} richtig
            {correctCount === items.length && ' 🎉'}
          </p>
          <p className="text-center text-xs font-normal mt-1 opacity-70">
            {toKeep} bekannt · {toRepeat} zu wiederholen
          </p>
          <p className="text-center text-xs font-normal mt-2 opacity-60">
            Richtige Antworten: Klick auf <strong>Unsicher</strong> wenn du das Wort nochmal üben möchtest.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items.map((item, i) => {
          const ok = results[i] === true;
          const wrong = phase === 'results' && results[i] === false;
          const conf = confidence[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-50 last:border-b-0 ${
                phase === 'results'
                  ? ok && conf === 'unsicher'
                    ? 'bg-amber-50'
                    : ok
                    ? 'bg-green-50'
                    : wrong
                    ? 'bg-red-50'
                    : ''
                  : ''
              }`}
            >
              <span className="text-xs text-gray-400 w-4 shrink-0 tabular-nums">{i + 1}.</span>
              <span className="text-xs font-medium text-gray-700 w-28 shrink-0 leading-tight">{item.de}</span>
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                value={answers[i]}
                disabled={phase === 'results'}
                onChange={e => onAnswerChange(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (i < items.length - 1) inputRefs.current[i + 1]?.focus();
                    else if (allFilled) onSubmit();
                  }
                }}
                placeholder="Spanisch…"
                className={`flex-1 min-w-0 border-b bg-transparent text-sm py-0.5 outline-none transition-colors disabled:opacity-100 ${
                  phase === 'results' && ok && conf === 'unsicher'
                    ? 'border-amber-400 text-amber-700'
                    : ok
                    ? 'border-green-400 text-green-700'
                    : wrong
                    ? 'border-red-400 text-red-600'
                    : 'border-gray-300 focus:border-red-600 text-gray-900'
                }`}
              />

              {/* Wrong: show correct answer */}
              {wrong && (
                <span className="text-xs text-green-700 font-semibold shrink-0">{item.es}</span>
              )}

              {/* Correct: confidence buttons */}
              {phase === 'results' && ok && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onConfidenceChange(i, 'unsicher')}
                    className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                      conf === 'unsicher'
                        ? 'bg-amber-400 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700'
                    }`}
                  >
                    Unsicher
                  </button>
                  <button
                    onClick={() => onConfidenceChange(i, 'sicher')}
                    className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                      conf === 'sicher'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    Sicher
                  </button>
                </div>
              )}

              {/* Wrong badge */}
              {wrong && (
                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                  ↩
                </span>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'input' ? (
        <button
          onClick={onSubmit}
          disabled={!allFilled}
          className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors"
        >
          Überprüfen
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Speichern & Fertig
          </button>
          <button
            onClick={async () => { await onSave(confidence); onReset(); }}
            className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm transition-colors"
          >
            Neue Runde →
          </button>
        </div>
      )}
    </div>
  );
}
