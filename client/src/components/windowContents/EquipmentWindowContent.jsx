const EQUIPMENT = [
  { slot: "武器", name: "Rusty Blade", icon: "†" },
  { slot: "防具", name: "Empty", icon: "▣" },
  { slot: "飾品", name: "Empty", icon: "◇" },
  { slot: "飾品", name: "Empty", icon: "◇" },
];

export default function EquipmentWindowContent() {
  return (
    <div className="grid gap-3">
      {EQUIPMENT.map((equipment, index) => {
        const isEmpty = equipment.name === "Empty";

        return (
          <div
            key={`${equipment.slot}-${equipment.name}-${index}`}
            className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3"
          >
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-lg text-amber-100/80">
              {equipment.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-400">{equipment.slot}</p>
              <p
                className={`truncate text-base font-semibold ${
                  isEmpty ? "text-stone-500" : "text-white"
                }`}
              >
                {equipment.name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
