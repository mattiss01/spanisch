import { Badge } from '@/lib/achievements';

export default function Achievements({
  badges,
  newIds,
}: {
  badges: Badge[];
  newIds: Set<string>;
}) {
  const unlocked = badges.filter(b => b.unlocked).length;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <span>🏆</span> Achievements
        </h2>
        <span className="text-xs text-gray-400 tabular-nums">
          {unlocked} / {badges.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {badges.map(b => {
          const isNew = b.unlocked && newIds.has(b.id);
          const pct =
            b.progress && b.progress.need > 0
              ? Math.round((b.progress.have / b.progress.need) * 100)
              : b.unlocked
                ? 100
                : 0;
          return (
            <div
              key={b.id}
              className={`relative rounded-xl border p-3 ${
                b.unlocked ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              {isNew && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-xl ${b.unlocked ? '' : 'grayscale opacity-40'}`}>{b.icon}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${b.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {b.label}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{b.desc}</p>
                </div>
              </div>
              {!b.unlocked && b.progress && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 tabular-nums">
                    {b.progress.have}/{b.progress.need}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
