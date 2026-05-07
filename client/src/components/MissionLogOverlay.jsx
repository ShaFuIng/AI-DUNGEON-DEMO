export default function MissionLogOverlay({ logs = [] }) {
  const recentLogs = logs.slice(-4);

  return (
    <aside className="pointer-events-none absolute left-4 top-20 z-20 w-[min(15rem,calc(100%-2rem))] space-y-1.5 text-xs text-stone-200">
      {recentLogs.length ? (
        <div className="space-y-1.5">
          {recentLogs.map((line, index) => (
            <p
              key={`${line}-${index}`}
              className="truncate rounded border border-white/5 bg-white/[0.04] px-2 py-1 text-stone-300"
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="rounded border border-white/5 bg-white/[0.04] px-2 py-1 text-stone-500">
          尚無行動紀錄
        </p>
      )}
    </aside>
  );
}
