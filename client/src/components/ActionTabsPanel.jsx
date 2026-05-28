import { useMemo, useState } from "react";

const MAIN_TABS = [
  { id: "battle", label: "戰鬥" },
  { id: "inventory", label: "背包" },
  { id: "quick", label: "快速動作" },
];

const BATTLE_SIDE_TABS = [
  { id: "skills", label: "技能" },
  { id: "tree", label: "技能樹" },
];

const INVENTORY_SIDE_TABS = [
  { id: "items", label: "道具" },
];

const SKILLS = [
  {
    label: "Look",
    command: "look",
    icon: "👁",
    type: "常駐",
    description: "觀察目前房間、道具、怪物與可用行動。",
  },
  {
    label: "Attack",
    command: "attack",
    icon: "⚔",
    type: "基礎",
    description: "不消耗 MP 的普通攻擊。",
  },
  {
    label: "Fireball",
    command: "skill fireball",
    icon: "🔥",
    type: "魔法",
    description: "消耗 MP 施放火球，造成較高傷害。",
  },
  {
    label: "Slash",
    command: "skill slash",
    icon: "🗡",
    type: "近戰",
    description: "穩定的斬擊技能，適合一般戰鬥。",
  },
  {
    label: "Guard",
    command: "skill guard",
    icon: "🛡",
    type: "防禦",
    description: "進入防禦姿態，降低下一次受到的傷害。",
  },
];

const SKILL_TREE = [
  { title: "Slash Mastery", branch: "近戰強化", status: "Locked" },
  { title: "Flame Control", branch: "火焰專精", status: "Locked" },
  { title: "Iron Guard", branch: "防禦姿態", status: "Locked" },
];

const QUICK_ACTIONS = [
  { label: "Status", command: "status", icon: "📜" },
  { label: "Help", command: "help", icon: "?" },
  { label: "Log", command: "log", icon: "☰" },
  { label: "Reset", command: "reset", icon: "↺", danger: true },
];

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

function TabButton({ tab, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-amber-200/50 bg-amber-300/15 text-amber-50 shadow-ember"
          : "border-white/10 bg-white/[0.04] text-stone-400 hover:border-white/20 hover:text-stone-100"
      }`}
    >
      {tab.label}
    </button>
  );
}

function SideTabButton({ tab, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-20 rounded-lg border px-2 text-sm font-bold tracking-wide transition [writing-mode:vertical-rl] ${
        active
          ? "border-teal-200/50 bg-teal-300/15 text-teal-50"
          : "border-white/10 bg-black/20 text-stone-500 hover:text-stone-200"
      }`}
    >
      {tab.label}
    </button>
  );
}

function SkillButton({ skill, loading, onAction }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onAction(skill.command)}
      className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-left transition hover:border-amber-200/40 hover:bg-amber-200/10 disabled:cursor-wait disabled:opacity-60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-black/30 text-lg">
        {skill.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-white">{skill.label}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-stone-400">
            {skill.type}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-stone-500">
          {skill.description}
        </span>
      </span>
      <span className="text-lg text-stone-500 transition group-hover:text-amber-100">›</span>
    </button>
  );
}

function BattleTab({ activeSideTab, setActiveSideTab, loading, onAction }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_54px] gap-3">
      <div className="min-h-0 overflow-y-auto pr-1">
        {activeSideTab === "skills" ? (
          <div className="grid gap-2">
            {SKILLS.map((skill) => (
              <SkillButton
                key={skill.command}
                skill={skill}
                loading={loading}
                onAction={onAction}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200/20 bg-amber-300/10 p-4">
              <p className="font-mono text-xs uppercase text-amber-200">Skill Tree</p>
              <h3 className="mt-2 text-lg font-semibold text-white">技能樹預覽</h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                這裡先作為未來職業與技能成長系統的預留 UI，目前不影響遊戲規則。
              </p>
            </div>
            <div className="grid gap-2">
              {SKILL_TREE.map((node) => (
                <div
                  key={node.title}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{node.title}</p>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-stone-500">
                      {node.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{node.branch}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid content-start gap-2">
        {BATTLE_SIDE_TABS.map((tab) => (
          <SideTabButton
            key={tab.id}
            tab={tab}
            active={activeSideTab === tab.id}
            onClick={() => setActiveSideTab(tab.id)}
          />
        ))}
      </div>
    </div>
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

function InventoryTab({ activeSideTab, setActiveSideTab, inventory, selectedItem, setSelectedItem, loading, onAction }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_54px] gap-3">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4">
          <ItemGrid
            inventory={inventory}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
          <ItemDetail selectedItem={selectedItem} loading={loading} onAction={onAction} />
        </div>
      </div>

      <div className="grid content-start gap-2">
        {INVENTORY_SIDE_TABS.map((tab) => (
          <SideTabButton
            key={tab.id}
            tab={tab}
            active={activeSideTab === tab.id}
            onClick={() => setActiveSideTab(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

function QuickActionTab({ loading, onAction }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.command}
          type="button"
          disabled={loading}
          onClick={() => onAction(action.command)}
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
  );
}

export default function ActionTabsPanel({ inventory = [], loading, onAction }) {
  const [activeMainTab, setActiveMainTab] = useState("battle");
  const [battleSideTab, setBattleSideTab] = useState("skills");
  const [inventorySideTab, setInventorySideTab] = useState("items");
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <aside className="flex h-[420px] min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#171a1f]/90 shadow-panel backdrop-blur">
      <div className="shrink-0 border-b border-white/10 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {MAIN_TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeMainTab === tab.id}
              onClick={() => setActiveMainTab(tab.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        {activeMainTab === "battle" ? (
          <BattleTab
            activeSideTab={battleSideTab}
            setActiveSideTab={setBattleSideTab}
            loading={loading}
            onAction={onAction}
          />
        ) : null}

        {activeMainTab === "inventory" ? (
          <InventoryTab
            activeSideTab={inventorySideTab}
            setActiveSideTab={setInventorySideTab}
            inventory={inventory}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            loading={loading}
            onAction={onAction}
          />
        ) : null}

        {activeMainTab === "quick" ? (
          <QuickActionTab loading={loading} onAction={onAction} />
        ) : null}
      </div>
    </aside>
  );
}
