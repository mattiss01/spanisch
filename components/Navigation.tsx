'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/uebungen', label: 'Übungen', icon: '✏️' },
  { href: '/lernplan', label: 'Lernplan', icon: '📚' },
  { href: '/vokabeln', label: 'Vokabeln', icon: '📖' },
];

export default function Navigation() {
  const path = usePathname();

  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 z-50">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🇪🇸</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Spanisch</p>
              <p className="text-xs text-gray-400 mt-0.5">Nivel B1 → B2</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ href, label, icon }) => {
            const active = href === '/' ? path === '/' : path.startsWith(href);
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
          <p className="text-xs text-gray-300 text-center">Powered by Groq</p>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex safe-area-inset-bottom">
        {nav.map(({ href, label, icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
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
      </nav>
    </>
  );
}
