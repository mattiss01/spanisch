'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/lib/use-profile';
import { useStars } from '@/lib/use-stars';
import { formatStars } from '@/lib/race';

const nav = [
  { href: '/vokabeln', label: 'Vocabulary', icon: '📖' },
  { href: '/saetze', label: 'Sentences', icon: '✍️' },
  { href: '/konjugation', label: 'Verbs', icon: '🔤' },
  // Global competitive leaderboard — everyone sees the same standings.
  { href: '/race', label: 'The Race', icon: '🏁' },
  { href: '/erfolge', label: 'Achievements', icon: '🏆' },
  // German declension practice — only relevant for Spanish→German learners (Marina).
  { href: '/artikel', label: 'Artikel', icon: '🇩🇪', onlyDirection: 'es_to_de' as const },
  // Grammar first-steps — only for true beginners (A1).
  { href: '/grammar', label: 'Grundlagen', icon: '📘', onlyLevel: 'A1' as const },
  { href: '/help', label: 'Help', icon: '❓' },
];

export default function Navigation() {
  const path = usePathname();
  const { profile } = useProfile();
  const stars = useStars();
  const myStars = profile ? formatStars(stars[profile.id] ?? 0) : '';
  const [moreOpen, setMoreOpen] = useState(false);

  const flag = profile?.direction === 'es_to_de' ? '🇩🇪' : '🇪🇸';
  const subtitle = profile?.direction === 'es_to_de' ? 'Spanish → German' : 'German → Spanish';

  const items = nav.filter(
    n =>
      (!('onlyDirection' in n) || n.onlyDirection === profile?.direction) &&
      (!('onlyLevel' in n) || n.onlyLevel === profile?.level)
  );

  // Mobile: keep the core practice/engagement tabs visible; tuck the rest behind "More".
  const primary = items.slice(0, 4);
  const overflow = items.slice(4);
  const moreActive =
    overflow.some(o => path.startsWith(o.href)) || path.startsWith('/profile');

  // Close the "More" sheet on Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 z-50">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{flag}</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">
                {profile ? profile.name + myStars : 'Language Learning'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {items.map(({ href, label, icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/profile"
            className="block text-xs text-gray-400 hover:text-gray-600 text-center transition-colors"
          >
            Switch Profile
          </Link>
        </div>
      </aside>

      {/* ── Mobile "More" sheet ── */}
      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMoreOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl border-t border-gray-100 shadow-2xl safe-area-inset-bottom">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-200" />
            <div className="p-2 pb-3">
              {overflow.map(({ href, label, icon }) => {
                const active = path.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/profile"
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  path.startsWith('/profile') ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">👤</span>
                {profile ? profile.name + myStars : 'Profile'}
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex safe-area-inset-bottom">
        {primary.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                active ? 'text-red-700' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(o => !o)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
            moreActive || moreOpen ? 'text-red-700' : 'text-gray-400'
          }`}
        >
          <span className="text-xl">☰</span>
          More
        </button>
      </nav>
    </>
  );
}
