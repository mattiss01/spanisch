'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRace } from '@/lib/storage';
import { formatStars } from '@/lib/race';
import { RaceResponse, RaceHistory } from '@/lib/types';

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
// SVG stroke colors for the progress chart, in the same order as the cars above
// (tailwind -500 shades) so each line matches that racer's car.
const LINE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

function fmtPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// 'YYYY-MM' -> e.g. "June 2026". Parsed as local midnight so the month doesn't shift.
function fmtMonth(month: string): string {
  const d = new Date(`${month}-01T00:00:00`);
  if (isNaN(d.getTime())) return month;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Days remaining in the current month's race, today included (so the last day
// reads "1 day left"). Uses the Berlin `month`/`today` the API returns — both are
// plain date strings, so there are no timezone pitfalls.
function daysLeftInMonth(month: string, today: string): number {
  const [y, m] = month.split('-').map(Number);
  const todayDay = Number(today.slice(8, 10));
  if (!y || !m || !todayDay) return 0;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based ⇒ last day of month
  return Math.max(0, lastDay - todayDay + 1);
}

// 'YYYY-MM-DD' -> e.g. "17 Jun". Parsed as local midnight so the date doesn't shift.
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Hand-rolled cumulative line chart (no chart lib — matches the app's UI style).
function ProgressOverTime({
  history,
  colorOf,
}: {
  history: RaceHistory;
  colorOf: (id: string) => string;
}) {
  const { dates, series } = history;
  const empty = series.length === 0 || dates.length === 0;

  // viewBox geometry; the SVG scales to its container width.
  const W = 320,
    H = 170,
    PL = 30,
    PR = 12,
    PT = 12,
    PB = 22;
  const n = dates.length;
  const yMax = Math.max(1, ...series.map(s => s.cumulative[s.cumulative.length - 1] ?? 0));
  const x = (i: number) => (n <= 1 ? PL : PL + (i / (n - 1)) * (W - PL - PR));
  const y = (v: number) => H - PB - (v / yMax) * (H - PT - PB);

  // x tick labels: first, middle, last.
  const tickIdx = n <= 1 ? [0] : [...new Set([0, Math.floor((n - 1) / 2), n - 1])];

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
        <span>📈</span> Progress over time
      </h2>

      {empty ? (
        <p className="text-sm text-gray-400 py-3 text-center">
          No activity yet — start learning to grow your line! 🚀
        </p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative learning over time">
            {/* y baseline + top gridline with labels */}
            {[0, yMax].map((v, k) => (
              <g key={k}>
                <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="#f1f5f9" strokeWidth={1} />
                <text x={PL - 4} y={y(v) + 3} textAnchor="end" fontSize={8} fill="#94a3b8">
                  {Math.round(v)}
                </text>
              </g>
            ))}

            {/* one line per racer */}
            {series.map(s => {
              const color = colorOf(s.id);
              const last = s.cumulative.length - 1;
              if (n === 1) {
                return <circle key={s.id} cx={x(0)} cy={y(s.cumulative[0])} r={3} fill={color} />;
              }
              const pts = s.cumulative.map((v, i) => `${x(i)},${y(v)}`).join(' ');
              return (
                <g key={s.id}>
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle cx={x(last)} cy={y(s.cumulative[last])} r={2.5} fill={color} />
                </g>
              );
            })}

            {/* x tick labels */}
            {tickIdx.map(i => (
              <text
                key={i}
                x={x(i)}
                y={H - 6}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                fontSize={8}
                fill="#94a3b8"
              >
                {fmtDate(dates[i])}
              </text>
            ))}
          </svg>

          {/* legend: colored swatch + name + current total */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[...series]
              .sort(
                (a, b) =>
                  (b.cumulative[b.cumulative.length - 1] ?? 0) -
                  (a.cumulative[a.cumulative.length - 1] ?? 0)
              )
              .map(s => (
                <span key={s.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span
                    className="inline-block w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: colorOf(s.id) }}
                  />
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="tabular-nums text-gray-500">
                    {s.cumulative[s.cumulative.length - 1] ?? 0}
                  </span>
                </span>
              ))}
          </div>
          <p className="text-[11px] text-gray-400 pt-1">
            Total flashcards &amp; conjugations practiced, added up day by day.
          </p>
        </>
      )}
    </section>
  );
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

  const { month, today, racers, highscores, history } = race;
  // Cars race relative to the current month's leader (no fixed finish line).
  const leaderPoints = Math.max(0, ...racers.map(r => r.points));
  const daysLeft = daysLeftInMonth(month, today);
  // Map each racer id to its car color index (standings order) so chart lines match.
  const colorIndex = new Map(racers.map((r, i) => [r.id, i]));
  const colorOf = (id: string) =>
    LINE_COLORS[(colorIndex.get(id) ?? 0) % LINE_COLORS.length];
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
            Most points this calendar month wins a ⭐ — then it resets on the 1st. Most learning
            each day scores 5 · 4 · 3 · 2 · 1; flashcards, conjugations and articles count.
          </p>
        </div>

        {/* ===== Cars racing the month's leader ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">Standings</h2>
            <div className="text-right leading-tight">
              <p className="text-xs font-medium text-gray-500">{fmtMonth(month)}</p>
              {daysLeft > 0 && (
                <p className="text-[11px] text-gray-400">
                  ⏳ {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {racers.map((r, i) => {
              const pct = leaderPoints > 0 ? r.points / leaderPoints : 0;
              const car = CAR_COLORS[i % CAR_COLORS.length];
              const tint = TRACK_TINTS[i % TRACK_TINTS.length];
              const leader = i === 0 && r.points > 0;
              return (
                <div key={r.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {leader && <span title="Leader">👑</span>}
                      {r.name + formatStars(r.stars)}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-900">
                      {fmtPoints(r.points)}
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
              No activity yet today. Be the first! 🚀
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

        {/* ===== All-time daily records ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>🏅</span> Daily records
          </h2>
          {highscores.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 text-center">No records yet — go set one!</p>
          ) : (
            <div className="space-y-2">
              {highscores.map((h, i) => {
                const medal = ['🥇', '🥈', '🥉'][i];
                return (
                  <div key={`${h.date}-${h.name}-${i}`} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm shrink-0">
                      {medal ?? <span className="text-gray-400">{i + 1}.</span>}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
                      {h.name}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums shrink-0">
                      {fmtDate(h.date)}
                    </span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums w-10 text-right shrink-0">
                      {h.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-gray-400 pt-1">Highest single-day scores ever.</p>
        </section>

        {/* ===== Progress over time (cumulative) ===== */}
        <ProgressOverTime history={history} colorOf={colorOf} />
      </div>
    </main>
  );
}
