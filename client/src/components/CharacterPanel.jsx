import { useEffect, useState } from "react";

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

function formatEffectiveStat(value, baseValue) {
  if (
    !Number.isFinite(Number(value)) ||
    !Number.isFinite(Number(baseValue)) ||
    value === baseValue
  ) {
    return value ?? "-";
  }

  const bonus = value - baseValue;
  return `${value} (+${bonus})`;
}

function StatUpgradeCard({ label, value, stat, canUpgrade, loading, onAllocateStat }) {
  return (
    <div className="relative min-h-[74px] rounded-lg border border-white/10 bg-black/20 p-3 text-center">
      {stat && canUpgrade ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => onAllocateStat?.(stat)}
          className="absolute -right-2 -top-2 h-7 w-7 rounded-full border border-amber-200/50 bg-amber-300/20 text-sm font-bold text-amber-50 shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition hover:bg-amber-300/30 disabled:cursor-wait disabled:opacity-60"
          title={`提升 ${label}`}
          aria-label={`提升 ${label}`}
        >
          +
        </button>
      ) : null}
      <p className="font-mono text-[11px] uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

export default function CharacterPanel({ player, flags, loading = false, onAllocateStat, className = "" }) {
  const level = player?.level ?? 1;
  const defense = player?.defense ?? 2;
  const exp = player?.exp ?? 0;
  const nextExp = player?.nextExp ?? 100;
  const name = player?.name || "探索者";
  const title = player?.title || "遺跡冒險者";
  const species = player?.species || player?.race || "人類";
  const classLabel = player?.className || player?.role || "冒險者";
  const portraitUrl = player?.portraitUrl || player?.portrait?.imageUrl || "";
  const statPoints = Number(player?.statPoints) || 0;
  const canUpgrade = statPoints > 0;
  const [portraitFailed, setPortraitFailed] = useState(false);
  const showPortrait = Boolean(portraitUrl) && !portraitFailed;

  useEffect(() => {
    setPortraitFailed(false);
  }, [portraitUrl]);

  return (
    <aside
      className={`flex h-full min-h-[760px] flex-col overflow-hidden rounded-lg border border-white/15 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.10),transparent_34%),radial-gradient(circle_at_100%_30%,rgba(20,184,166,0.08),transparent_36%),linear-gradient(160deg,rgba(27,30,36,0.96),rgba(14,16,20,0.98))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.48)] backdrop-blur sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="min-w-0 truncate text-2xl font-semibold text-white">
              {name}
            </h2>
            <p className="text-lg font-semibold text-amber-100/80">{title}</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-stone-300">
            {species} / {classLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 font-mono text-xs font-semibold text-amber-100">
          Lv. {level}
        </span>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 items-start justify-center">
        <div className="relative aspect-[2/3] max-h-[520px] w-full overflow-hidden rounded-xl border border-amber-200/25 bg-[radial-gradient(circle_at_50%_18%,rgba(245,158,11,0.28),transparent_34%),linear-gradient(160deg,rgba(245,158,11,0.14),rgba(20,184,166,0.18))] p-4">
          {showPortrait ? (
            <img
              src={portraitUrl}
              alt={`${name} portrait`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setPortraitFailed(true)}
            />
          ) : (
            <>
              <div className="absolute inset-x-10 bottom-0 h-56 rounded-t-full border border-white/10 bg-black/25" />
              <div className="absolute inset-x-16 bottom-12 h-36 rounded-t-full bg-amber-100/10 blur-sm" />

              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                <span className="text-8xl font-black tracking-tight text-white/90">AD</span>
                <span className="mt-4 text-sm font-semibold text-amber-100/70">
                  冒險者
                </span>
              </div>
            </>
          )}
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

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
        <p className={`text-xs font-semibold ${canUpgrade ? "text-amber-100" : "text-stone-400"}`}>
          可分配屬性點：{statPoints}
        </p>
        <p className="mt-1 text-[11px] leading-4 text-stone-500">
          升級後可分配 HP / MP / ATK / DEF。
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatUpgradeCard
          label="ATK"
          stat="attack"
          value={formatEffectiveStat(player?.attack, player?.baseAttack)}
          canUpgrade={canUpgrade}
          loading={loading}
          onAllocateStat={onAllocateStat}
        />
        <StatUpgradeCard
          label="DEF"
          stat="defense"
          value={formatEffectiveStat(defense, player?.baseDefense)}
          canUpgrade={canUpgrade}
          loading={loading}
          onAllocateStat={onAllocateStat}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatUpgradeCard
          label="HP"
          stat="maxHp"
          value={player?.maxHp ?? 0}
          canUpgrade={canUpgrade}
          loading={loading}
          onAllocateStat={onAllocateStat}
        />
        <StatUpgradeCard
          label="MP"
          stat="maxMp"
          value={player?.maxMp ?? 0}
          canUpgrade={canUpgrade}
          loading={loading}
          onAllocateStat={onAllocateStat}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {flags?.gameWon ? (
          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            探索完成
          </span>
        ) : null}
        {flags?.gameOver ? (
          <span className="rounded-full bg-red-300/15 px-3 py-1 text-xs font-semibold text-red-100">
            失敗
          </span>
        ) : null}
        {flags?.hasAncientCore ? (
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">
            古代核心
          </span>
        ) : null}
      </div>
    </aside>
  );
}
