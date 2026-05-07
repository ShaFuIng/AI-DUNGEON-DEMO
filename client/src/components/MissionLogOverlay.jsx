export default function MissionLogOverlay({ logs = [] }) {
  const recentLogs = logs.slice(-6);

  return (
    <aside className="pointer-events-none absolute left-4 top-4 z-20 w-[min(18rem,calc(100%-2rem))] rounded-lg border border-white/10 bg-black/45 p-3 text-xs text-stone-200 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200">
          Mission Log
        </p>
        <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 font-mono text-[10px] text-amber-100/80">
          {recentLogs.length}/6
        </span>
      </div>

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
