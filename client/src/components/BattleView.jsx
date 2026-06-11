import { useEffect, useRef } from "react";

function StatBar({ label, value, max, tone = "amber" }) {
  const safeMax = Math.max(Number(max) || 1, 1);
  const safeValue = Math.max(0, Math.min(Number(value) || 0, safeMax));
  const percentage = Math.round((safeValue / safeMax) * 100);
  const fillClass =
    tone === "red" ? "bg-red-300" : tone === "sky" ? "bg-sky-300" : "bg-amber-300";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-stone-300">
        <span>{label}</span>
        <span className="font-mono">
          {safeValue}/{safeMax}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/35">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CombatantCard({ title, name, level, hp, maxHp, mp, maxMp, description, intent, tone }) {
  return (
    <article className="flex min-h-[190px] flex-col justify-between rounded-lg border border-white/10 bg-black/20 p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wide text-stone-400">
              {title}
            </p>
            <h3 className="mt-1 truncate text-xl font-semibold text-white">
              {name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-stone-300">
            Lv {level || 1}
          </span>
        </div>
        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-300">
            {description}
          </p>
        ) : null}
        {intent ? (
          <p className="mt-3 rounded border border-red-200/15 bg-red-400/10 px-2 py-1 text-xs text-red-100">
            Intent: {intent}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <StatBar label="HP" value={hp} max={maxHp} tone={tone} />
        {maxMp ? (
          <div className="mt-3">
            <StatBar label="MP" value={mp} max={maxMp} tone="sky" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function BattleView({
  player,
  enemy,
  battle,
  mode = "explore",
  loading,
  gameOver = false,
  onAction,
}) {
  const logRef = useRef(null);
  const activeEnemy = enemy || null;
  const battleLog = battle?.log || [];
  const battleStatus = battle?.status || "idle";
  const turn = battle?.turn || 0;
  const playerHp = player?.hp ?? player?.stats?.hp ?? 24;
  const playerMaxHp = player?.maxHp ?? player?.stats?.maxHp ?? playerHp;
  const playerMp = player?.mp ?? player?.stats?.mp ?? 0;
  const playerMaxMp = player?.maxMp ?? player?.stats?.maxMp ?? playerMp;
  const hasPotion = (player?.inventory || []).some((item) => {
    const normalized = String(item).toLowerCase();
    return normalized === "small_potion" || normalized.includes("小型藥水");
  });
  const statusText = gameOver
    ? "無法行動"
    : battleStatus === "victory"
      ? "勝利"
      : battleStatus === "escaped"
        ? "已撤退"
        : battleStatus === "defeat"
          ? "敗北"
      : !activeEnemy
        ? "沒有敵人"
        : playerHp <= Math.ceil(playerMaxHp * 0.25)
          ? "瀕死"
          : "戰鬥中";
  const statusTone = gameOver
    ? "border-red-200/35 bg-red-500/15 text-red-50"
    : battleStatus === "victory"
      ? "border-emerald-200/35 bg-emerald-400/15 text-emerald-50"
      : battleStatus === "escaped"
        ? "border-teal-200/35 bg-teal-400/15 text-teal-50"
      : "border-amber-200/25 bg-amber-300/10 text-amber-50";

  const actions = [
    { id: "attack", label: "Attack", command: "attack", disabled: !activeEnemy },
    { id: "slash", label: "Slash", command: "skill slash", disabled: !activeEnemy },
    {
      id: "fireball",
      label: "Fireball",
      command: "skill fireball",
      disabled: !activeEnemy || playerMp < 4,
    },
    {
      id: "guard",
      label: "Guard",
      command: "skill guard",
      disabled: !activeEnemy || playerMp < 2,
    },
    {
      id: "potion",
      label: "Potion",
      command: "use small_potion",
      disabled: !hasPotion || playerHp >= playerMaxHp,
    },
  ];
  const controlsDisabled = loading || mode === "gameOver" || gameOver;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  if (!activeEnemy) {
    return (
      <section className="relative min-h-[420px] overflow-hidden rounded-lg border border-red-200/20 bg-[linear-gradient(145deg,rgba(29,20,20,0.96),rgba(13,14,18,0.98))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.48)] backdrop-blur">
        <header className="border-b border-white/10 pb-4">
          <p className="font-mono text-xs uppercase tracking-wide text-red-200">
            Battle
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">戰鬥資料缺失</h2>
        </header>
        <div className="py-8 text-sm leading-7 text-stone-300">
          <p>目前沒有可戰鬥的敵人資料。你可以先回到地圖，重新觀察房間狀態。</p>
        </div>
        <button
          type="button"
          onClick={() => onAction?.("look")}
          className="rounded-lg border border-amber-200/35 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25"
        >
          重新觀察
        </button>
      </section>
    );
  }

  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-lg border border-red-200/20 bg-[radial-gradient(circle_at_50%_0%,rgba(248,113,113,0.12),transparent_34%),linear-gradient(145deg,rgba(29,20,20,0.96),rgba(13,14,18,0.98))] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.48)] backdrop-blur animate-[battleIn_220ms_ease-out]">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-red-200">
            Battle
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">遭遇戰</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-300">
          <span className="rounded-full border border-red-200/25 bg-red-400/10 px-3 py-1">
            Turn {turn}
          </span>
          <span className={`rounded-full border px-3 py-1 ${statusTone}`}>
            {statusText}
          </span>
        </div>
      </header>

      <div className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] md:items-center">
        <CombatantCard
          title="Player"
          name={player?.name || "冒險者"}
          level={player?.level || 1}
          hp={playerHp}
          maxHp={playerMaxHp}
          mp={playerMp}
          maxMp={playerMaxMp}
          description="你握緊武器，觀察敵人的動作。"
          tone="amber"
        />

        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-200/25 bg-red-400/10 font-mono text-sm font-bold text-red-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            VS
          </div>
        </div>

        <CombatantCard
          title="Enemy"
          name={activeEnemy.name}
          level={activeEnemy.level}
          hp={activeEnemy.hp}
          maxHp={activeEnemy.maxHp}
          description={activeEnemy.description}
          intent={activeEnemy.intent}
          tone="red"
        />
      </div>

      <div className="grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-stone-400">
            Battle Log
          </p>
          <div
            ref={logRef}
            className="h-32 space-y-2 overflow-y-auto pr-2 text-sm leading-6 text-stone-200"
          >
            {(battleLog.length ? battleLog : ["戰鬥開始，請選擇你的行動。"]).map(
              (line, index) => (
                <p key={`${line}-${index}`} className="break-words">
                  {line}
                </p>
              ),
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:w-[440px]">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={controlsDisabled || action.disabled}
              onClick={() => onAction?.(action.command)}
              className="rounded-lg border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-60"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            disabled={controlsDisabled || !activeEnemy}
            onClick={() => onAction?.("escape")}
            className="rounded-lg border border-red-200/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/20 disabled:cursor-wait disabled:opacity-60"
          >
            Escape
          </button>
        </div>
      </div>
    </section>
  );
}
