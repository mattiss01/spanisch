export type Direction = 'de_to_es' | 'es_to_de';

export type Level = 'A1' | 'B1';

export interface Profile {
  id: string;
  name: string;
  direction: Direction;
  nativeLang: 'de' | 'es';
  targetLang: 'es' | 'de';
  level?: Level; // absent ⇒ treat as 'B1' (existing learners)
}

export const PROFILES: Profile[] = [
  { id: 'mattis', name: 'Mattis', direction: 'de_to_es', nativeLang: 'de', targetLang: 'es' },
  { id: 'marina', name: 'Marina', direction: 'es_to_de', nativeLang: 'es', targetLang: 'de' },
  { id: 'emmi', name: 'Emmi', direction: 'de_to_es', nativeLang: 'de', targetLang: 'es', level: 'A1' },
  { id: 'jakob', name: 'Jakob', direction: 'de_to_es', nativeLang: 'de', targetLang: 'es' },
  { id: 'robert', name: 'Robert', direction: 'de_to_es', nativeLang: 'de', targetLang: 'es' },
];

export function getProfile(id: string): Profile | null {
  return PROFILES.find(p => p.id === id) ?? null;
}

// True beginner (A1): gets the starter vocab path, present-tense-only verbs,
// and the Grundlagen lessons. Everyone else is treated as B1.
export function isBeginner(p: Profile | null): boolean {
  return p?.level === 'A1';
}

export const PROFILE_STORAGE_KEY = 'spanisch_profile';
