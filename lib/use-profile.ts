'use client';

import { useState, useEffect } from 'react';
import { Profile, getProfile, PROFILE_STORAGE_KEY } from './profiles';

const PROFILE_EVENT = 'spanisch-profile-changed';

export function useProfile() {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(PROFILE_STORAGE_KEY);
    setProfileState(id ? getProfile(id) : null);
    setReady(true);

    function sync() {
      const newId = localStorage.getItem(PROFILE_STORAGE_KEY);
      setProfileState(newId ? getProfile(newId) : null);
    }

    window.addEventListener(PROFILE_EVENT, sync);
    return () => window.removeEventListener(PROFILE_EVENT, sync);
  }, []);

  function setProfile(id: string) {
    localStorage.setItem(PROFILE_STORAGE_KEY, id);
    setProfileState(getProfile(id));
    window.dispatchEvent(new Event(PROFILE_EVENT));
  }

  function clearProfile() {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfileState(null);
    window.dispatchEvent(new Event(PROFILE_EVENT));
  }

  return { profile, setProfile, clearProfile, ready };
}
