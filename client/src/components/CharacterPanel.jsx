function ResourceBar({ label, value = 0, max = 1, tone = "mp", slim = false }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const toneClass =
    {
      hp: "bg-red-400",
      mp: "bg-sky-300",
      exp: "bg-emerald-300/70",
    }[tone] || "bg-sky-300";

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 shrink-0 text-sm font-bold text-stone-200">
        {label}
      </span>

      <div
        className={`relative flex-1 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10 ${
          slim ? "h-4" : "h-7"
        }`}
      >
        <div
          className={`h-full rounded-full ${toneClass} transition-all`}
          style={{ width: `${percent}%` }}
        />

        <span
          className={`absolute inset-0 flex items-center justify-center font-mono font-semibold text-white drop-shadow ${
            slim ? "text-[10px]" : "text-xs"
          }`}
        >
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, muted = false }) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/20 p-3 text-center ${
        muted ? "opacity-55" : ""
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          muted ? "text-stone-500" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function CharacterPanel({ player, flags, className = "" }) {
  const level = player?.level ?? 1;
  const defense = player?.defense ?? 2;
  const exp = player?.exp ?? 0;
  const nextExp = player?.nextExp ?? 100;

  return (
    <aside
      className={`flex h-full min-h-[760px] flex-col overflow-hidden rounded-lg border border-white/20 bg-[#171a1f]/90 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="shrink-0 text-2xl font-semibold text-white">探索者</h2>
          <p className="shrink-0 text-2xl font-semibold text-stone-300">人類</p>
          <p className="shrink-0 text-2xl font-semibold text-stone-300">冒險者</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 font-mono text-xs font-semibold text-amber-100">
          Lv. {level}
        </span>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 items-start justify-center">
        <div className="relative aspect-[3/5] max-h-[520px] w-full overflow-hidden rounded-xl border border-amber-200/25 bg-[radial-gradient(circle_at_50%_18%,rgba(245,158,11,0.28),transparent_34%),linear-gradient(160deg,rgba(245,158,11,0.14),rgba(20,184,166,0.18))] p-4">
          <div className="absolute inset-x-10 bottom-0 h-56 rounded-t-full border border-white/10 bg-black/25" />
          <div className="absolute inset-x-16 bottom-12 h-36 rounded-t-full bg-amber-100/10 blur-sm" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <span className="text-8xl font-black tracking-tight text-white/90">AD</span>
            <span className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-amber-100/70">
              Adventurer
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
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
        <ResourceBar label="EXP" value={exp} max={nextExp} tone="exp" slim />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        <StatCard label="ATK" value={player?.attack ?? "-"} />
        <StatCard label="DEF" value={defense} />
        <StatCard label="SPD" value="--" muted />
        <StatCard label="LCK" value="--" muted />
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
