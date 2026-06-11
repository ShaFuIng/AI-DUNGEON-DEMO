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

function getCommonPrefix(items) {
  if (items.length === 0) return "";

  let prefix = items[0];

  for (const item of items.slice(1)) {
    let index = 0;

    while (
      index < prefix.length &&
      index < item.length &&
      prefix[index].toLowerCase() === item[index].toLowerCase()
    ) {
      index += 1;
    }

    prefix = prefix.slice(0, index);
  }

  return prefix;
}

export default function StoryCommandPanel({
  storyLines,
  loading,
  disabled = false,
  availableCommands = [],
  placeholder = "look / status / attack / skill fireball / reset",
  focusToken = 0,
  onSubmit,
  className = "",
}) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [lastAutocompleteValue, setLastAutocompleteValue] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyLines]);

  useEffect(() => {
    if (focusToken > 0 && !loading && !disabled) {
      inputRef.current?.focus();
    }
  }, [focusToken, loading, disabled]);

  function getMatches(value) {
    const normalizedValue = value.trimStart().toLowerCase();

    if (!normalizedValue) {
      return availableCommands;
    }

    return availableCommands.filter((item) =>
      item.toLowerCase().startsWith(normalizedValue)
    );
  }

  function resetAutocomplete() {
    setSuggestions([]);
    setSuggestionIndex(0);
    setLastAutocompleteValue("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const normalizedCommand = command.trim();

    if (disabled || !normalizedCommand) {
      return;
    }

    setHistory((items) => {
      if (items[items.length - 1] === normalizedCommand) {
        return items;
      }

      return [...items, normalizedCommand];
    });
    setHistoryIndex(null);
    resetAutocomplete();
    onSubmit(normalizedCommand);
    setCommand("");
  }

  function handleAutocomplete() {
    const matches = getMatches(command);

    if (matches.length === 0) {
      resetAutocomplete();
      return;
    }

    if (matches.length === 1) {
      setCommand(matches[0]);
      resetAutocomplete();
      setLastAutocompleteValue(matches[0]);
      return;
    }

    const commonPrefix = getCommonPrefix(matches);

    if (
      commonPrefix.length > command.length &&
      command !== lastAutocompleteValue
    ) {
      setCommand(commonPrefix);
      setSuggestions(matches);
      setSuggestionIndex(0);
      setLastAutocompleteValue(commonPrefix);
      return;
    }

    const nextIndex =
      suggestions.length > 0 && command === lastAutocompleteValue
        ? (suggestionIndex + 1) % matches.length
        : 0;

    setCommand(matches[nextIndex]);
    setSuggestions(matches);
    setSuggestionIndex(nextIndex);
    setLastAutocompleteValue(matches[nextIndex]);
  }

  function handleKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      handleAutocomplete();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (history.length === 0) return;

      const nextIndex =
        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex]);
      resetAutocomplete();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (history.length === 0 || historyIndex === null) return;

      const nextIndex = historyIndex + 1;

      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setCommand("");
      } else {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }

      resetAutocomplete();
    }
  }

  function handleChange(event) {
    setCommand(event.target.value);
    setHistoryIndex(null);
    resetAutocomplete();
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200/15 bg-[radial-gradient(circle_at_12%_10%,rgba(45,212,191,0.08),transparent_30%),linear-gradient(145deg,rgba(25,28,34,0.96),rgba(14,15,19,0.97))] shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur ${className}`}
    >
      <header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-3">
          <p className="font-mono text-xs uppercase text-teal-200">Story</p>
          <h2 className="text-xl font-semibold text-white">故事指令</h2>
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
        {suggestions.length > 1 ? (
          <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] text-stone-300">
            {suggestions.slice(0, 8).map((item, index) => (
              <span
                key={item}
                className={`rounded border px-2 py-0.5 font-mono ${
                  index === suggestionIndex
                    ? "border-amber-200/50 bg-amber-300/15 text-amber-100"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-amber-200">
            &gt;
          </span>
          <input
            ref={inputRef}
            value={command}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading || disabled}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#101216] px-4 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-amber-200/70 focus:ring-2 focus:ring-amber-200/15 disabled:cursor-wait disabled:opacity-60"
            placeholder={placeholder}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || disabled}
            className="min-w-20 rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60"
          >
            送出
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          /help 查看可用指令 · Tab 補全 · ↑/↓ 歷史指令
        </p>
      </form>
    </section>
  );
}
