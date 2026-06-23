// Compact gamified targets shown under the streak banner. All inputs are plain
// numbers; each line hides itself when it isn't meaningful yet.
export default function ChallengeStrip({
  todayCount,
  top5Threshold,
  top4Threshold,
  top3Threshold,
  top2Threshold,
  top1Threshold,
  personalBest,
  rank,
  yesterday,
}: {
  todayCount: number;
  top5Threshold: number | null; // 5th place all-time record count (null if < 5 records)
  top4Threshold: number | null;
  top3Threshold: number | null;
  top2Threshold: number | null;
  top1Threshold: number | null;
  personalBest: number;         // best PRIOR day (excludes today)
  rank: number | null;          // live position today among racers
  yesterday: number;
}) {
  const lines: { icon: string; text: string; done?: boolean }[] = [];


  const allTimeMilestones: { threshold: number; label: string }[] = [];
  if (top5Threshold != null) allTimeMilestones.push({ threshold: top5Threshold, label: 'the all-time top 5' });
  if (top4Threshold != null) allTimeMilestones.push({ threshold: top4Threshold, label: 'all-time 4th place' });
  if (top3Threshold != null) allTimeMilestones.push({ threshold: top3Threshold, label: 'all-time 3rd place' });
  if (top2Threshold != null) allTimeMilestones.push({ threshold: top2Threshold, label: 'all-time 2nd place' });
  if (top1Threshold != null) allTimeMilestones.push({ threshold: top1Threshold, label: 'all-time #1' });

  if (allTimeMilestones.length > 0) {
    const next = allTimeMilestones.find((m) => todayCount < m.threshold);

    if (top5Threshold != null && todayCount >= top5Threshold) {
      lines.push({ icon: '🏅', text: "Congrats, you're in the top 5!", done: true });
    }

    if (next) {
      const gap = next.threshold - todayCount;
      lines.push({
        icon: '🏅',
        text: `${gap} card${gap === 1 ? '' : 's'} from ${next.label}`,
      });
    } else {
      lines.push({ icon: '🏅', text: 'All-time #1 day!', done: true });
    }
  }

  if (personalBest > 0) {
    const gap = personalBest - todayCount;
    lines.push(
      gap > 0
        ? { icon: '⭐', text: `${gap} card${gap === 1 ? '' : 's'} from your best (${personalBest})` }
        : { icon: '⭐', text: 'New personal best!', done: true },
    );
  }

  if (rank != null) {
    if (todayCount === 0) lines.push({ icon: '🏎️', text: 'Do some cards to enter today’s ranking' });
    else if (rank === 1) lines.push({ icon: '👑', text: 'You’re #1 today!', done: true });
    else lines.push({ icon: '🏎️', text: `You’re #${rank} today` });
  }

  if (yesterday > 0) {
    const gap = yesterday - todayCount;
    lines.push(
      gap > 0
        ? { icon: '📈', text: `${gap} card${gap === 1 ? '' : 's'} to beat yesterday (${yesterday})` }
        : { icon: '📈', text: 'Beat yesterday!', done: true },
    );
  }

  if (lines.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-1.5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
        <span>🎯</span> Challenges
      </p>
      {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-5 text-center">{l.icon}</span>
          <span className={l.done ? 'font-semibold text-green-700' : 'text-gray-700'}>{l.text}</span>
        </div>
      ))}
    </div>
  );
}
