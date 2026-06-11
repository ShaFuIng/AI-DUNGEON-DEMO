import { useEffect, useMemo, useRef, useState } from "react";

const MAX_VISIBLE_LOGS = 5;
const LEAVE_DURATION_MS = 220;
const ENTER_DURATION_MS = 180;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeLogs(logs) {
  return logs
    .map((line, index) => ({
      id: `${index}-${String(line || "").trim()}`,
      text: String(line || "").trim(),
    }))
    .filter((entry) => entry.text);
}

export default function MissionLogOverlay({ logs = [] }) {
  const entries = useMemo(() => normalizeLogs(logs), [logs]);
  const recentLogs = useMemo(() => entries.slice(-MAX_VISIBLE_LOGS), [entries]);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const previousCountRef = useRef(0);
  const initializedRef = useRef(false);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousCountRef.current = entries.length;
      setVisibleLogs(recentLogs.map((entry) => ({ ...entry, phase: "stable" })));
      return;
    }

    const previousCount = previousCountRef.current;

    if (entries.length <= previousCount) {
      previousCountRef.current = entries.length;
      setVisibleLogs(recentLogs.map((entry) => ({ ...entry, phase: "stable" })));
      return;
    }

    const appendedEntries = entries.slice(previousCount);
    previousCountRef.current = entries.length;

    queueRef.current = queueRef.current.then(async () => {
      for (const entry of appendedEntries) {
        let needsLeave = false;

        setVisibleLogs((current) => {
          if (current.length < MAX_VISIBLE_LOGS) {
            return [...current, { ...entry, phase: "entering" }];
          }

          needsLeave = true;
          return current.map((visibleEntry, index) =>
            index === 0 ? { ...visibleEntry, phase: "leaving" } : visibleEntry
          );
        });

        if (needsLeave) {
          await wait(LEAVE_DURATION_MS);
          setVisibleLogs((current) => [
            ...current.slice(1),
            { ...entry, phase: "entering" },
          ]);
        }

        await wait(ENTER_DURATION_MS);
        setVisibleLogs((current) =>
          current.map((visibleEntry) =>
            visibleEntry.id === entry.id
              ? { ...visibleEntry, phase: "stable" }
              : visibleEntry
          )
        );
      }
    });
  }, [entries, recentLogs]);

  return (
    <aside className="pointer-events-none absolute left-4 top-20 z-20 w-[min(16rem,calc(100%-2rem))] text-xs text-stone-200">
      <div className="rounded-lg border border-amber-100/15 bg-[#12100d]/70 px-2.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.34)] backdrop-blur-sm">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-amber-200/80">
          Recent Log
        </p>
        <div className="space-y-2">
          {visibleLogs.length ? (
            visibleLogs.map((entry, index) => (
              <div
                key={entry.id}
                className={`recent-log-item recent-log-item-${entry.phase} rounded-md border border-white/10 bg-black/25 px-2 py-1.5 leading-5 text-stone-200`}
              >
                <span className="mr-1.5 font-mono text-amber-100/60">
                  {index + 1}.
                </span>
                <span className="break-words">{entry.text}</span>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/10 bg-black/20 px-2 py-1.5 text-stone-400">
              尚無近期紀錄
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
