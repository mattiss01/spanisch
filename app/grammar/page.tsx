'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GRAMMAR_LESSONS } from '@/lib/grammar-lessons';
import { useProfile } from '@/lib/use-profile';
import { isBeginner } from '@/lib/profiles';

export default function GrammarPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  // First lesson open by default; the rest collapsed.
  const [open, setOpen] = useState<Set<string>>(new Set([GRAMMAR_LESSONS[0]?.id]));

  useEffect(() => {
    if (!ready) return;
    if (!profile) router.push('/profile');
    // Grundlagen is a beginner-only space; send everyone else back to Vocabulary.
    else if (!isBeginner(profile)) router.push('/vokabeln');
  }, [ready, profile, router]);

  if (!ready || !profile || !isBeginner(profile)) {
    return (
      <main className="md:ml-56 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grundlagen</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Die ersten Schritte auf Spanisch – kurz erklärt.
          </p>
        </div>

        {GRAMMAR_LESSONS.map(lesson => {
          const isOpen = open.has(lesson.id);
          return (
            <section
              key={lesson.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggle(lesson.id)}
                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{lesson.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-bold text-gray-900 text-base">{lesson.title}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{lesson.intro}</span>
                  </span>
                </span>
                <span className={`text-gray-300 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
                  {lesson.sections.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {s.heading}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                      {s.examples && s.examples.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {s.examples.map((ex, j) => (
                            <div
                              key={j}
                              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 bg-gray-50 rounded-lg px-3 py-2"
                            >
                              <span className="font-semibold text-gray-900 text-sm">{ex.es}</span>
                              <span className="text-gray-300 text-sm">→</span>
                              <span className="text-gray-500 text-sm">{ex.de}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
