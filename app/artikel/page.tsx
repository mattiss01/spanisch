'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getArticleRecords,
  recordExercise,
  getGeneratedTopics,
  addGeneratedTopic,
  deleteGeneratedTopic,
} from '@/lib/storage';
import { ArticleRecord, ArticleExercise as ArticleExerciseType, ArticleTopic } from '@/lib/types';
import ArticleExercise from '@/components/exercises/ArticleExercise';
import { ARTICLE_CATALOG, ARTICLE_FOCUS, buildArticleExercise } from '@/lib/article-catalog';
import { useProfile } from '@/lib/use-profile';

type Tab = 'aprender' | 'temas' | 'errores';
type Sort = 'alpha' | 'accuracy' | 'recent';

const LEVELS = ['A1', 'A2', 'B1'] as const;

function accuracyOf(r: ArticleRecord): number {
  return r.totalQuestions > 0 ? r.totalCorrect / r.totalQuestions : 0;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (h < 24) return `hace ${h} h`;
  return `hace ${d} día${d === 1 ? '' : 's'}`;
}

function TotalBar({ record }: { record: ArticleRecord }) {
  const pct = record.totalQuestions > 0 ? Math.round((record.totalCorrect / record.totalQuestions) * 100) : 0;
  const color = pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function ArtikelPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  const [records, setRecords] = useState<ArticleRecord[]>([]);
  const [genTopics, setGenTopics] = useState<ArticleTopic[]>([]);
  const [tab, setTab] = useState<Tab>('aprender');
  const [practicing, setPracticing] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ArticleExerciseType | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>('recent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Generation panel state
  const [focusId, setFocusId] = useState<string>(ARTICLE_FOCUS[0].id);
  const [theme, setTheme] = useState('');
  const [level, setLevel] = useState<string>('A2');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [draft, setDraft] = useState<ArticleTopic | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !profile) router.push('/profile');
  }, [ready, profile, router]);

  const refresh = useCallback(async () => {
    const [recs, topics] = await Promise.all([getArticleRecords(), getGeneratedTopics()]);
    setRecords(recs);
    setGenTopics(topics);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  if (!ready || !profile) {
    return (
      <main className="md:ml-56 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando…</p>
      </main>
    );
  }

  const allTopics: ArticleTopic[] = [...ARTICLE_CATALOG, ...genTopics];
  const topicById = new Map(allTopics.map(t => [t.id, t]));
  const recordById = new Map(records.map(r => [r.id, r]));
  const withMistakes = records.filter(r => r.recentMistakes.length > 0);
  const mastered = records.filter(r => r.mastered).length;

  const displayed = [...(tab === 'errores' ? withMistakes : records)].sort((a, b) => {
    let cmp: number;
    if (sort === 'alpha') cmp = a.topic.localeCompare(b.topic);
    else if (sort === 'accuracy') cmp = accuracyOf(a) - accuracyOf(b);
    else cmp = new Date(a.lastAttempted).getTime() - new Date(b.lastAttempted).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function practiceTopic(topicId: string) {
    if (practicing === topicId) {
      setPracticing(null);
      setExercise(null);
      return;
    }
    const topic = topicById.get(topicId);
    if (!topic) return;
    setPracticing(topicId);
    setExercise(buildArticleExercise(topic));
  }

  async function handleComplete(correct: number, total: number) {
    await recordExercise('article', correct, total);
    await refresh();
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function generate() {
    setGenerating(true);
    setGenError('');
    setDraft(null);
    try {
      const res = await fetch('/api/article-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusId, theme: theme.trim() || undefined, level }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setGenError(data.error ?? 'No se pudo generar. Inténtalo de nuevo.');
      } else {
        setDraft({ id: 'draft', generated: true, ...data } as ArticleTopic);
      }
    } catch {
      setGenError('Error de conexión.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const topic: ArticleTopic = { ...draft, id: `gen-${Date.now()}`, generated: true };
      await addGeneratedTopic(topic);
      await refresh();
      setDraft(null);
    } catch {
      setGenError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function removeTopic(id: string) {
    if (practicing === id) { setPracticing(null); setExercise(null); }
    await deleteGeneratedTopic(id);
    await refresh();
  }

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Artículos y pronombres alemanes en su caso correcto</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-800">{records.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Temas practicados</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-green-600">{mastered}</p>
            <p className="text-xs text-gray-400 mt-0.5">Dominados</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-red-600">{withMistakes.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Con errores</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            ['aprender', 'Aprender'],
            ['temas', 'Temas'],
            ['errores', 'Errores'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setPracticing(null); setExercise(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {id === 'errores' && withMistakes.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {withMistakes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Aprender tab ── */}
        {tab === 'aprender' && (
          <div className="space-y-3">
            {/* Topic list (catalog + saved generated) */}
            {allTopics.map(topic => {
              const rec = recordById.get(topic.id);
              const isPracticing = practicing === topic.id;
              return (
                <div
                  key={topic.id}
                  className={`bg-white rounded-xl border-2 shadow-sm transition-colors ${
                    isPracticing ? 'border-red-300' : 'border-gray-100'
                  }`}
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{topic.title_es}</span>
                          {topic.generated && (
                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md font-medium">IA</span>
                          )}
                          {rec?.mastered && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{topic.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {topic.generated && (
                          <button
                            onClick={() => removeTopic(topic.id)}
                            className="text-sm text-gray-300 hover:text-red-500 transition-colors"
                            title="Eliminar tema"
                          >
                            🗑
                          </button>
                        )}
                        <button
                          onClick={() => practiceTopic(topic.id)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            isPracticing ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isPracticing ? 'Cerrar' : rec ? 'Repasar' : 'Empezar'}
                        </button>
                      </div>
                    </div>
                    {rec && <TotalBar record={rec} />}
                  </div>
                  {isPracticing && exercise && (
                    <div className="border-t border-gray-100 p-4">
                      <ArticleExercise exercise={exercise} onComplete={handleComplete} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Generation panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <p className="font-semibold text-gray-800 text-sm">Generar ejercicios con IA</p>
              </div>

              <label className="block">
                <span className="text-xs text-gray-400">Enfoque gramatical</span>
                <select
                  value={focusId}
                  onChange={e => setFocusId(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-red-400 outline-none"
                >
                  {ARTICLE_FOCUS.map(f => (
                    <option key={f.id} value={f.id}>{f.label_es}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-400">Tema (opcional)</span>
                <input
                  type="text"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  placeholder="p. ej. im Restaurant, Reisen, Familie…"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-400 outline-none"
                />
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Nivel</span>
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      level === l ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <button
                onClick={generate}
                disabled={generating}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {generating ? 'Generando…' : draft ? 'Generar otro' : 'Generar'}
              </button>

              {genError && <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">{genError}</div>}

              {draft && !generating && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-xs text-amber-600">
                    Revisa el ejercicio (la IA puede equivocarse) y luego guárdalo o descártalo.
                  </p>
                  <ArticleExercise exercise={buildArticleExercise(draft)} persist={false} onComplete={handleComplete} />
                  <div className="flex gap-2">
                    <button
                      onClick={saveDraft}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {saving ? 'Guardando…' : 'Guardar tema'}
                    </button>
                    <button
                      onClick={() => setDraft(null)}
                      className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty states for Temas / Errores */}
        {tab !== 'aprender' && displayed.length === 0 && (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">{tab === 'errores' ? '🎉' : '📝'}</p>
            <p className="text-sm text-gray-500 font-medium">
              {tab === 'errores' ? 'Sin errores: ¡todo dominado!' : 'Aún no has practicado ningún tema.'}
            </p>
          </div>
        )}

        {/* Sort controls */}
        {tab !== 'aprender' && displayed.length > 0 && (
          <div className="flex items-center justify-end gap-1">
            {([
              ['alpha', 'A–Z'],
              ['accuracy', 'Precisión'],
              ['recent', 'Reciente'],
            ] as [Sort, string][]).map(([id, label]) => {
              const active = sort === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (active) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                    else { setSort(id); setSortDir(id === 'alpha' ? 'asc' : 'desc'); }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    active ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Topic cards (Temas / Errores) */}
        {tab !== 'aprender' && (
          <div className="space-y-3">
            {displayed.map(record => {
              const isPracticing = practicing === record.id;
              const isExpanded = expanded.has(record.id);
              const pct = Math.round(accuracyOf(record) * 100);
              const resolvable = topicById.has(record.id);
              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-xl border-2 shadow-sm transition-colors ${
                    isPracticing ? 'border-red-300' : 'border-gray-100'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{record.topic_es}</span>
                          {record.mastered ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">
                              ✓ Dominado
                            </span>
                          ) : record.recentMistakes.length > 0 ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-medium">
                              ⚠ {record.recentMistakes.length} {record.recentMistakes.length === 1 ? 'error' : 'errores'}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {record.topic} · {record.totalAttempts}× · {timeAgo(record.lastAttempted)}
                        </p>
                      </div>
                      {resolvable && (
                        <button
                          onClick={() => practiceTopic(record.id)}
                          className={`shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            isPracticing ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isPracticing ? 'Cerrar' : 'Repasar'}
                        </button>
                      )}
                    </div>

                    <TotalBar record={record} />

                    {record.recentMistakes.length > 0 && (
                      <>
                        <button
                          onClick={() => toggleExpand(record.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? 'Ocultar errores ▲' : `Ver ${record.recentMistakes.length} errores ▼`}
                        </button>
                        {isExpanded && (
                          <div className="space-y-1 pt-1">
                            {record.recentMistakes.map((m, i) => (
                              <div key={i} className="text-xs">
                                <span className="text-gray-500">{m.prompt}</span>
                                <span className="ml-2 text-red-400 line-through">{m.userAnswer || '–'}</span>
                                <span className="text-gray-300 mx-1">→</span>
                                <span className="text-green-700 font-medium">{m.correct}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {record.recentMistakes.length === 0 && (
                      <p className="text-xs text-gray-400">Precisión {pct}%</p>
                    )}
                  </div>

                  {isPracticing && exercise && (
                    <div className="border-t border-gray-100 p-4">
                      <ArticleExercise exercise={exercise} onComplete={handleComplete} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
