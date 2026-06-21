// ─── The Race — pure scoring logic (no I/O) ────────────────────────────────────
// Kept side-effect-free so it's easy to reason about and test.

import type { RaceState } from './types';

const TIMEZONE = 'Europe/Berlin';

// Points for finishing 1st…5th on a given day. Positions beyond this earn 0.
const TIERS = [5, 4, 3, 2, 1];

// The current day (YYYY-MM-DD) in Europe/Berlin and the UTC instant of its 00:00.
// The daily boundary must be consistent across users, so we anchor it to one zone.
export function berlinDayStart(now: Date = new Date()): { date: string; startISO: string } {
  // 'en-CA' formats as YYYY-MM-DD.
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Find the UTC instant matching 00:00 in Berlin on that date. Start from midnight
  // UTC, then correct by the zone offset at that moment.
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  const asBerlin = new Date(utcMidnight.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const offset = utcMidnight.getTime() - asBerlin.getTime();
  const startISO = new Date(utcMidnight.getTime() + offset).toISOString();

  return { date, startISO };
}

// Just the current day (YYYY-MM-DD) in Europe/Berlin. Shared by client and server
// so the daily activity counter, the streak goal, and race settlement all agree.
export function berlinToday(now: Date = new Date()): string {
  return berlinDayStart(now).date;
}

// The current calendar month (YYYY-MM) in Europe/Berlin. The monthly race resets
// on this boundary, consistent with the daily boundary above.
export function berlinMonth(now: Date = new Date()): string {
  return berlinDayStart(now).date.slice(0, 7);
}

// Sum each calendar month's points from per-user daily activity maps
// (userId -> 'YYYY-MM-DD' -> count). Each day is scored with awardPoints (the 5·4·3·2·1
// tiers, ties split) and summed into its month. `today` is excluded — it isn't locked yet
// (shown live in "Today so far"), matching how settled points have always worked.
// Returns: month 'YYYY-MM' -> { userId: monthPoints }.
export function monthlyTotals(
  dailyMaps: Record<string, Record<string, number>>,
  today: string
): Record<string, Record<string, number>> {
  // Regroup into month -> day -> { userId: count }.
  const byMonthDay: Record<string, Record<string, Record<string, number>>> = {};
  for (const [userId, days] of Object.entries(dailyMaps)) {
    for (const [date, count] of Object.entries(days)) {
      if (date >= today || count <= 0) continue;
      const month = date.slice(0, 7);
      (byMonthDay[month] ??= {});
      (byMonthDay[month][date] ??= {});
      byMonthDay[month][date][userId] = count;
    }
  }

  const totals: Record<string, Record<string, number>> = {};
  for (const [month, days] of Object.entries(byMonthDay)) {
    const monthSum: Record<string, number> = {};
    for (const counts of Object.values(days)) {
      const awards = awardPoints(counts);
      for (const [userId, pts] of Object.entries(awards)) {
        monthSum[userId] = (monthSum[userId] ?? 0) + pts;
      }
    }
    totals[month] = monthSum;
  }
  return totals;
}

// Winner(s) of each month = the user(s) with the most points (> 0). Ties → all of them.
export function monthWinners(
  totals: Record<string, Record<string, number>>
): Record<string, string[]> {
  const winners: Record<string, string[]> = {};
  for (const [month, sums] of Object.entries(totals)) {
    let max = 0;
    for (const pts of Object.values(sums)) if (pts > max) max = pts;
    if (max <= 0) continue;
    winners[month] = Object.entries(sums)
      .filter(([, pts]) => pts === max)
      .map(([userId]) => userId);
  }
  return winners;
}

// Render an accumulated star count behind a name: '' for 0, repeated ⭐ up to 5,
// then a compact '⭐×N'. Leading space so it can be appended directly after a name.
export function formatStars(n: number): string {
  if (!n || n <= 0) return '';
  return n <= 5 ? ' ' + '⭐'.repeat(n) : ` ⭐×${n}`;
}

// Award stars for any finished month not yet counted, mutating state. Idempotent
// via state.settledMonths. On the first run under the monthly model (settledMonths
// undefined) it seeds the finished months WITHOUT awarding, so months that ended
// before this shipped don't grant retroactive stars. Returns whether state changed.
export function settleStars(
  state: RaceState,
  totals: Record<string, Record<string, number>>,
  currentMonth: string
): boolean {
  const finished = Object.keys(totals)
    .filter(m => m < currentMonth)
    .sort();

  if (state.settledMonths === undefined) {
    state.settledMonths = finished; // seed, no retroactive awards
    state.stars ??= {};
    return true;
  }

  const already = new Set(state.settledMonths);
  const winners = monthWinners(totals);
  let changed = false;
  for (const month of finished) {
    if (already.has(month)) continue;
    for (const userId of winners[month] ?? []) {
      state.stars[userId] = (state.stars[userId] ?? 0) + 1;
    }
    state.settledMonths.push(month);
    changed = true;
  }
  return changed;
}

// Award a single day's points from per-user practiced-word counts.
// Rules: only users with count >= 1 are ranked (count desc). Ties split the tiers
// they occupy evenly — e.g. {a:10,b:10,c:5} -> a,b get (5+4)/2=4.5, c gets 3.
export function awardPoints(counts: Record<string, number>): Record<string, number> {
  const ranked = Object.entries(counts)
    .filter(([, c]) => c >= 1)
    .sort((a, b) => b[1] - a[1]);

  const result: Record<string, number> = {};
  let i = 0;
  while (i < ranked.length) {
    // Collect the group of users tied at this count.
    let j = i;
    while (j < ranked.length && ranked[j][1] === ranked[i][1]) j++;
    // Average the tier values for positions i…j-1 (positions past 5th contribute 0).
    let sum = 0;
    for (let k = i; k < j; k++) sum += TIERS[k] ?? 0;
    const share = sum / (j - i);
    for (let k = i; k < j; k++) result[ranked[k][0]] = share;
    i = j;
  }
  return result;
}
