import { NextResponse } from 'next/server';
import {
  dbConfigured,
  getRaceState,
  setRaceState,
  getDailyVocabCounts,
  getDailyConjugationCounts,
} from '@/lib/db';
import { berlinDayStart, awardPoints } from '@/lib/race';
import { PROFILES } from '@/lib/profiles';
import { RaceResponse, RaceHighscore } from '@/lib/types';

const GOAL = 100;
// Keep ~30 days of settled snapshots so the global row can't grow without bound.
const KEEP_DAILY_DAYS = 30;
// Conjugating one verb counts as this much toward the daily activity total.
const CONJUGATION_WEIGHT = 5;

// GET reads the standings and self-heals: it snapshots today's live counts and
// settles any finished day into cumulative points. Settlement is idempotent
// (guarded by settledDates), so this side-effect on a GET is safe to repeat.
export async function GET() {
  const { date: today } = berlinDayStart();

  const nameOf = (id: string) => PROFILES.find(p => p.id === id)?.name ?? id;

  // Build the response from a points map + today's live counts + persisted records.
  function buildResponse(
    points: Record<string, number>,
    live: Record<string, number>,
    persisted: RaceHighscore[] = []
  ): RaceResponse {
    const todayPoints = awardPoints(live);
    const racers = PROFILES.map(p => ({
      id: p.id,
      name: p.name,
      points: points[p.id] ?? 0,
      todayCount: live[p.id] ?? 0,
      todayPoints: todayPoints[p.id] ?? 0,
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

    const winner = racers.find(r => r.points >= GOAL);
    return { goal: GOAL, today, racers, winnerId: winner?.id ?? null, highscores };
  }

  // Without a database, return an empty (zeroed) board rather than erroring.
  if (!dbConfigured()) {
    return NextResponse.json(buildResponse({}, {}));
  }

  try {
    const { startISO } = berlinDayStart();
    const [state, vocab, verbs] = await Promise.all([
      getRaceState(),
      getDailyVocabCounts(startISO),
      getDailyConjugationCounts(startISO),
    ]);

    // Daily activity per profile = words practiced + 5 per verb conjugated today.
    const ids = new Set(PROFILES.map(p => p.id));
    const liveTracked: Record<string, number> = {};
    for (const id of ids) {
      const total = (vocab[id] ?? 0) + (verbs[id] ?? 0) * CONJUGATION_WEIGHT;
      if (total > 0) liveTracked[id] = total;
    }

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
        // Record each user's day total as a single-day highscore candidate.
        for (const [id, count] of Object.entries(state.dailyCounts[d])) {
          if (ids.has(id) && count > 0) state.highscores.push({ date: d, userId: id, count });
        }
        settled.add(d);
        state.settledDates.push(d);
        changed = true;
      }
    }

    // Keep only the top 5 single-day records ever.
    state.highscores.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
    state.highscores = state.highscores.slice(0, 5);

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

    return NextResponse.json(buildResponse(state.points, liveTracked, state.highscores));
  } catch {
    // Never break the page on a transient DB error — show a zeroed board.
    return NextResponse.json(buildResponse({}, {}));
  }
}
