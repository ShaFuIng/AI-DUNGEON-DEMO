import { useEffect, useMemo, useState } from "react";

export default function MissionLogOverlay({ logs = [] }) {
  const recentLogs = useMemo(() => logs.slice(-4), [logs]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [recentLogs.length]);

  useEffect(() => {
    if (recentLogs.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % recentLogs.length);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [recentLogs.length]);

  const activeLog = recentLogs[activeIndex];

  return (
    <aside className="pointer-events-none absolute left-4 top-20 z-20 w-[min(17rem,calc(100%-2rem))] text-xs text-stone-200">
      <div className="overflow-hidden rounded-lg border border-amber-100/15 bg-[#12100d]/85 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.38)] backdrop-blur-sm">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-amber-200/80">
          Recent Log
        </p>
        <p
          key={activeLog || "empty"}
          className="truncate text-stone-200 transition-opacity duration-300"
        >
          {activeLog || "尚無行動紀錄"}
        </p>

        {recentLogs.length > 1 ? (
          <div className="mt-2 flex gap-1">
            {recentLogs.map((line, index) => (
              <span
                key={`${line}-${index}`}
                className={`h-1 w-4 rounded-full ${
                  index === activeIndex ? "bg-amber-200/80" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
