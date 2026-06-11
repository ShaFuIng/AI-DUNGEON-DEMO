const SLOT_LABELS = {
  weapon: "武器",
  armor: "防具",
  accessory: "飾品",
};

const SLOT_ICONS = {
  weapon: "†",
  armor: "▣",
  accessory: "◇",
};

function formatStats(stats) {
  if (!stats || typeof stats !== "object") {
    return "無數值加成";
  }

  const parts = Object.entries(stats)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${key} +${value}`);

  return parts.length ? parts.join("、") : "無數值加成";
}

export default function EquipmentWindowContent({ equipmentItems = [] }) {
  const itemsBySlot = Object.fromEntries(
    equipmentItems.map((item) => [item.slot, item])
  );

  return (
    <div className="grid gap-3">
      {Object.keys(SLOT_LABELS).map((slot) => {
        const item = itemsBySlot[slot];

        return (
          <div
            key={slot}
            className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3"
          >
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-lg text-amber-100/80">
              {SLOT_ICONS[slot]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-400">{SLOT_LABELS[slot]}</p>
              <p
                className={`truncate text-base font-semibold ${
                  item ? "text-white" : "text-stone-500"
                }`}
              >
                {item?.name || "Empty"}
              </p>
              {item ? (
                <>
                  <p className="mt-1 text-xs text-amber-100/80">
                    {formatStats(item.stats)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                    {item.description}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
