import { NextResponse } from 'next/server';
import { dbConfigured, getRaceState, setRaceState, getAllRaceStats } from '@/lib/db';
import { berlinToday, berlinMonth, monthlyTotals, settleStars } from '@/lib/race';

// Lightweight endpoint for app-wide ⭐ display (nav header, profile switcher) so those
// surfaces don't need the full race board. Self-heals month winners like /api/race.
export async function GET() {
  const month = berlinMonth();

  if (!dbConfigured()) {
    return NextResponse.json({ stars: {}, month });
  }

  try {
    const [state, profileStats] = await Promise.all([getRaceState(), getAllRaceStats()]);
    const dailyMaps = Object.fromEntries(
      Object.entries(profileStats).map(([id, stats]) => [id, stats.daily])
    );
    const totals = monthlyTotals(dailyMaps, berlinToday());
    const changed = settleStars(state, totals, month);
    if (changed) await setRaceState(state);
    return NextResponse.json({ stars: state.stars, month });
  } catch {
    return NextResponse.json({ stars: {}, month });
  }
}
