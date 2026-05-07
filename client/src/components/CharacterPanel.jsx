function StatBar({ label, value = 0, max = 1, tone }) {
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

export default function CharacterPanel({ player, flags }) {
  const inventory = player?.inventory || [];

  return (
    <aside className="rounded-lg border border-white/10 bg-[#171a1f]/90 p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-amber-200/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.28),rgba(20,184,166,0.2))]">
          <span className="text-2xl font-bold text-white">AD</span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase text-amber-200">
            Character
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">探索者</h2>
          <p className="mt-1 truncate text-sm text-stone-400">
            {player?.currentRoom || "未知位置"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <StatBar
          label="HP"
          value={player?.hp ?? 0}
          max={player?.maxHp ?? 1}
          tone="hp"
        />
        <StatBar
          label="MP"
          value={player?.mp ?? 0}
          max={player?.maxMp ?? 1}
          tone="mp"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase text-stone-500">
            Attack
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-white">
            {player?.attack ?? "-"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase text-stone-500">
            Room
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-white">
            {player?.currentRoom || "-"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-200">Inventory</h3>
          <span className="font-mono text-xs text-stone-500">
            {inventory.length} items
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {inventory.length ? (
            inventory.map((item) => (
              <div
                key={item}
                className="min-h-16 rounded-lg border border-teal-200/20 bg-teal-200/10 p-3 text-sm font-medium text-teal-50"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-center text-sm text-stone-500">
              背包是空的
            </div>
          )}
        </div>
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
