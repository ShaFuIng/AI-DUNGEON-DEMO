const BASE_ACTIONS = [
  { label: "Look", command: "look" },
  { label: "Status", command: "status" },
  { label: "Attack", command: "attack" },
  { label: "Slash", command: "skill slash" },
  { label: "Fireball", command: "skill fireball" },
  { label: "Guard", command: "skill guard" },
  { label: "Reset", command: "reset", danger: true },
];

function hasSmallPotion(inventory = []) {
  return inventory.some((item) => {
    const normalized = String(item).toLowerCase();
    return normalized === "small_potion" || normalized.includes("小型藥水");
  });
}

export default function ActionButtons({ gameState, loading, onAction }) {
  const actions = [...BASE_ACTIONS];

  if (hasSmallPotion(gameState?.player?.inventory)) {
    actions.splice(6, 0, { label: "Potion", command: "use small_potion" });
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#171a1f]/90 p-4 shadow-panel backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase text-amber-200">
            Actions
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">快速行動</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {actions.map((action) => (
          <button
            key={action.command}
            type="button"
            disabled={loading}
            onClick={() => onAction(action.command)}
            className={`min-h-12 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
              action.danger
                ? "border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                : "border-white/10 bg-white/[0.05] text-stone-100 hover:border-teal-200/40 hover:bg-teal-200/10"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
