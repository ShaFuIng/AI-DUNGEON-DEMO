import { useMemo, useState } from "react";

const ITEM_META = {
  火把: {
    id: "torch",
    name: "火把",
    icon: "🔥",
    type: "material",
    description: "一支可照明的火把，能在黑暗中提供基本視野。",
    usageHint: "可作為探索黑暗房間時的基礎照明工具。",
  },
  生鏽鑰匙: {
    id: "rusty_key",
    name: "生鏽鑰匙",
    icon: "🗝",
    type: "key",
    description: "一把佈滿鏽斑的舊鑰匙，看起來可以打開遺跡深處的門。",
    usageHint: "可以開啟通往核心密室的沉重石門。",
  },
  小型藥水: {
    id: "small_potion",
    name: "小型藥水",
    icon: "🧪",
    type: "consumable",
    description: "可恢復少量 HP 的藥水。",
    usageHint: "在受傷時使用，可恢復 10 點 HP。",
    effect: { hp: 10 },
    command: "use small_potion",
  },
  古代核心: {
    id: "ancient_core",
    name: "古代核心",
    icon: "💠",
    type: "quest",
    description: "遺跡能量的來源，帶回入口或許能完成這次探索。",
    usageHint: "帶回遺跡入口即可完成這次探索。",
  },
};

function getItemIcon(type) {
  return {
    key: "🗝",
    consumable: "🧪",
    equipment: "†",
    quest: "💠",
    material: "◆",
  }[type] || "◆";
}

function normalizeItem(item, itemDetails = {}) {
  if (!item) return null;

  if (typeof item === "object") {
    const detail = itemDetails[item.id] || {};
    const normalized = { ...detail, ...item };
    return {
      ...normalized,
      name: normalized.name || normalized.id || "未知道具",
      type: normalized.type || "material",
      description: normalized.description || "這個道具還沒有詳細說明。",
      usageHint: normalized.usageHint || "",
      icon: normalized.icon || getItemIcon(normalized.type),
      command:
        normalized.command ||
        (normalized.type === "consumable" && normalized.id
          ? `use ${normalized.id}`
          : null),
    };
  }

  const meta =
    ITEM_META[item] ||
    Object.values(itemDetails).find((detail) => detail?.name === item);

  if (meta) {
    return {
      ...meta,
      name: meta.name || item,
      type: meta.type || "material",
      description: meta.description || "這個道具還沒有詳細說明。",
      usageHint: meta.usageHint || "",
      icon: meta.icon || getItemIcon(meta.type),
      command:
        meta.command ||
        (meta.type === "consumable" && meta.id ? `use ${meta.id}` : null),
    };
  }

  return {
    id: String(item),
    name: String(item),
    icon: "◆",
    type: "material",
    description: "這個道具還沒有詳細說明。",
    usageHint: "",
    command: null,
  };
}

function formatEffect(effect) {
  if (!effect || typeof effect !== "object") {
    return "無特殊數值效果。";
  }

  const parts = Object.entries(effect)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key} ${Number(value) > 0 ? "+" : ""}${value}`);

  return parts.length ? parts.join("、") : "無特殊數值效果。";
}

function InventorySlot({ item, selected, onClick, onHover, onLeave }) {
  const meta = item;

  return (
    <button
      type="button"
      disabled={!item}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      title={meta ? `${meta.name}｜${meta.description}` : ""}
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

function ItemGrid({ inventory, selectedItem, setSelectedItem, setHoveredItem }) {
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
          selected={item && selectedItem?.id === item.id}
          onClick={() => item && setSelectedItem(item)}
          onHover={() => item && setHoveredItem(item)}
          onLeave={() => setHoveredItem(null)}
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

  const meta = selectedItem;

  return (
    <div className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-black/30 text-xl">
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{meta.name}</h3>
          <p className="mt-1 font-mono text-[11px] uppercase text-amber-100/70">
            {meta.type}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-300">{meta.description}</p>
      <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-stone-300">
        <p>
          <span className="font-semibold text-stone-100">效果：</span>
          {formatEffect(meta.effect || meta.stats)}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-stone-100">用途：</span>
          {meta.usageHint || "目前沒有額外用途提示。"}
        </p>
      </div>
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

export default function InventoryWindowContent({
  inventory = [],
  itemDetails = {},
  loading,
  onAction,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const normalizedInventory = useMemo(
    () => inventory.map((item) => normalizeItem(item, itemDetails)),
    [inventory, itemDetails],
  );
  const displayedItem = hoveredItem || selectedItem;

  return (
    <div className="space-y-4">
      <ItemGrid
        inventory={normalizedInventory}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        setHoveredItem={setHoveredItem}
      />
      <ItemDetail selectedItem={displayedItem} loading={loading} onAction={onAction} />
    </div>
  );
}
