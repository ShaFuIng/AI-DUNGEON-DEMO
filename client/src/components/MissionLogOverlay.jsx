import { useMemo } from "react";

export default function MissionLogOverlay({ logs = [] }) {
  const recentLogs = useMemo(
    () =>
      logs
        .map((line) => String(line || "").trim())
        .filter(Boolean)
        .slice(-5)
        .reverse(),
    [logs],
  );

  return (
    <aside className="pointer-events-none absolute left-4 top-20 z-20 w-[min(18rem,calc(100%-2rem))] text-xs text-stone-200">
      <div className="overflow-hidden rounded-lg border border-amber-100/15 bg-[#12100d]/85 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.38)] backdrop-blur-sm">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-amber-200/80">
          Recent Log
        </p>
        <div className="space-y-1">
          {recentLogs.length ? (
            recentLogs.map((line, index) => (
              <p key={`${line}-${index}`} className="truncate text-stone-200">
                <span className="mr-2 font-mono text-amber-100/50">
                  {index + 1}
                </span>
                {line}
              </p>
            ))
          ) : (
            <p className="text-stone-400">尚無行動紀錄</p>
          )}
        </div>
      </div>
    </aside>
  );
}
