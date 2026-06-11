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
  const starterEquipment = normalizeEquipment(rawCharacter.starterEquipment || rawCharacter.equipment);
  const portraitPrompt = normalizePortraitPrompt(rawCharacter.portraitPrompt, rawCharacter, input);

  return {
    id,
    name: rawCharacter.name || "未命名冒險者",
    title: rawCharacter.title || "新手冒險者",
    summary: rawCharacter.summary || "一位剛踏上旅途、仍在尋找自身命運的冒險者。",
    background: rawCharacter.background || input.characterPrompt || "這名角色的過去仍籠罩在迷霧之中。",
    personality: rawCharacter.personality || "謹慎、好奇，遇到危險時仍願意向前一步。",
    attributes: {
      maxHp: positiveNumber(attributes.maxHp ?? attributes.hp, 30),
      maxMp: positiveNumber(attributes.maxMp ?? attributes.mp, 12),
      attack: positiveNumber(attributes.attack, 6),
      defense: nonNegativeNumber(attributes.defense, 2),
    },
    skills,
    starterEquipment,
    equipment: starterEquipment,
    traits: normalizeTraits(rawCharacter.traits),
    appearance: normalizeAppearance(rawCharacter.appearance),
    portraitPrompt,
    imagePrompt: portraitPrompt.positive,
  };
}

function normalizeSkills(rawSkills) {
  const skills = Array.isArray(rawSkills) ? rawSkills : Object.values(rawSkills || {});
  const fallback = [
    {
      id: "steady_strike",
      name: "穩定一擊",
      role: "damage",
      mpCost: 0,
      damage: 8,
      scaling: "attack",
      hitCount: 1,
      heal: 0,
      shield: 0,
      defenseBonus: 0,
      duration: 0,
      description: "不消耗 MP 的可靠攻擊。",
      flavorText: "每一次出手都像量過距離。",
    },
    {
      id: "signature_burst",
      name: "招牌爆發",
      role: "damage",
      mpCost: 4,
      damage: 14,
      scaling: "attack",
      hitCount: 1,
      heal: 0,
      shield: 0,
      defenseBonus: 0,
      duration: 0,
      description: "消耗 MP 對敵人造成較高傷害。",
      flavorText: "把一路累積的意志凝成瞬間的鋒芒。",
    },
    {
      id: "guard_focus",
      name: "專注防禦",
      role: "defense",
      mpCost: 2,
      damage: 0,
      scaling: "none",
      hitCount: 1,
      heal: 0,
      shield: 0,
      defenseBonus: 2,
      duration: 2,
      description: "進入防禦姿態，降低下一次受到的傷害。",
      flavorText: "在呼吸之間找回重心。",
    },
  ];
  const source = skills.length >= 3 ? skills : fallback;

  return source.slice(0, 3).map((skill, index) => ({
    id: toSnakeCaseId(skill.id || skill.name, fallback[index].id),
    name: skill.name || fallback[index].name,
    role: ["basic", "signature", "damage", "defense", "heal", "utility"].includes(skill.role) ? skill.role : fallback[index].role,
    mpCost: nonNegativeNumber(skill.mpCost ?? skill.cost, fallback[index].mpCost),
    damage: nonNegativeNumber(skill.damage, fallback[index].damage),
    scaling: skill.scaling || fallback[index].scaling || "attack",
    hitCount: Math.max(1, nonNegativeNumber(skill.hitCount, fallback[index].hitCount || 1)),
    heal: nonNegativeNumber(skill.heal, fallback[index].heal || 0),
    shield: nonNegativeNumber(skill.shield, fallback[index].shield || 0),
    defenseBonus: nonNegativeNumber(skill.defenseBonus, fallback[index].defenseBonus || 0),
    duration: nonNegativeNumber(skill.duration, fallback[index].duration || 0),
    description: skill.description || fallback[index].description,
    flavorText: skill.flavorText || fallback[index].flavorText,
  }));
}

function normalizeEquipment(rawEquipment) {
  const equipment = Array.isArray(rawEquipment) ? rawEquipment : Object.values(rawEquipment || {});
  const source = equipment.length
    ? equipment
    : [
        {
          id: "starter_blade",
          name: "入門短刃",
          type: "equipment",
          slot: "weapon",
          stats: { attack: 1 },
          description: "一把保養得宜的短刃，足以支撐最初的探索。",
          usageHint: "使用 use starter_blade 裝備。",
          flavorText: "握柄上還留著前任持有者的刻痕。",
          imagePrompt: "fantasy starter blade, worn leather grip, clean steel, game item icon",
        },
      ];

  return source.slice(0, 2).map((item, index) => ({
    id: toSnakeCaseId(item.id || item.name, `starter_equipment_${index + 1}`),
    name: item.name || `起始裝備 ${index + 1}`,
    type: "equipment",
    slot: ["weapon", "armor", "accessory"].includes(item.slot) ? item.slot : index === 0 ? "weapon" : "armor",
    stats: normalizeStats(item.stats, index),
    description: item.description || "一件能幫助角色撐過初期冒險的裝備。",
    usageHint: item.usageHint || `使用 use ${toSnakeCaseId(item.id || item.name, `starter_equipment_${index + 1}`)} 裝備。`,
    flavorText: item.flavorText || "這件裝備與角色的過去有一點微妙連結。",
    imagePrompt: item.imagePrompt || `fantasy RPG ${item.name || "starter equipment"} item icon, clear readable design`,
  }));
}

function normalizeTraits(rawTraits) {
  const traits = Array.isArray(rawTraits) ? rawTraits : Object.values(rawTraits || {});
  const fallback = [
    { id: "keeps_moving", name: "不輕言退", description: "面對未知時，會先觀察再前進。" },
  ];
  const source = traits.length ? traits : fallback;

  return source.slice(0, 4).map((trait, index) => ({
    id: toSnakeCaseId(trait.id || trait.name, `trait_${index + 1}`),
    name: trait.name || fallback[0].name,
    description: trait.description || trait.summary || fallback[0].description,
  }));
}

function normalizeAppearance(rawAppearance) {
  const appearance = rawAppearance && typeof rawAppearance === "object" && !Array.isArray(rawAppearance)
    ? rawAppearance
    : { signatureFeature: rawAppearance };

  return {
    genderPresentation: appearance.genderPresentation || "中性奇幻冒險者",
    ageLook: appearance.ageLook || "青年",
    bodyType: appearance.bodyType || "輕裝、行動敏捷",
    hair: appearance.hair || "深色短髮",
    eyes: appearance.eyes || "專注明亮的眼神",
    outfit: appearance.outfit || "適合探索地下城的實用服裝",
    signatureFeature: appearance.signatureFeature || "身上帶著與冒險主題相關的小飾物",
    colorPalette: appearance.colorPalette || "深色皮革、暖金屬、低飽和布料",
    mood: appearance.mood || "警覺但堅定",
  };
}

function normalizePortraitPrompt(rawPrompt, rawCharacter, input) {
  const prompt = rawPrompt && typeof rawPrompt === "object" && !Array.isArray(rawPrompt) ? rawPrompt : {};
  const name = rawCharacter.name || "adventurer";
  const positive =
    prompt.positive ||
    rawCharacter.imagePrompt ||
    `Traditional fantasy RPG character portrait, ${name}, ${input.genre || "dungeon adventure"}, detailed outfit, expressive face`;

  return {
    positive,
    negative: prompt.negative || "low quality, blurry, extra fingers, distorted face, unreadable text, watermark",
    style: prompt.style || "fantasy RPG portrait, semi-realistic illustration",
    aspectRatio: prompt.aspectRatio || "1:1",
  };
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
