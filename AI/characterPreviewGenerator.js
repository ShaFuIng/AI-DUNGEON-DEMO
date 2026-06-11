const { buildCharacterPreviewPrompt } = require("./prompts/buildCharacterPreviewPrompt");
const { generateRuntimeJson } = require("./runtimeProviders/geminiRuntimeProvider");
const { toSnakeCaseId } = require("./normalizers/normalizeRuntimeGameData");
const { parseGeneratedJson } = require("./utils/parseGeneratedJson");

async function generateCharacterPreview(input = {}) {
  const rawText = await generateRuntimeJson({
    apiKey: input.apiKey,
    model: input.model,
    prompt: buildCharacterPreviewPrompt(input),
  });
  const parsed = parseGeneratedJson(rawText, "character preview");
  return normalizeCharacterPreview(parsed, input);
}

function normalizeCharacterPreview(rawCharacter = {}, input = {}) {
  const id = toSnakeCaseId(rawCharacter.id || rawCharacter.name || "adventurer", "adventurer");
  const attributes = rawCharacter.attributes || {};
  const skills = normalizeSkills(rawCharacter.skills);
  const equipment = normalizeEquipment(rawCharacter.equipment);

  return {
    id,
    name: rawCharacter.name || "無名冒險者",
    summary: rawCharacter.summary || "一位即將踏入未知地城的冒險者。",
    background: rawCharacter.background || input.characterPrompt || "背景尚未揭露。",
    attributes: {
      maxHp: positiveNumber(attributes.maxHp ?? attributes.hp, 30),
      maxMp: positiveNumber(attributes.maxMp ?? attributes.mp, 12),
      attack: positiveNumber(attributes.attack, 6),
      defense: nonNegativeNumber(attributes.defense, 2),
    },
    skills,
    equipment,
    traits: Array.isArray(rawCharacter.traits) ? rawCharacter.traits.slice(0, 4) : [],
    appearance: rawCharacter.appearance || "穿著實用旅行裝束，帶著準備探索的神情。",
    imagePrompt:
      rawCharacter.imagePrompt ||
      `Traditional fantasy RPG character portrait, ${rawCharacter.name || "adventurer"}, ${input.genre || "dungeon adventure"}`,
  };
}

function normalizeSkills(rawSkills) {
  const skills = Array.isArray(rawSkills) ? rawSkills : Object.values(rawSkills || {});
  const fallback = [
    { id: "steady_strike", name: "穩定打擊", role: "damage", mpCost: 0, damage: 8, description: "不消耗 MP 的穩定攻擊。" },
    { id: "signature_burst", name: "招牌爆發", role: "damage", mpCost: 4, damage: 14, description: "消耗 MP 造成強力傷害。" },
    { id: "guard_focus", name: "守勢專注", role: "defense", mpCost: 2, damage: 0, description: "進入防禦狀態，降低下一次傷害。" },
  ];
  const source = skills.length >= 3 ? skills : fallback;

  return source.slice(0, 3).map((skill, index) => ({
    id: toSnakeCaseId(skill.id || skill.name, fallback[index].id),
    name: skill.name || fallback[index].name,
    role: ["damage", "defense", "utility"].includes(skill.role) ? skill.role : fallback[index].role,
    mpCost: nonNegativeNumber(skill.mpCost ?? skill.cost, fallback[index].mpCost),
    damage: nonNegativeNumber(skill.damage, fallback[index].damage),
    description: skill.description || fallback[index].description,
  }));
}

function normalizeEquipment(rawEquipment) {
  const equipment = Array.isArray(rawEquipment) ? rawEquipment : Object.values(rawEquipment || {});
  const source = equipment.length
    ? equipment
    : [
        {
          id: "starter_blade",
          name: "旅人短刃",
          type: "equipment",
          slot: "weapon",
          stats: { attack: 1 },
          description: "適合新手冒險者的短刃。",
          usageHint: "冒險開始後可裝備。",
        },
      ];

  return source.slice(0, 2).map((item, index) => ({
    id: toSnakeCaseId(item.id || item.name, `starter_equipment_${index + 1}`),
    name: item.name || `初始裝備 ${index + 1}`,
    type: "equipment",
    slot: ["weapon", "armor", "accessory"].includes(item.slot) ? item.slot : index === 0 ? "weapon" : "armor",
    stats: normalizeStats(item.stats, index),
    description: item.description || "一件適合冒險初期使用的裝備。",
    usageHint: item.usageHint || "冒險開始後可裝備。",
  }));
}

function normalizeStats(stats, index) {
  const source = stats && typeof stats === "object" ? stats : {};
  const normalized = {};

  for (const stat of ["attack", "defense", "maxHp", "maxMp"]) {
    const value = nonNegativeNumber(source[stat], 0);
    if (value > 0) normalized[stat] = value;
  }

  if (Object.keys(normalized).length > 0) return normalized;
  return index === 0 ? { attack: 1 } : { defense: 1 };
}

function positiveNumber(value, fallback) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

module.exports = {
  generateCharacterPreview,
  normalizeCharacterPreview,
};
