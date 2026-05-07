import { useState } from "react";

export default function CommandBar({ loading, onSubmit }) {
  const [command, setCommand] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(command);
    setCommand("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t border-white/10 bg-black/20 p-3 sm:p-4"
    >
      <span className="flex h-11 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-amber-200">
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
        className="rounded-lg border border-amber-200/40 bg-amber-300/15 px-4 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60"
      >
        送出
      </button>
    </form>
  );
}
