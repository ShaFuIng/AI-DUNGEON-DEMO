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

export default function StoryLog({ storyLines, className = "" }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyLines]);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#171a1f]/90 shadow-panel backdrop-blur ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-xs uppercase text-teal-200">Story</p>
        <h2 className="mt-2 text-xl font-semibold text-white">敘事紀錄</h2>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
      >
        {storyLines.map((line) => (
          <StoryLine key={line.id} line={line} />
        ))}
      </div>
    </section>
  );
}
