import { useMemo, useState } from "react";

const ITEM_META = {
  火把: {
    icon: "🔥",
    type: "工具",
    description: "一支可照明的火把，能在黑暗中提供基本視野。",
  },
  生鏽鑰匙: {
    icon: "🗝",
    type: "鑰匙",
    description: "一把佈滿鏽斑的舊鑰匙，看起來可以打開遺跡深處的門。",
  },
  小型藥水: {
    icon: "🧪",
    type: "消耗品",
    description: "可恢復少量 HP 的藥水。",
    command: "use small_potion",
  },
  古代核心: {
    icon: "💠",
    type: "任務道具",
    description: "遺跡能量的來源，帶回入口或許能完成這次探索。",
  },
};

function getItemMeta(item) {
  return (
    ITEM_META[item] || {
      icon: "◆",
      type: "未知",
      description: "尚未登錄詳細資料的道具。",
    }
  );
}

function InventorySlot({ item, selected, onClick }) {
  const meta = item ? getItemMeta(item) : null;

  return (
    <button
      type="button"
      disabled={!item}
      onClick={onClick}
      className={`aspect-square rounded-md border text-xl transition ${
        selected
          ? "border-amber-200/70 bg-amber-300/15"
          : item
            ? "border-teal-200/25 bg-teal-200/10 hover:border-teal-100/50 hover:bg-teal-200/15"
            : "border-white/10 bg-black/20"
      } disabled:cursor-default`}
    >
      {meta?.icon || ""}
    </button>
  );
}

function ItemGrid({ inventory, selectedItem, setSelectedItem }) {
  const slots = useMemo(() => {
    const slotCount = 25;
    return Array.from({ length: slotCount }, (_, index) => inventory[index] || null);
  }, [inventory]);

  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map((item, index) => (
        <InventorySlot
          key={`${item || "empty"}-${index}`}
          item={item}
          selected={item && selectedItem === item}
          onClick={() => item && setSelectedItem(item)}
        />
      ))}
    </div>
  );
}

function ItemDetail({ selectedItem, loading, onAction }) {
  if (!selectedItem) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-6 text-stone-500">
        點擊道具格子後，這裡會顯示名稱、類型與效果說明。
      </div>
    );
  }

  const meta = getItemMeta(selectedItem);

  return (
    <div className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-black/30 text-xl">
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{selectedItem}</h3>
          <p className="mt-1 font-mono text-[11px] uppercase text-amber-100/70">
            {meta.type}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-300">{meta.description}</p>
      {meta.command ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => onAction(meta.command)}
          className="mt-3 w-full rounded-lg border border-amber-200/40 bg-amber-300/15 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-wait disabled:opacity-60"
        >
          使用道具
        </button>
      ) : null}
    </div>
  );
}

export default function InventoryWindowContent({ inventory = [], loading, onAction }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="space-y-4">
      <ItemGrid
        inventory={inventory}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
      <ItemDetail selectedItem={selectedItem} loading={loading} onAction={onAction} />
    </div>
  );
}
