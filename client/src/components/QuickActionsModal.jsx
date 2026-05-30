const QUICK_ACTIONS = [
  { label: "Status", command: "status", icon: "📜" },
  { label: "Help", command: "help", icon: "?" },
  { label: "Log", command: "log", icon: "☰" },
  { label: "Reset", command: "reset", icon: "↺", danger: true },
];

export default function QuickActionsModal({ open, loading, onAction, onClose }) {
  if (!open) {
    return null;
  }

  function handleAction(command) {
    onAction(command);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#171a1f]/95 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
          <h3 className="text-base font-semibold text-white">Quick Actions</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-stone-400 transition hover:border-red-200/40 hover:bg-red-400/10 hover:text-red-100"
          >
            X
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.command}
              type="button"
              disabled={loading}
              onClick={() => handleAction(action.command)}
              className={`flex min-h-20 items-center gap-3 rounded-lg border px-4 text-left transition disabled:cursor-wait disabled:opacity-60 ${
                action.danger
                  ? "border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                  : "border-white/10 bg-white/[0.05] text-stone-100 hover:border-teal-200/40 hover:bg-teal-200/10"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-black/30 text-lg">
                {action.icon}
              </span>
              <span>
                <span className="block text-base font-semibold">{action.label}</span>
                <span className="block font-mono text-[11px] uppercase text-stone-500">
                  {action.command}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
