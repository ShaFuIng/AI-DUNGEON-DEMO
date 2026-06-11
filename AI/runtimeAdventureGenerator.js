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
  const characterSkills = character.skills || [];
  const starterEquipment = character.starterEquipment || character.equipment || [];

  gameData.player = {
    ...(gameData.player || {}),
    hp: attributes.maxHp || gameData.player?.hp || 30,
    maxHp: attributes.maxHp || gameData.player?.maxHp || 30,
    mp: attributes.maxMp || gameData.player?.mp || 12,
    maxMp: attributes.maxMp || gameData.player?.maxMp || 12,
    attack: attributes.attack || gameData.player?.attack || 6,
    defense: attributes.defense || gameData.player?.defense || 2,
    level: 1,
    skills: characterSkills.map((skill) => skill.id),
  };

  gameData.skills = Object.fromEntries(
    characterSkills.map((skill) => [
      skill.id,
      {
        id: skill.id,
        name: skill.name,
        mpCost: skill.mpCost ?? 0,
        damage: skill.damage ?? 0,
        role: skill.role || "damage",
        description: skill.description || "這個技能還沒有詳細說明。",
        flavorText: skill.flavorText || "",
      },
    ])
  );

  const initialRoomId = gameData.initialRoomId || Object.keys(gameData.rooms || {})[0];
  const initialRoom = gameData.rooms?.[initialRoomId];

  for (const item of starterEquipment) {
    if (!item?.id) continue;
    gameData.items[item.id] = {
      id: item.id,
      name: item.name || "起始裝備",
      type: "equipment",
      slot: item.slot || "weapon",
      stats: item.stats || { attack: 1 },
      description: item.description || "角色帶入冒險的起始裝備。",
      usageHint: item.usageHint || `use ${item.id} 裝備。`,
      sourceType: "direct_pickup",
      rarity: item.rarity || "uncommon",
      flavorText: item.flavorText || item.description || "這件裝備與角色背景有所連結。",
      imagePrompt: item.imagePrompt || `fantasy RPG ${item.name || item.id} item icon`,
    };

    if (initialRoom) {
      initialRoom.items = initialRoom.items || [];
      if (!initialRoom.items.includes(item.id)) initialRoom.items.push(item.id);
    }
  }
}

function summarizeGameDataShape(gameData) {
  return {
    rooms: summarizeCollection(gameData?.rooms),
    items: summarizeCollection(gameData?.items),
    monsters: summarizeCollection(gameData?.monsters),
    skills: summarizeCollection(gameData?.skills),
    playerSkills: Array.isArray(gameData?.player?.skills) ? gameData.player.skills.length : typeof gameData?.player?.skills,
    initialRoomId: gameData?.initialRoomId,
    requiredItemId: gameData?.winCondition?.requiredItemId,
  };
}

function summarizeCollection(value) {
  if (Array.isArray(value)) return { type: "array", count: value.length };
  if (value && typeof value === "object") return { type: "object", count: Object.keys(value).length };
  return { type: typeof value, count: 0 };
}

function buildGenerationSummary(gameData, input) {
  const roomCount = Object.keys(gameData.rooms || {}).length;
  const monsterCount = Object.keys(gameData.monsters || {}).length;
  const skillCount = Object.keys(gameData.skills || {}).length;
  return `${input.genre || "冒險"}已生成：${roomCount} 個房間、${monsterCount} 名敵人、${skillCount} 個技能。`;
}

function buildAdventurePreview(gameData, generationSummary = "") {
  const rooms = Object.values(gameData.rooms || {});
  const itemDetails = gameData.items || {};
  const monsterDetails = gameData.monsters || {};
  const winCondition = gameData.winCondition || {};
  const bossRoom =
    rooms.find((room) => room.kind === "boss") ||
    rooms.find((room) => room.items?.includes(winCondition.requiredItemId) && room.monster);

  return {
    title: generationSummary || "冒險預覽",
    playerSummary: summarizePlayer(gameData),
    rooms: rooms.map((room) => buildRoomPreview(room, itemDetails, monsterDetails)),
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
    challenges: rooms.filter((room) => room.challenge).map((room) => buildChallengePreview(room, itemDetails)),
    itemChains: buildItemChains(gameData),
  };
}

function buildRoomPreview(room, itemDetails, monsterDetails) {
  const challenge = room.challenge || null;
  return {
    id: room.id,
    name: room.name,
    kind: room.kind || "lore",
    monsterName: room.monster ? monsterDetails[room.monster]?.name || room.monster : null,
    itemNames: (room.items || []).map((itemId) => itemDetails[itemId]?.name || itemId),
    challengeType: challenge?.type || null,
    requiredItemName: challenge?.requiredItemId ? itemDetails[challenge.requiredItemId]?.name || challenge.requiredItemId : null,
    rewardItemNames: (challenge?.rewardItemIds || []).map((itemId) => itemDetails[itemId]?.name || itemId),
    exits: Object.entries(room.exits || {}).map(([direction, roomId]) => `${direction}: ${roomId}`),
    summary: challenge?.description || room.description || "",
    challengeSummary: challenge?.description || "",
  };
}

function buildChallengePreview(room, itemDetails) {
  const challenge = room.challenge;
  return {
    roomId: room.id,
    roomName: room.name,
    type: challenge.type,
    description: challenge.description,
    solutionHint: challenge.solutionHint,
    requiredItemId: challenge.requiredItemId,
    requiredItemName: itemDetails[challenge.requiredItemId]?.name || challenge.requiredItemId,
    rewardItemIds: challenge.rewardItemIds || [],
    rewardItemNames: (challenge.rewardItemIds || []).map((itemId) => itemDetails[itemId]?.name || itemId),
  };
}

function buildItemChains(gameData) {
  const chains = [];
  const items = gameData.items || {};

  for (const room of Object.values(gameData.rooms || {})) {
    if (!room.challenge?.requiredItemId) continue;
    const requiredItemId = room.challenge.requiredItemId;
    const sources = findItemSources(gameData, requiredItemId);
    chains.push({
      requiredItemId,
      requiredItemName: items[requiredItemId]?.name || requiredItemId,
      source: describeItemSource(gameData, sources[0]),
      challengeRoomId: room.id,
      challengeRoomName: room.name,
      challengeType: room.challenge.type,
      rewardItemIds: room.challenge.rewardItemIds || [],
      rewardItemNames: (room.challenge.rewardItemIds || []).map((itemId) => items[itemId]?.name || itemId),
    });
  }

  return chains;
}

function findItemSources(gameData, itemId) {
  const sources = [];

  for (const room of Object.values(gameData.rooms || {})) {
    if ((room.items || []).includes(itemId)) sources.push({ sourceType: "direct_pickup", roomId: room.id });
    if (room.challenge?.rewardItemIds?.includes(itemId)) {
      sources.push({ sourceType: "puzzle_reward", roomId: room.id });
    }
  }

  for (const room of Object.values(gameData.rooms || {})) {
    const monster = gameData.monsters?.[room.monster];
    if (monster?.drops?.includes(itemId)) sources.push({ sourceType: "monster_drop", roomId: room.id, monsterId: monster.id });
  }

  return sources;
}

function describeItemSource(gameData, source) {
  if (!source) return "未標示來源";
  const roomName = gameData.rooms?.[source.roomId]?.name || source.roomId;
  if (source.sourceType === "direct_pickup") return `${roomName} 可直接取得`;
  if (source.sourceType === "monster_drop") return `${roomName} 的敵人掉落`;
  if (source.sourceType === "puzzle_reward") return `${roomName} 的挑戰獎勵`;
  return `${roomName} 的 ${source.sourceType}`;
}

function summarizePlayer(gameData) {
  const player = gameData.player || {};
  const skillNames = (player.skills || []).map((skillId) => gameData.skills?.[skillId]?.name || skillId);
  return {
    hp: player.maxHp,
    mp: player.maxMp,
    attack: player.attack,
    defense: player.defense,
    skills: skillNames,
  };
}

module.exports = {
  buildAdventurePreview,
  generateRuntimeAdventure,
};
