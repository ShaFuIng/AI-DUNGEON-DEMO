import { useEffect, useRef } from "react";

function StoryLine({ line }) {
  const parts = String(line.text).split("\n");
  const isCommand = line.type === "command";
  const isSystem = line.type === "system";

  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        isCommand
          ? "border border-amber-300/20 bg-amber-300/10 font-mono text-amber-100"
          : isSystem
            ? "border border-white/10 bg-white/[0.04] text-stone-400"
            : "bg-black/20 text-stone-100"
      }`}
    >
      {parts.map((part, index) => (
        <p key={`${line.id}-${index}`} className="leading-7">
          {isCommand && index === 0 ? "> " : ""}
          {part}
        </p>
      ))}
    </div>
  );
}

export default function StoryLog({ storyLines, stateLog, className = "" }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyLines, stateLog]);

  return (
    <section
      className={`flex min-h-0 flex-col rounded-lg border border-white/10 bg-[#171a1f]/90 shadow-panel backdrop-blur ${className}`}
    >
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-xs uppercase text-teal-200">
          Story
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">敘事紀錄</h2>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {storyLines.map((line) => (
          <StoryLine key={line.id} line={line} />
        ))}

        {stateLog.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 font-mono text-xs uppercase text-stone-500">
              Log
            </p>
            <div className="space-y-1 text-sm text-stone-400">
              {stateLog.slice(-5).map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
