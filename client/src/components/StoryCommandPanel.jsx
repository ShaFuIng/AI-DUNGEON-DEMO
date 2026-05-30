import { useEffect, useRef, useState } from "react";

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

export default function StoryCommandPanel({
  storyLines,
  loading,
  onSubmit,
  className = "",
}) {
  const [command, setCommand] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyLines]);

  function handleSubmit(event) {
    event.preventDefault();
    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
      return;
    }

    onSubmit(normalizedCommand);
    setCommand("");
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200/15 bg-[radial-gradient(circle_at_12%_10%,rgba(45,212,191,0.08),transparent_30%),linear-gradient(145deg,rgba(25,28,34,0.96),rgba(14,15,19,0.97))] shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur ${className}`}
    >
      <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-3">
          <p className="font-mono text-xs uppercase text-teal-200">Story</p>
          <h2 className="text-xl font-semibold text-white">敘事紀錄</h2>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
      >
        {storyLines.map((line) => (
          <StoryLine key={line.id} line={line} />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/10 bg-black/10 p-3 sm:p-4"
      >
        <div className="flex gap-2">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-amber-200">
            &gt;
          </span>
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            disabled={loading}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#101216] px-4 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-amber-200/70 focus:ring-2 focus:ring-amber-200/15 disabled:cursor-wait disabled:opacity-60"
            placeholder="look / status / attack / skill fireball / reset"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-w-20 rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60"
          >
            送出
          </button>
        </div>
      </form>
    </section>
  );
}
