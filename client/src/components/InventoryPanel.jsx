function InventoryCard({ item }) {
  return (
    <div className="group flex min-h-14 items-center gap-3 rounded-lg border border-teal-200/20 bg-teal-200/10 px-3 py-2 text-teal-50 transition hover:border-teal-100/40 hover:bg-teal-200/15">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-black/25 text-base">
        ◆
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item}</span>
        <span className="block font-mono text-[11px] uppercase text-teal-100/50">
          Inventory Item
        </span>
      </span>
      <span className="text-lg text-teal-100/45 transition group-hover:text-teal-50">
        +
      </span>
    </div>
  );
}

const EQUIPMENT = [
  { slot: "Weapon", name: "Rusty Blade" },
  { slot: "Charm", name: "Empty" },
  { slot: "Relic", name: "Empty" },
];

export default function InventoryPanel({ inventory = [] }) {
  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-[#171a1f]/90 shadow-panel backdrop-blur">
      <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase text-amber-200">Inventory</p>
            <h2 className="mt-2 text-xl font-semibold text-white">背包與裝備</h2>
          </div>
          <span className="font-mono text-xs text-stone-500">
            {inventory.length} items
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-stone-200">Equipment</h3>
          <div className="grid gap-2">
            {EQUIPMENT.map((equipment) => (
              <div
                key={equipment.slot}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <span className="font-mono text-[11px] uppercase tracking-wide text-stone-500">
                  {equipment.slot}
                </span>
                <span
                  className={`truncate text-sm font-semibold ${
                    equipment.name === "Empty" ? "text-stone-500" : "text-stone-100"
                  }`}
                >
                  {equipment.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-stone-200">Items</h3>
          <div className="grid gap-2">
            {inventory.length ? (
              inventory.map((item) => <InventoryCard key={item} item={item} />)
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-5 text-center text-sm text-stone-500">
                背包是空的
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
