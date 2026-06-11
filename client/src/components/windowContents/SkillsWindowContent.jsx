import { useState } from "react";
import { formatSkillNumbers, getSkillRoleLabel } from "../../utils/formatSkillNumbers.js";

const SKILL_TREE = [
  { title: "Slash Mastery", branch: "近戰強化", status: "Locked" },
  { title: "Flame Control", branch: "火焰專精", status: "Locked" },
  { title: "Iron Guard", branch: "防禦姿態", status: "Locked" },
];

const SKILL_TABS = [
  { id: "list", label: "技能列表" },
  { id: "tree", label: "技能樹" },
];

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

function SkillTree() {
  return (
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
  );
}

function getSkillIcon(role) {
  if (role === "defense") return "盾";
  if (role === "utility") return "技";
  return "斬";
}

function normalizeSkills(skills) {
  const runtimeSkills = (skills || []).map((skill) => ({
    label: skill.name || skill.id,
    command: `skill ${skill.id}`,
    icon: getSkillIcon(skill.role),
    type: `${getSkillRoleLabel(skill)} / ${formatSkillNumbers(skill)}`,
    description: skill.description || "這個技能還沒有詳細說明。",
  }));

  return [
    {
      label: "Look",
      command: "look",
      icon: "看",
      type: "常駐",
      description: "觀察目前房間、道具、怪物與可用行動。",
    },
    {
      label: "Attack",
      command: "attack",
      icon: "攻",
      type: "基礎",
      description: "不消耗 MP 的普通攻擊。",
    },
    ...runtimeSkills,
  ];
}

export default function SkillsWindowContent({ skills = [], loading, onAction }) {
  const [activeTab, setActiveTab] = useState("list");
  const visibleSkills = normalizeSkills(skills);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {SKILL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-amber-200/50 bg-amber-300/15 text-amber-50"
                : "border-white/10 bg-white/[0.04] text-stone-400 hover:border-white/20 hover:text-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "list" ? (
        <div className="grid gap-2">
          {visibleSkills.map((skill) => (
            <SkillButton
              key={skill.command}
              skill={skill}
              loading={loading}
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <SkillTree />
      )}
    </div>
  );
}
