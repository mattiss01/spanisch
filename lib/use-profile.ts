'use client';

import { useState, useEffect } from 'react';
import { Profile, getProfile, PROFILE_STORAGE_KEY } from './profiles';

export function useProfile() {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(PROFILE_STORAGE_KEY);
    setProfileState(id ? getProfile(id) : null);
    setReady(true);
  }, []);

  function setProfile(id: string) {
    localStorage.setItem(PROFILE_STORAGE_KEY, id);
    setProfileState(getProfile(id));
  }

  function clearProfile() {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfileState(null);
  }

  return { profile, setProfile, clearProfile, ready };
}
