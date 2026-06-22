import { NextResponse } from 'next/server';
import {
  dbConfigured,
  getRaceState,
  setRaceState,
  getDailyActionCounts,
  getAllDailyMaps,
} from '@/lib/db';
import { berlinDayStart, berlinMonth, awardPoints, monthlyTotals, settleStars } from '@/lib/race';
import { PROFILES } from '@/lib/profiles';
import { RaceResponse, RaceHighscore, RaceHistory } from '@/lib/types';

// Keep ~30 days of settled snapshots so the global row can't grow without bound.
const KEEP_DAILY_DAYS = 30;

// GET reads the standings and self-heals: it snapshots today's live counts, records
// finished-day highscores, and awards a ⭐ to the winner of any finished month. All
// side-effects are idempotent (guarded by settledDates / settledMonths), so repeating
// this on a GET is safe. Points are scoped to the current calendar month.
export async function GET() {
  const { date: today } = berlinDayStart();
  const currentMonth = berlinMonth();

  const nameOf = (id: string) => PROFILES.find(p => p.id === id)?.name ?? id;
  const EMPTY_HISTORY: RaceHistory = { dates: [], series: [] };

  // Cumulative daily-activity per profile over a continuous date range, for the
  // "Progress over time" chart. `today` snapshot is merged in so the curve is live.
  function buildHistory(
    dailyMaps: Record<string, Record<string, number>>,
    live: Record<string, number>
  ): RaceHistory {
    // Per-profile daily maps, with today's live count overlaid.
    const maps: Record<string, Record<string, number>> = {};
    let minDate: string | null = null;
    for (const p of PROFILES) {
      const m = { ...(dailyMaps[p.id] ?? {}) };
      if (live[p.id]) m[today] = live[p.id];
      maps[p.id] = m;
      for (const d of Object.keys(m)) if (!minDate || d < minDate) minDate = d;
    }
    if (!minDate) return EMPTY_HISTORY;

    // Continuous Berlin-date range, starting one day BEFORE the first activity so
    // every line visibly starts from 0, through today (step one calendar day via UTC).
    const dates: string[] = [];
    for (let t = Date.parse(`${minDate}T00:00:00Z`) - 86400000; ; t += 86400000) {
      const d = new Date(t).toISOString().slice(0, 10);
      dates.push(d);
      if (d >= today) break;
    }

    const series = PROFILES.map(p => {
      const m = maps[p.id];
      let run = 0;
      const cumulative = dates.map(d => (run += m[d] ?? 0));
      return { id: p.id, name: p.name, cumulative };
    }).filter(s => s.cumulative[s.cumulative.length - 1] > 0); // only racers with activity

    return series.length ? { dates, series } : EMPTY_HISTORY;
  }

  // Build the response from this month's points + today's live counts + persisted data.
  function buildResponse(
    monthPoints: Record<string, number>,
    live: Record<string, number>,
    persisted: RaceHighscore[] = [],
    stars: Record<string, number> = {},
    history: RaceHistory = EMPTY_HISTORY,
    dailyMaps: Record<string, Record<string, number>> = {}
  ): RaceResponse {
    const todayPoints = awardPoints(live);
    const racers = PROFILES.map(p => ({
      id: p.id,
      name: p.name,
      points: monthPoints[p.id] ?? 0,
      todayCount: live[p.id] ?? 0,
      todayPoints: todayPoints[p.id] ?? 0,
      stars: stars[p.id] ?? 0,
    })).sort((a, b) => b.points - a.points || b.todayCount - a.todayCount);

    // Top-5 single-day records: persisted (settled) plus today's live as a
    // provisional candidate, so a record-breaking day shows up immediately.
    const candidates: RaceHighscore[] = [
      ...persisted,
      ...Object.entries(live).map(([userId, count]) => ({ date: today, userId, count })),
    ];
    const highscores = candidates
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
      .slice(0, 5)
      .map(h => ({ date: h.date, name: nameOf(h.userId), count: h.count }));

    // Each person's own best single day ever, from retained daily history + today's
    // live count + persisted records. Shown under the top-5 so everyone's best is visible.
    const ids = new Set(PROFILES.map(p => p.id));
    const best: Record<string, { date: string; count: number }> = {};
    const consider = (id: string, date: string, count: number) => {
      if (!ids.has(id) || count <= 0) return;
      if (!best[id] || count > best[id].count) best[id] = { date, count };
    };
    for (const [id, days] of Object.entries(dailyMaps))
      for (const [d, c] of Object.entries(days)) consider(id, d, c);
    for (const [id, c] of Object.entries(live)) consider(id, today, c);
    for (const h of persisted) consider(h.userId, h.date, h.count);
    const personalBests = PROFILES.filter(p => best[p.id])
      .map(p => ({ date: best[p.id].date, name: p.name, count: best[p.id].count }))
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));

    return { month: currentMonth, today, racers, highscores, personalBests, history, stars };
  }

  // Without a database, return an empty (zeroed) board rather than erroring.
  if (!dbConfigured()) {
    return NextResponse.json(buildResponse({}, {}));
  }

  try {
    const [state, actions, dailyMaps] = await Promise.all([
      getRaceState(),
      getDailyActionCounts(today),
      getAllDailyMaps(),
    ]);

    // Daily activity per profile = every flashcard and every conjugated form done
    // today (repeats included), tallied in the per-day stats counter.
    const ids = new Set(PROFILES.map(p => p.id));
    const liveTracked: Record<string, number> = {};
    for (const id of ids) {
      const total = actions[id] ?? 0;
      if (total > 0) liveTracked[id] = total;
    }

    // Snapshot today's count (overwrite — last write of the day wins at settlement).
    state.dailyCounts[today] = liveTracked;

    // Record finished, unsettled days as single-day highscore candidates.
    const settled = new Set(state.settledDates);
    for (const d of Object.keys(state.dailyCounts)) {
      if (d < today && !settled.has(d)) {
        for (const [id, count] of Object.entries(state.dailyCounts[d])) {
          if (ids.has(id) && count > 0) state.highscores.push({ date: d, userId: id, count });
        }
        settled.add(d);
        state.settledDates.push(d);
      }
    }

    // Keep only the top 5 single-day records ever.
    state.highscores.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
    state.highscores = state.highscores.slice(0, 5);

    // Prune old settled snapshots to bound the row size.
    const cutoff = new Date(Date.now() - KEEP_DAILY_DAYS * 86400000).toISOString().slice(0, 10);
    for (const d of Object.keys(state.dailyCounts)) {
      if (d < cutoff && settled.has(d)) delete state.dailyCounts[d];
    }

    // Monthly points from the per-user daily history; award ⭐ for finished months.
    const totals = monthlyTotals(dailyMaps, today);
    settleStars(state, totals, currentMonth);

    // We always update today's snapshot; persist the whole state.
    await setRaceState(state);

    const monthPoints = totals[currentMonth] ?? {};
    const history = buildHistory(dailyMaps, liveTracked);
    return NextResponse.json(
      buildResponse(monthPoints, liveTracked, state.highscores, state.stars, history, dailyMaps)
    );
  } catch {
    // Never break the page on a transient DB error — show a zeroed board.
    return NextResponse.json(buildResponse({}, {}));
  }
}
