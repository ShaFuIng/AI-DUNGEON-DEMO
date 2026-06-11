const fallbackEnemy = {
  name: "未知敵人",
};

export default function EncounterModal({
  open,
  enemy,
  variant = "normal",
  canCancel = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const activeEnemy = enemy || fallbackEnemy;
  const isBoss = variant === "boss";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-red-200/25 bg-[radial-gradient(circle_at_20%_0%,rgba(248,113,113,0.14),transparent_34%),linear-gradient(145deg,rgba(29,20,20,0.98),rgba(13,14,18,0.98))] shadow-[0_0_0_1px_rgba(255,255,255,0.045),0_24px_70px_rgba(0,0,0,0.68)]">
        <header className="border-b border-white/10 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-red-200">
            {isBoss ? "Boss Warning" : "Encounter"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {isBoss ? "危險警告" : "遭遇敵人"}
          </h2>
        </header>

        <div className="space-y-4 px-5 py-5 text-sm leading-7 text-stone-200">
          <p>
            {isBoss
              ? "核心密室深處傳來沉重機械聲。遺跡守護者正在甦醒，繼續前進將進入 Boss 戰。"
              : "敵人擋住去路，你必須先面對它。"}
          </p>
          <p className="rounded-lg border border-amber-100/15 bg-amber-300/10 px-3 py-2 text-amber-50">
            敵人：{activeEnemy.name}
          </p>
          <p className="text-stone-400">
            {isBoss
              ? "你可以暫時撤退，或立刻進入戰鬥。"
              : "若想脫離戰鬥，請進入戰鬥後使用 escape。"}
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/10 bg-black/15 px-5 py-4">
          {canCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08]"
            >
              暫時撤退
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-red-200/35 bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-50 transition hover:bg-red-400/25"
          >
            進入戰鬥
          </button>
        </footer>
      </section>
    </div>
  );
}
