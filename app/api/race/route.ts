import { NextResponse } from 'next/server';
import {
  dbConfigured,
  getRaceState,
  setRaceState,
  getDailyVocabCounts,
} from '@/lib/db';
import { berlinDayStart, awardPoints } from '@/lib/race';
import { PROFILES } from '@/lib/profiles';
import { RaceResponse } from '@/lib/types';

const GOAL = 100;
// Keep ~30 days of settled snapshots so the global row can't grow without bound.
const KEEP_DAILY_DAYS = 30;

// GET reads the standings and self-heals: it snapshots today's live counts and
// settles any finished day into cumulative points. Settlement is idempotent
// (guarded by settledDates), so this side-effect on a GET is safe to repeat.
export async function GET() {
  const { date: today } = berlinDayStart();

  // Build the response from a points map + today's live counts.
  function buildResponse(
    points: Record<string, number>,
    live: Record<string, number>
  ): RaceResponse {
    const todayPoints = awardPoints(live);
    const racers = PROFILES.map(p => ({
      id: p.id,
      name: p.name,
      points: points[p.id] ?? 0,
      todayCount: live[p.id] ?? 0,
      todayPoints: todayPoints[p.id] ?? 0,
    })).sort((a, b) => b.points - a.points || b.todayCount - a.todayCount);

    const winner = racers.find(r => r.points >= GOAL);
    return { goal: GOAL, today, racers, winnerId: winner?.id ?? null };
  }

  // Without a database, return an empty (zeroed) board rather than erroring.
  if (!dbConfigured()) {
    return NextResponse.json(buildResponse({}, {}));
  }

  try {
    const { startISO } = berlinDayStart();
    const [state, live] = await Promise.all([getRaceState(), getDailyVocabCounts(startISO)]);

    // Only ever track the known profiles.
    const ids = new Set(PROFILES.map(p => p.id));
    const liveTracked: Record<string, number> = {};
    for (const id of ids) if (live[id]) liveTracked[id] = live[id];

    // Snapshot today's count (overwrite — last write of the day wins at settlement).
    state.dailyCounts[today] = liveTracked;

    // Settle any finished, unsettled day into cumulative points.
    const settled = new Set(state.settledDates);
    let changed = false;
    for (const d of Object.keys(state.dailyCounts)) {
      if (d < today && !settled.has(d)) {
        const awards = awardPoints(state.dailyCounts[d]);
        for (const [id, pts] of Object.entries(awards)) {
          if (!ids.has(id)) continue;
          state.points[id] = (state.points[id] ?? 0) + pts;
        }
        settled.add(d);
        state.settledDates.push(d);
        changed = true;
      }
    }

    // Prune old settled snapshots to bound the row size.
    const cutoff = new Date(Date.now() - KEEP_DAILY_DAYS * 86400000).toISOString().slice(0, 10);
    for (const d of Object.keys(state.dailyCounts)) {
      if (d < cutoff && settled.has(d)) {
        delete state.dailyCounts[d];
        changed = true;
      }
    }

    // We always update today's snapshot; persist it.
    await setRaceState(state);
    void changed;

    return NextResponse.json(buildResponse(state.points, liveTracked));
  } catch {
    // Never break the page on a transient DB error — show a zeroed board.
    return NextResponse.json(buildResponse({}, {}));
  }
}
