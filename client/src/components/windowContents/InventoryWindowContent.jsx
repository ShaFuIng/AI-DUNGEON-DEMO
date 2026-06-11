import { useEffect, useMemo, useRef, useState } from "react";

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
      command: normalized.command || (normalized.id ? `use ${normalized.id}` : null),
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
      command: meta.command || (meta.id ? `use ${meta.id}` : null),
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
      onClick={(event) => onClick?.(event)}
      onMouseEnter={(event) => onHover?.(event)}
      onMouseLeave={onLeave}
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

function ItemGrid({
  inventory,
  selectedItem,
  onSelectItem,
  onHoverItem,
  onLeaveItem,
}) {
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
          onClick={(event) => item && onSelectItem(item, event)}
          onHover={(event) => item && onHoverItem(item, event)}
          onLeave={onLeaveItem}
        />
      ))}
    </div>
  );
}

function ItemTooltip({ item, position }) {
  if (!item || !position) return null;
  return (
    <div
      className="pointer-events-none absolute z-30 w-64 rounded-lg border border-amber-200/25 bg-[#11100e]/95 p-3 text-left text-xs leading-5 text-stone-200 shadow-2xl shadow-black/50 backdrop-blur"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-black/35 text-lg">
          {item.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase text-amber-100/70">
            {item.type}
          </p>
        </div>
      </div>
      <p className="mt-3 text-stone-300">{item.description}</p>
      <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-stone-300">
        <p>
          <span className="font-semibold text-stone-100">效果：</span>
          {formatEffect(item.effect || item.stats)}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-stone-100">用途：</span>
          {item.usageHint || "目前沒有額外用途提示。"}
        </p>
      </div>
    </div>
  );
}

function ItemActionMenu({ item, position, loading, onUse, onClose }) {
  if (!item || !position) return null;

  return (
    <div
      className="absolute z-40 w-36 rounded-lg border border-white/15 bg-[#11100e]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-white">{item.name}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 transition hover:border-red-200/40 hover:text-red-100"
        >
          X
        </button>
      </div>
      <button
        type="button"
        disabled={loading || !item.command}
        onClick={() => onUse(item)}
        className="w-full rounded-md border border-amber-200/35 bg-amber-300/15 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-55"
      >
        使用
      </button>
    </div>
  );
}

export default function InventoryWindowContent({
  inventory = [],
  itemDetails = {},
  loading,
  onAction,
}) {
  const containerRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const normalizedInventory = useMemo(
    () => inventory.map((item) => normalizeItem(item, itemDetails)),
    [inventory, itemDetails],
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeActionMenu();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && selectedItem) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeActionMenu();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [selectedItem]);

  function getFloatingPosition(event, width = 256, height = 160) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();

    if (!containerRect) {
      return { x: 0, y: 0 };
    }

    let x = targetRect.right - containerRect.left + 8;
    let y = targetRect.top - containerRect.top;

    const maxX = containerRect.width - width - 8;
    const maxY = containerRect.height - height - 8;

    if (x > maxX) {
      x = targetRect.left - containerRect.left - width - 8;
    }

    if (x < 8) {
      x = 8;
    }

    if (y > maxY) {
      y = Math.max(8, maxY);
    }

    return { x, y: Math.max(8, y) };
  }

  function closeActionMenu() {
    setSelectedItem(null);
    setMenuPosition(null);
  }

  function handleSelectItem(item, event) {
    setSelectedItem(item);
    setHoveredItem(null);
    setTooltipPosition(null);
    setMenuPosition(getFloatingPosition(event, 144, 96));
  }

  function handleHoverItem(item, event) {
    if (selectedItem) return;
    setHoveredItem(item);
    setTooltipPosition(getFloatingPosition(event, 256, 180));
  }

  function handleLeaveItem() {
    setHoveredItem(null);
    setTooltipPosition(null);
  }

  function handleUseItem(item) {
    const command = item.command || (item.id ? `use ${item.id}` : null);
    if (!command) return;
    onAction(command);
    closeActionMenu();
  }

  return (
    <div ref={containerRef} className="relative">
      <ItemGrid
        inventory={normalizedInventory}
        selectedItem={selectedItem}
        onSelectItem={handleSelectItem}
        onHoverItem={handleHoverItem}
        onLeaveItem={handleLeaveItem}
      />
      <ItemTooltip item={hoveredItem} position={tooltipPosition} />
      <ItemActionMenu
        item={selectedItem}
        position={menuPosition}
        loading={loading}
        onUse={handleUseItem}
        onClose={closeActionMenu}
      />
    </div>
  );
}
