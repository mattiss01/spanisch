'use client';

import { useState, useEffect } from 'react';
import { getStars } from './storage';

// App-wide ⭐ counts (months won) per user id. Fetched once on mount; the race
// resets monthly so this rarely changes within a session.
export function useStars(): Record<string, number> {
  const [stars, setStars] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    getStars().then(r => {
      if (alive) setStars(r.stars);
    });
    return () => {
      alive = false;
    };
  }, []);

  return stars;
}
