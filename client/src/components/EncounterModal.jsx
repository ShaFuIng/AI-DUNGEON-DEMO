const fallbackEnemy = {
  name: "遺跡守衛",
};

export default function EncounterModal({ open, enemy, onConfirm, onCancel }) {
  if (!open) return null;

  const activeEnemy = enemy || fallbackEnemy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-red-200/25 bg-[radial-gradient(circle_at_20%_0%,rgba(248,113,113,0.14),transparent_34%),linear-gradient(145deg,rgba(29,20,20,0.98),rgba(13,14,18,0.98))] shadow-[0_0_0_1px_rgba(255,255,255,0.045),0_24px_70px_rgba(0,0,0,0.68)]">
        <header className="border-b border-white/10 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-red-200">
            Encounter
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">遭遇敵人</h2>
        </header>

        <div className="space-y-4 px-5 py-5 text-sm leading-7 text-stone-200">
          <p>你感受到敵意正在逼近。</p>
          <p className="rounded-lg border border-amber-100/15 bg-amber-300/10 px-3 py-2 text-amber-50">
            敵人：{activeEnemy.name}
          </p>
          <p className="text-stone-400">確認後進入戰鬥。</p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/10 bg-black/15 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/[0.08]"
          >
            取消
          </button>
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
