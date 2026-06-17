'use client';

import { useRouter } from 'next/navigation';
import { PROFILES } from '@/lib/profiles';
import { useProfile } from '@/lib/use-profile';

export default function ProfilePage() {
  const { setProfile } = useProfile();
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
          <h1 className="text-2xl font-bold text-gray-900">Wer bist du?</h1>
          <p className="text-sm text-gray-400 mt-1">Wähle dein Profil um fortzufahren.</p>
        </div>
        <div className="space-y-3">
          {PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className="w-full bg-white border-2 border-gray-100 hover:border-red-300 rounded-2xl p-5 text-left transition-colors shadow-sm hover:shadow-md"
            >
              <p className="font-bold text-gray-900 text-lg">{p.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {p.direction === 'de_to_es' ? '🇩🇪 → 🇪🇸 Spanisch lernen' : '🇪🇸 → 🇩🇪 Deutsch lernen'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
