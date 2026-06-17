interface Props {
  streak: number;
  todayCount: number;
  goal: number;
}

export default function StreakBanner({ streak, todayCount, goal }: Props) {
  const pct = goal > 0 ? Math.min(100, Math.round((todayCount / goal) * 100)) : 0;
  const reached = todayCount >= goal;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xl">{streak > 0 ? '🔥' : '🌱'}</span>
        <div className="leading-tight">
          <p className="text-lg font-bold text-gray-900 tabular-nums">{streak}</p>
          <p className="text-xs text-gray-400 -mt-0.5">day{streak === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Today&apos;s goal</span>
          <span className="text-xs font-semibold tabular-nums text-gray-700">
            {todayCount} / {goal} {reached && '🎉'}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${reached ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
