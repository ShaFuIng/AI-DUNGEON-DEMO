function ResourceBar({ label, value = 0, max = 1, tone }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const toneClass = tone === "hp" ? "bg-red-400" : "bg-sky-300";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-stone-200">{label}</span>
        <span className="font-mono text-stone-400">
          {value}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full ${toneClass} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

const BATTLE_ACTIONS = [
  { label: "Attack", command: "attack", icon: "⚔" },
  { label: "Slash", command: "skill slash", icon: "🗡" },
  { label: "Fireball", command: "skill fireball", icon: "🔥" },
  { label: "Guard", command: "skill guard", icon: "🛡" },
];

const UTILITY_ACTIONS = [
  { label: "Look", command: "look" },
  { label: "Status", command: "status" },
  { label: "Reset", command: "reset", danger: true },
];

function ActionCard({ action, loading, onAction }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onAction(action.command)}
      className={`group flex min-h-14 items-center gap-3 rounded-lg border px-3 text-left transition disabled:cursor-wait disabled:opacity-60 ${
        action.danger
          ? "border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
          : "border-white/10 bg-white/[0.05] text-stone-100 hover:border-amber-200/40 hover:bg-amber-200/10"
      }`}
    >
      {action.icon ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-black/25 text-base">
          {action.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{action.label}</span>
        <span className="block truncate font-mono text-[11px] uppercase text-stone-500">
          {action.command}
        </span>
      </span>
      <span className="text-lg text-stone-500 transition group-hover:text-amber-100">
        ›
      </span>
    </button>
  );
}

export default function CharacterPanel({ player, flags, loading, onAction }) {
  const level = 1;
  const speed = 8;
  const canRunAction = typeof onAction === "function";

  return (
    <aside className="rounded-lg border border-white/10 bg-[#171a1f]/90 p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase text-amber-200">Character</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">探索者</h2>
          <p className="mt-1 text-sm text-stone-400">人類 / 冒險者</p>
        </div>
        <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 font-mono text-xs font-semibold text-amber-100">
          Lv. {level}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_118px] gap-4">
        <div className="relative min-h-48 overflow-hidden rounded-xl border border-amber-200/25 bg-[radial-gradient(circle_at_50%_18%,rgba(245,158,11,0.28),transparent_34%),linear-gradient(160deg,rgba(245,158,11,0.14),rgba(20,184,166,0.18))] p-4">
          <div className="absolute inset-x-6 bottom-0 h-36 rounded-t-full border border-white/10 bg-black/25" />
          <div className="absolute inset-x-10 bottom-8 h-20 rounded-t-full bg-amber-100/10 blur-sm" />
          <div className="relative z-10 flex h-full min-h-40 flex-col items-center justify-center text-center">
            <span className="text-5xl font-black tracking-tight text-white/90">AD</span>
            <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-amber-100/70">
              Adventurer
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <StatCard label="ATK" value={player?.attack ?? "-"} />
          <StatCard label="SPD" value={speed} />
          <StatCard label="Room" value={player?.currentRoom || "-"} />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <ResourceBar
          label="HP"
          value={player?.hp ?? 0}
          max={player?.maxHp ?? 1}
          tone="hp"
        />
        <ResourceBar
          label="MP"
          value={player?.mp ?? 0}
          max={player?.maxMp ?? 1}
          tone="mp"
        />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase text-teal-200">Battle</p>
            <h3 className="mt-1 text-lg font-semibold text-white">快速戰鬥</h3>
          </div>
          <span className="text-xs text-stone-500">Skills</span>
        </div>

        <div className="grid gap-2">
          {BATTLE_ACTIONS.map((action) => (
            <ActionCard
              key={action.command}
              action={action}
              loading={loading || !canRunAction}
              onAction={onAction}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {UTILITY_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            disabled={loading || !canRunAction}
            onClick={() => onAction(action.command)}
            className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
              action.danger
                ? "border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                : "border-white/10 bg-white/[0.04] text-stone-200 hover:border-teal-200/40 hover:bg-teal-200/10"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {flags?.gameWon ? (
          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            Victory
          </span>
        ) : null}
        {flags?.gameOver ? (
          <span className="rounded-full bg-red-300/15 px-3 py-1 text-xs font-semibold text-red-100">
            Game Over
          </span>
        ) : null}
        {flags?.hasAncientCore ? (
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">
            Ancient Core
          </span>
        ) : null}
      </div>
    </aside>
  );
}
