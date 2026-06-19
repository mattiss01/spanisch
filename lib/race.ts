// ─── The Race — pure scoring logic (no I/O) ────────────────────────────────────
// Kept side-effect-free so it's easy to reason about and test.

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
