export type Direction = 'de_to_es' | 'es_to_de';

export interface Profile {
  id: string;
  name: string;
  direction: Direction;
  nativeLang: 'de' | 'es';
  targetLang: 'es' | 'de';
}

export const PROFILES: Profile[] = [
  { id: 'mattis', name: 'Mattis', direction: 'de_to_es', nativeLang: 'de', targetLang: 'es' },
  { id: 'marina', name: 'Marina', direction: 'es_to_de', nativeLang: 'es', targetLang: 'de' },
];

export function getProfile(id: string): Profile | null {
  return PROFILES.find(p => p.id === id) ?? null;
}

export const PROFILE_STORAGE_KEY = 'spanisch_profile';
