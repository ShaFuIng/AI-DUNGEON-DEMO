const { buildRuntimeAdventurePrompt } = require("./prompts/buildRuntimeAdventurePrompt");
const { balanceRuntimeAdventure } = require("./balancers/balanceRuntimeAdventure");
const { normalizeRuntimeGameData } = require("./normalizers/normalizeRuntimeGameData");
const { generateRuntimeJson } = require("./runtimeProviders/geminiRuntimeProvider");
const { parseGeneratedJson } = require("./utils/parseGeneratedJson");
const { validateRuntimeGameData } = require("./validators/validateRuntimeGameData");

async function generateRuntimeAdventure(input = {}) {
  const prompt = buildRuntimeAdventurePrompt(input);
  const rawText = await generateRuntimeJson({
    apiKey: input.apiKey,
    model: input.model,
    prompt,
  });
  const parsedGameData = parseGeneratedJson(rawText, input.label || "runtime adventure");
  console.log("Runtime adventure raw summary:", summarizeGameDataShape(parsedGameData));
  const normalizedGameData = normalizeRuntimeGameData(parsedGameData);
  applyConfirmedCharacter(normalizedGameData, input.confirmedCharacter);
  console.log("Runtime adventure normalized summary:", summarizeGameDataShape(normalizedGameData));
  const gameData = balanceRuntimeAdventure(normalizedGameData, input);
  console.log("Runtime adventure balanced summary:", summarizeGameDataShape(gameData));
  const validation = validateRuntimeGameData(gameData);

  if (!validation.ok) {
    console.error("Runtime adventure validation errors:", validation.errors.join("; "));
    throw new Error(`Generated adventure failed validation: ${validation.errors.join("; ")}`);
  }

  return {
    gameData,
    generationSummary: buildGenerationSummary(gameData, input),
  };
}

function applyConfirmedCharacter(gameData, character) {
  if (!character) return;

  const attributes = character.attributes || {};
  gameData.player = {
    ...(gameData.player || {}),
    hp: attributes.maxHp || gameData.player?.hp || 30,
    maxHp: attributes.maxHp || gameData.player?.maxHp || 30,
    mp: attributes.maxMp || gameData.player?.mp || 12,
    maxMp: attributes.maxMp || gameData.player?.maxMp || 12,
    attack: attributes.attack || gameData.player?.attack || 6,
    defense: attributes.defense || gameData.player?.defense || 2,
    level: 1,
    skills: (character.skills || []).map((skill) => skill.id),
  };

  const characterSkills = Object.fromEntries(
    (character.skills || []).map((skill) => [
      skill.id,
      {
        id: skill.id,
        name: skill.name,
        mpCost: skill.mpCost ?? 0,
        damage: skill.damage ?? 0,
        role: skill.role || "damage",
        description: skill.description || "這個技能還沒有詳細說明。",
      },
    ])
  );
  gameData.skills = {
    ...characterSkills,
    ...gameData.skills,
  };

  const initialRoomId = gameData.initialRoomId || Object.keys(gameData.rooms || {})[0];
  const initialRoom = gameData.rooms?.[initialRoomId];

  for (const item of character.equipment || []) {
    gameData.items[item.id] = {
      id: item.id,
      name: item.name,
      type: "equipment",
      slot: item.slot || "weapon",
      stats: item.stats || { attack: 1 },
      description: item.description || "角色的初始裝備。",
      usageHint: item.usageHint || "冒險開始後可裝備。",
    };

    if (initialRoom && !initialRoom.items.includes(item.id)) {
      initialRoom.items.push(item.id);
    }
  }
}

function summarizeGameDataShape(gameData) {
  return {
    rooms: summarizeCollection(gameData?.rooms),
    items: summarizeCollection(gameData?.items),
    monsters: summarizeCollection(gameData?.monsters),
    skills: summarizeCollection(gameData?.skills),
    playerSkills: Array.isArray(gameData?.player?.skills)
      ? gameData.player.skills.length
      : typeof gameData?.player?.skills,
    initialRoomId: gameData?.initialRoomId,
    requiredItemId: gameData?.winCondition?.requiredItemId,
  };
}

function summarizeCollection(value) {
  if (Array.isArray(value)) {
    return { type: "array", count: value.length };
  }

  if (value && typeof value === "object") {
    return { type: "object", count: Object.keys(value).length };
  }

  return { type: typeof value, count: 0 };
}

function buildGenerationSummary(gameData, input) {
  const roomCount = Object.keys(gameData.rooms || {}).length;
  const monsterCount = Object.keys(gameData.monsters || {}).length;
  const skillCount = Object.keys(gameData.skills || {}).length;

  return [
    `${input.genre || "自訂"}冒險已生成。`,
    `房間 ${roomCount} 間，怪物 ${monsterCount} 種，技能 ${skillCount} 個。`,
  ].join(" ");
}

function buildAdventurePreview(gameData, generationSummary = "") {
  const rooms = Object.values(gameData.rooms || {});
  const itemDetails = gameData.items || {};
  const monsterDetails = gameData.monsters || {};
  const winCondition = gameData.winCondition || {};
  const bossRoom = rooms.find((room) => room.kind === "boss") ||
    rooms.find((room) => room.items?.includes(winCondition.requiredItemId) && room.monster);

  return {
    title: generationSummary || "新冒險預覽",
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      kind: room.kind || "lore",
      itemNames: (room.items || []).map((itemId) => itemDetails[itemId]?.name || itemId),
      monsterName: room.monster ? monsterDetails[room.monster]?.name || room.monster : null,
      challengeType: room.challenge?.type || null,
      challengeSummary: room.challenge?.description || "",
    })),
    boss: bossRoom?.monster
      ? {
          roomName: bossRoom.name,
          name: monsterDetails[bossRoom.monster]?.name || bossRoom.monster,
          maxHp: monsterDetails[bossRoom.monster]?.maxHp,
          attack: monsterDetails[bossRoom.monster]?.attack,
        }
      : null,
    winCondition,
    keyItems: Object.values(itemDetails).filter((item) => item.type === "key" || item.type === "quest"),
    equipment: Object.values(itemDetails).filter((item) => item.type === "equipment"),
    consumables: Object.values(itemDetails).filter((item) => item.type === "consumable"),
    challenges: rooms
      .filter((room) => room.challenge)
      .map((room) => ({
        roomName: room.name,
        type: room.challenge.type,
        description: room.challenge.description,
      })),
  };
}

module.exports = {
  buildAdventurePreview,
  generateRuntimeAdventure,
};
