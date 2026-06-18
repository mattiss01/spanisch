'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/lib/use-profile';

const nav = [
  { href: '/vokabeln', label: 'Vocabulary', icon: '📖' },
  { href: '/konjugation', label: 'Verbs', icon: '🔤' },
  // Global competitive leaderboard — everyone sees the same standings.
  { href: '/race', label: 'The Race', icon: '🏁' },
  // German declension practice — only relevant for Spanish→German learners (Marina).
  { href: '/artikel', label: 'Artikel', icon: '🇩🇪', onlyDirection: 'es_to_de' as const },
  // Grammar first-steps — only for true beginners (A1).
  { href: '/grammar', label: 'Grundlagen', icon: '📘', onlyLevel: 'A1' as const },
  { href: '/help', label: 'Help', icon: '❓' },
];

export default function Navigation() {
  const path = usePathname();
  const { profile } = useProfile();

  const flag = profile?.direction === 'es_to_de' ? '🇩🇪' : '🇪🇸';
  const subtitle = profile?.direction === 'es_to_de' ? 'Spanish → German' : 'German → Spanish';

  const items = nav.filter(
    n =>
      (!('onlyDirection' in n) || n.onlyDirection === profile?.direction) &&
      (!('onlyLevel' in n) || n.onlyLevel === profile?.level)
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 z-50">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{flag}</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">
                {profile ? profile.name : 'Language Learning'}
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

      {/* ── Mobile bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex safe-area-inset-bottom">
        {items.map(({ href, label, icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                active ? 'text-red-700' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}
        <Link
          href="/profile"
          className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium text-gray-400"
        >
          <span className="text-xl">👤</span>
          {profile ? profile.name : 'Profile'}
        </Link>
      </nav>
    </>
  );
}
