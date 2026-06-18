'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRace } from '@/lib/storage';
import { RaceResponse } from '@/lib/types';

const REFRESH_MS = 20000;

// Distinct car colors per racer (by sorted index).
const CAR_COLORS = ['🔴', '🔵', '🟢', '🟡', '🟣'];
const TRACK_TINTS = [
  'bg-red-50',
  'bg-blue-50',
  'bg-green-50',
  'bg-amber-50',
  'bg-purple-50',
];

function fmtPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function RacePage() {
  const [race, setRace] = useState<RaceResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setRace(await getRace());
    setLoaded(true);
  }, []);

  // Live: refresh on mount, on focus, and on an interval while the tab is open.
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
  }, [refresh]);

  if (!loaded || !race) {
    return (
      <main className="md:ml-56 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  const { goal, racers, winnerId } = race;
  const winner = racers.find(r => r.id === winnerId);
  // "Today so far" ordered by today's count (most active first), only those active.
  const todayActive = [...racers]
    .filter(r => r.todayCount > 0)
    .sort((a, b) => b.todayCount - a.todayCount);
  const maxToday = Math.max(1, ...todayActive.map(r => r.todayCount));

  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏁</span> THE RACE
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            First to {goal} points wins. Most words learned each day scores 5 · 4 · 3 · 2 · 1.
          </p>
        </div>

        {winner && (
          <div className="bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-amber-800">{winner.name} wins the race!</p>
            <p className="text-xs text-amber-700 mt-0.5">{fmtPoints(winner.points)} points</p>
          </div>
        )}

        {/* ===== Cars racing to the finish ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-base">Standings</h2>
          <div className="space-y-3">
            {racers.map((r, i) => {
              const pct = Math.min(r.points, goal) / goal;
              const car = CAR_COLORS[i % CAR_COLORS.length];
              const tint = TRACK_TINTS[i % TRACK_TINTS.length];
              const leader = i === 0 && r.points > 0;
              return (
                <div key={r.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {leader && <span title="Leader">👑</span>}
                      {r.name}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-900">
                      {fmtPoints(r.points)}
                      <span className="text-xs font-normal text-gray-400"> / {goal}</span>
                    </span>
                  </div>
                  <div className={`relative h-9 rounded-lg ${tint} overflow-hidden`}>
                    {/* finish line */}
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-base select-none">
                      🏁
                    </span>
                    {/* dashed track */}
                    <div className="absolute left-0 right-7 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-gray-200" />
                    {/* car */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 -scale-x-100 text-lg transition-all duration-700 select-none"
                      style={{ left: `calc(${pct} * (100% - 3.25rem))` }}
                    >
                      🏎️
                    </span>
                    <span
                      className="absolute top-1/2 -translate-y-1/2 -ml-3 text-[10px] transition-all duration-700 select-none"
                      style={{ left: `calc(${pct} * (100% - 3.25rem))` }}
                      aria-hidden
                    >
                      {car}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Today so far (live) ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">Today so far</h2>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
            </span>
          </div>

          {todayActive.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">
              No words practiced yet today. Be the first! 🚀
            </p>
          ) : (
            <div className="space-y-2.5">
              {todayActive.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 tabular-nums">{i + 1}.</span>
                  <span className="text-sm font-medium text-gray-800 w-20 shrink-0 truncate">
                    {r.name}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${Math.round((r.todayCount / maxToday) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums w-10 text-right">
                    {r.todayCount}
                  </span>
                  <span
                    className="text-xs font-semibold text-green-700 tabular-nums w-10 text-right"
                    title="Points if the day ended now"
                  >
                    +{fmtPoints(r.todayPoints)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-400 pt-1">
            Points are locked in at the end of each day (Europe/Berlin time).
          </p>
        </section>
      </div>
    </main>
  );
}
