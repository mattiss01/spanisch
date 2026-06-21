'use client';

import { useRouter } from 'next/navigation';
import { PROFILES } from '@/lib/profiles';
import { useProfile } from '@/lib/use-profile';
import { useStars } from '@/lib/use-stars';
import { formatStars } from '@/lib/race';

export default function ProfilePage() {
  const { setProfile } = useProfile();
  const stars = useStars();
  const router = useRouter();

  function select(id: string) {
    setProfile(id);
    router.push('/vokabeln');
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🌍</p>
          <h1 className="text-2xl font-bold text-gray-900">Who are you?</h1>
          <p className="text-sm text-gray-400 mt-1">Choose your profile to continue.</p>
        </div>
        <div className="space-y-3">
          {PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className="w-full bg-white border-2 border-gray-100 hover:border-red-300 rounded-2xl p-5 text-left transition-colors shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg">{p.name + formatStars(stars[p.id] ?? 0)}</p>
                {p.level === 'A1' && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-700">
                    Anfänger
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {p.direction === 'de_to_es' ? '🇩🇪 → 🇪🇸 Learning Spanish' : '🇪🇸 → 🇩🇪 Learning German'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
