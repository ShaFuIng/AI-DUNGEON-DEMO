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
    <aside className="pointer-events-none absolute left-4 top-20 z-20 w-[min(15rem,calc(100%-2rem))] text-xs text-stone-200">
      <div className="rounded-lg border border-amber-100/15 bg-[#12100d]/70 px-2.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.34)] backdrop-blur-sm">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-amber-200/80">
          Recent Log
        </p>
        <div className="space-y-2">
          {recentLogs.length ? (
            recentLogs.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5 leading-5 text-stone-200"
              >
                <span className="mr-1.5 font-mono text-amber-100/60">
                  {index + 1}
                </span>
                <span className="break-words">{line}</span>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/10 bg-black/20 px-2 py-1.5 text-stone-400">
              尚無行動紀錄
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
