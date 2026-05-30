const CHARACTER_TABS = [
  { id: "equipment", label: "裝備" },
  { id: "inventory", label: "背包" },
  { id: "skills", label: "技能" },
];

export default function CharacterSideTabs({ openWindows, onOpenWindow }) {
  return (
    <div className="absolute -right-14 top-24 z-20 grid gap-2">
      {CHARACTER_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onOpenWindow(tab.id)}
          className={`min-h-20 rounded-r-lg border px-2 text-sm font-bold tracking-wide transition [writing-mode:vertical-rl] ${
            openWindows?.[tab.id]
              ? "border-teal-200/50 bg-teal-300/15 text-teal-50 shadow-panel"
              : "border-white/10 bg-black/40 text-stone-400 hover:border-white/20 hover:text-stone-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
