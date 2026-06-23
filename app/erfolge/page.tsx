'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadVocabStrict,
  getStats,
  getRace,
  getSentenceProgress,
  getConjugationRecords,
} from '@/lib/storage';
import { VocabEntry, ProgressStats, RaceResponse } from '@/lib/types';
import { computeBadges } from '@/lib/achievements';
import { useProfile } from '@/lib/use-profile';
import Achievements from '@/components/Achievements';
import Celebration from '@/components/Celebration';

function levelOf(v: VocabEntry): number {
  if (v.level !== undefined) return v.level;
  return v.status === 'bekannt' ? 5 : 1;
}

export default function ErfolgePage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [race, setRace] = useState<RaceResponse | null>(null);
  const [sentencesDone, setSentencesDone] = useState(0);
  const [verbsDone, setVerbsDone] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const seeded = useRef(false);

  useEffect(() => {
    if (ready && !profile) router.push('/profile');
  }, [ready, profile, router]);

  const refresh = useCallback(async () => {
    const [v, s, r, sent, verbs] = await Promise.all([
      loadVocabStrict().catch(() => [] as VocabEntry[]),
      getStats().catch(() => null),
      getRace().catch(() => null),
      getSentenceProgress().catch(() => []),
      getConjugationRecords().catch(() => []),
    ]);
    setVocab(v);
    setStats(s);
    setRace(r);
    setSentencesDone(sent.length);
    setVerbsDone(verbs.length);
    setLoaded(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // Detect newly-unlocked badges once data is loaded (vs. acknowledged set).
  useEffect(() => {
    if (!loaded || seeded.current || !profile || typeof localStorage === 'undefined') return;
    seeded.current = true;
    const bestDay = stats?.daily ? Math.max(0, ...Object.values(stats.daily)) : 0;
    const ids = computeBadges({
      wordsKnown: vocab.filter(v => levelOf(v) === 5).length,
      wordsStarted: vocab.length,
      streak: stats?.streak ?? 0,
      stars: race?.stars?.[profile.id] ?? 0,
      sentencesDone,
      verbsDone,
      bestDay,
      lifetimeCards: stats?.totalAnswers ?? 0,
      inTop5: !!race?.highscores.some(h => h.name === profile.name),
    }).filter(b => b.unlocked).map(b => b.id);
    const k = `spanisch_badges2_${profile.id}`;
    const raw = localStorage.getItem(k);
    if (raw === null) {
      localStorage.setItem(k, JSON.stringify(ids)); // first visit: seed silently
      return;
    }
    const acked = new Set(JSON.parse(raw) as string[]);
    const fresh = ids.filter(id => !acked.has(id));
    if (fresh.length > 0) {
      localStorage.setItem(k, JSON.stringify(ids));
      setNewIds(new Set(fresh));
      setCelebration(fresh.length === 1 ? 'Achievement unlocked! 🏆' : `${fresh.length} achievements unlocked! 🏆`);
    }
  }, [loaded, profile, vocab, stats, race, sentencesDone, verbsDone]);

  if (!ready || !profile) {
    return (
      <main className="md:ml-56 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  const bestDay = stats?.daily ? Math.max(0, ...Object.values(stats.daily)) : 0;
  const badges = computeBadges({
    wordsKnown: vocab.filter(v => levelOf(v) === 5).length,
    wordsStarted: vocab.length,
    streak: stats?.streak ?? 0,
    stars: race?.stars?.[profile.id] ?? 0,
    sentencesDone,
    verbsDone,
    bestDay,
    lifetimeCards: stats?.totalAnswers ?? 0,
    inTop5: !!race?.highscores.some(h => h.name === profile.name),
  });
  const unlocked = badges.filter(b => b.unlocked);

  // Detect newly-unlocked badges once data is loaded (vs. acknowledged set).
  useEffect(() => {
    if (!loaded || seeded.current || typeof localStorage === 'undefined') return;
    seeded.current = true;
    const k = `spanisch_badges2_${profile.id}`;
    const ids = unlocked.map(b => b.id);
    const raw = localStorage.getItem(k);
    if (raw === null) {
      localStorage.setItem(k, JSON.stringify(ids)); // first visit: seed silently
      return;
    }
    const acked = new Set(JSON.parse(raw) as string[]);
    const fresh = ids.filter(id => !acked.has(id));
    if (fresh.length > 0) {
      localStorage.setItem(k, JSON.stringify(ids));
      setNewIds(new Set(fresh));
      setCelebration(fresh.length === 1 ? 'Achievement unlocked! 🏆' : `${fresh.length} achievements unlocked! 🏆`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏆</span> Achievements
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {unlocked.length} of {badges.length} unlocked. Keep learning to earn more!
          </p>
        </div>

        {!loaded ? (
          <p className="text-gray-400 text-sm text-center py-6">Loading…</p>
        ) : (
          <Achievements badges={badges} newIds={newIds} />
        )}
      </div>

      <Celebration message={celebration} onDone={() => setCelebration(null)} />
    </main>
  );
}
