const DEFAULT_DIRECTIONS = ["north", "east", "south", "west"];

function normalizeRuntimeGameData(rawGameData = {}) {
  const gameData = cloneObject(rawGameData);
  const roomEntries = normalizeEntityMap(gameData.rooms, "room");

  gameData.rooms = Object.fromEntries(
    roomEntries.map(([roomId, room], index) => {
      const normalizedRoom = {
        ...room,
        id: toSnakeCaseId(room.id || roomId || room.name, `room_${index + 1}`),
        name: room.name || `房間 ${index + 1}`,
        description: room.description || "這裡還沒有明確描述。",
        kind: normalizeRoomKind(room.kind, index),
        ascii: room.ascii || "",
        exits: normalizeExits(room.exits),
        items: room.items || [],
        monster: room.monster ?? null,
        challenge: normalizeChallengeShape(room.challenge),
      };

      return [normalizedRoom.id, normalizedRoom];
    })
  );

  const roomIdMap = buildIdMap(roomEntries.map(([roomId, room]) => room.id || roomId || room.name), Object.keys(gameData.rooms));
  remapRoomExits(gameData.rooms, roomIdMap);

  gameData.items = normalizeItems(gameData.items);
  gameData.monsters = normalizeMonsters(gameData.monsters);
  gameData.skills = normalizeSkills(gameData.skills);
  gameData.player = normalizePlayer(gameData.player, gameData.skills);

  normalizeRoomReferences(gameData);
  normalizeChallengeReferences(gameData);
  normalizeWinCondition(gameData);

  return gameData;
}

function normalizeItems(rawItems) {
  const entries = normalizeEntityMap(rawItems, "item");

  return Object.fromEntries(
    entries.map(([key, item], index) => {
      const id = toSnakeCaseId(item.id || key || item.name, `item_${index + 1}`);
      const type = normalizeItemType(item.type);
      const normalizedItem = {
        ...item,
        id,
        name: item.name || `道具 ${index + 1}`,
        description: item.description || item.usageHint || "這個道具還沒有詳細說明。",
        type,
        usageHint: item.usageHint || item.description || "可在合適時機使用。",
      };

      if (type === "consumable") {
        normalizedItem.effect = normalizeHealingEffect(item.effect, item);
      }

      if (type === "equipment") {
        normalizedItem.slot = normalizeEquipmentSlot(item.slot, index);
        normalizedItem.stats = normalizeEquipmentStats(item.stats, normalizedItem.slot);
      }

      return [id, normalizedItem];
    })
  );
}

function normalizeMonsters(rawMonsters) {
  const entries = normalizeEntityMap(rawMonsters, "monster");

  return Object.fromEntries(
    entries.map(([key, monster], index) => {
      const id = toSnakeCaseId(monster.id || key || monster.name, `monster_${index + 1}`);
      const maxHp = positiveNumber(monster.maxHp ?? monster.hp, 18 + index * 8);
      const hp = positiveNumber(monster.hp ?? monster.maxHp, maxHp);

      return [
        id,
        {
          ...monster,
          id,
          name: monster.name || `敵人 ${index + 1}`,
          maxHp,
          hp,
          attack: positiveNumber(monster.attack ?? monster.damage, 4 + index * 2),
          defense: nonNegativeNumber(monster.defense, index === entries.length - 1 ? 2 : 1),
          expReward: nonNegativeNumber(monster.expReward ?? monster.exp, 10 + index * 10),
          drops: Array.isArray(monster.drops) ? monster.drops : [],
          description: monster.description || "一個阻擋去路的敵人。",
        },
      ];
    })
  );
}

function normalizeSkills(rawSkills) {
  const entries = normalizeEntityMap(rawSkills, "skill");

  return Object.fromEntries(
    entries.map(([key, skill], index) => {
      const id = toSnakeCaseId(skill.id || key || skill.name, `skill_${index + 1}`);
      const mpCost = nonNegativeNumber(skill.mpCost ?? skill.cost, index === 0 ? 0 : index + 2);
      const role = normalizeSkillRole(skill.role, index);
      const damage = nonNegativeNumber(
        skill.damage,
        role === "defense" || role === "utility" ? 0 : 8 + index * 4
      );

      return [
        id,
        {
          ...skill,
          id,
          name: skill.name || `技能 ${index + 1}`,
          mpCost,
          damage,
          role,
          description: skill.description || "這個技能還沒有詳細說明。",
        },
      ];
    })
  );
}

function normalizePlayer(rawPlayer = {}, skills = {}) {
  const skillIds = Object.keys(skills);
  const requestedSkills = Array.isArray(rawPlayer.skills)
    ? rawPlayer.skills
    : Object.values(rawPlayer.skills || {});
  const normalizedSkills = requestedSkills
    .map((skill) => matchEntityId(skill, skills))
    .filter(Boolean);

  return {
    ...rawPlayer,
    hp: positiveNumber(rawPlayer.hp, 30),
    maxHp: positiveNumber(rawPlayer.maxHp ?? rawPlayer.hp, 30),
    mp: nonNegativeNumber(rawPlayer.mp, 10),
    maxMp: positiveNumber(rawPlayer.maxMp ?? rawPlayer.mp, 10),
    attack: positiveNumber(rawPlayer.attack, 6),
    defense: nonNegativeNumber(rawPlayer.defense, 2),
    level: positiveNumber(rawPlayer.level, 1),
    skills: unique([...normalizedSkills, ...skillIds]).slice(0, Math.max(3, Math.min(skillIds.length, 3))),
  };
}

function normalizeRoomReferences(gameData) {
  const itemIdMap = buildNameMap(gameData.items);
  const monsterIdMap = buildNameMap(gameData.monsters);

  for (const room of Object.values(gameData.rooms)) {
    const rawItems = Array.isArray(room.items) ? room.items : Object.values(room.items || {});
    room.items = rawItems
      .map((item) => matchEntityId(item, gameData.items, itemIdMap))
      .filter(Boolean);

    if (room.monster === null || room.monster === undefined || room.monster === "") {
      room.monster = null;
    } else {
      room.monster = matchEntityId(room.monster, gameData.monsters, monsterIdMap);
    }
  }
}

function normalizeChallengeReferences(gameData) {
  const itemIdMap = buildNameMap(gameData.items);

  for (const room of Object.values(gameData.rooms || {})) {
    if (!room.challenge) continue;

    room.challenge.requiredItemId = matchEntityId(
      room.challenge.requiredItemId,
      gameData.items,
      itemIdMap
    );
    room.challenge.rewardItemIds = (room.challenge.rewardItemIds || [])
      .map((itemId) => matchEntityId(itemId, gameData.items, itemIdMap))
      .filter(Boolean);
  }
}

function normalizeWinCondition(gameData) {
  const rooms = gameData.rooms || {};
  const items = gameData.items || {};
  const winCondition = {
    type: "return_with_item",
    requiredItemId: gameData.winCondition?.requiredItemId,
    returnRoomId: gameData.winCondition?.returnRoomId,
    requiredBossDefeated: gameData.winCondition?.requiredBossDefeated !== false,
  };
  const itemNameMap = buildNameMap(items);

  winCondition.requiredItemId =
    matchEntityId(winCondition.requiredItemId, items, itemNameMap) ||
    findItemByType(items, "quest") ||
    Object.keys(items)[0];
  winCondition.returnRoomId =
    rooms[winCondition.returnRoomId] ? winCondition.returnRoomId : gameData.initialRoomId || Object.keys(rooms)[0];

  const guardingRoom = Object.values(rooms).find((room) =>
    (room.items || []).includes(winCondition.requiredItemId)
  );
  if (winCondition.requiredBossDefeated && guardingRoom && !guardingRoom.monster) {
    guardingRoom.monster = Object.keys(gameData.monsters || {}).at(-1) || null;
  }

  gameData.winCondition = winCondition;
  gameData.initialRoomId = rooms[gameData.initialRoomId] ? gameData.initialRoomId : Object.keys(rooms)[0];
}

function normalizeEntityMap(value, fallbackPrefix) {
  if (Array.isArray(value)) {
    return value.map((item, index) => [item?.id || item?.name || `${fallbackPrefix}_${index + 1}`, normalizeObject(item)]);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => [key, normalizeObject(item)]);
  }

  return [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeExits(exits) {
  if (!exits || typeof exits !== "object" || Array.isArray(exits)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(exits)
      .filter(([direction]) => DEFAULT_DIRECTIONS.includes(direction))
      .map(([direction, roomId]) => [direction, String(roomId)])
  );
}

function remapRoomExits(rooms, roomIdMap) {
  for (const room of Object.values(rooms)) {
    room.exits = Object.fromEntries(
      Object.entries(room.exits || {})
        .map(([direction, targetRoomId]) => [direction, roomIdMap.get(String(targetRoomId)) || targetRoomId])
        .filter(([, targetRoomId]) => rooms[targetRoomId])
    );
  }
}

function buildIdMap(rawIds, normalizedIds) {
  const idMap = new Map();
  rawIds.forEach((rawId, index) => {
    if (rawId) idMap.set(String(rawId), normalizedIds[index]);
  });
  return idMap;
}

function buildNameMap(map) {
  const nameMap = new Map();
  for (const [id, entity] of Object.entries(map || {})) {
    nameMap.set(id, id);
    if (entity.name) nameMap.set(toSnakeCaseId(entity.name, id), id);
    if (entity.id) nameMap.set(entity.id, id);
  }
  return nameMap;
}

function matchEntityId(value, map, nameMap = buildNameMap(map)) {
  if (!value) return null;

  if (typeof value === "object") {
    return matchEntityId(value.id || value.name, map, nameMap);
  }

  const rawId = String(value);
  const normalizedId = toSnakeCaseId(rawId, rawId);
  return map[rawId] ? rawId : nameMap.get(rawId) || nameMap.get(normalizedId) || null;
}

function findItemByType(items, type) {
  return Object.values(items).find((item) => item.type === type)?.id || null;
}

function normalizeItemType(type) {
  const normalized = String(type || "material").toLowerCase();
  if (normalized === "quest_item") return "quest";
  if (["key", "consumable", "equipment", "quest", "material"].includes(normalized)) {
    return normalized;
  }
  return "material";
}

function normalizeRoomKind(kind, index) {
  const normalized = String(kind || "").toLowerCase();
  const allowed = ["start", "combat", "puzzle", "treasure", "rest", "key", "boss", "lore"];

  if (allowed.includes(normalized)) {
    return normalized;
  }

  return index === 0 ? "start" : "lore";
}

function normalizeChallengeShape(challenge) {
  if (!challenge || typeof challenge !== "object" || Array.isArray(challenge)) {
    return null;
  }

  const type = String(challenge.type || "puzzle").toLowerCase();

  return {
    type: ["puzzle", "locked_door", "trap", "riddle"].includes(type) ? type : "puzzle",
    description: challenge.description || "這裡有一個尚未解開的機關。",
    requiredItemId: challenge.requiredItemId || null,
    solutionHint: challenge.solutionHint || "仔細觀察並嘗試使用合適的物品。",
    rewardItemIds: Array.isArray(challenge.rewardItemIds) ? challenge.rewardItemIds : [],
  };
}

function normalizeEquipmentSlot(slot, index) {
  const normalized = String(slot || "").toLowerCase();

  if (["weapon", "armor", "accessory"].includes(normalized)) {
    return normalized;
  }

  return index % 3 === 0 ? "weapon" : index % 3 === 1 ? "armor" : "accessory";
}

function normalizeEquipmentStats(stats, slot) {
  const normalizedStats = stats && typeof stats === "object" && !Array.isArray(stats) ? stats : {};
  const result = {};

  for (const stat of ["attack", "defense", "maxHp", "maxMp"]) {
    const value = nonNegativeNumber(normalizedStats[stat], 0);
    if (value > 0) result[stat] = value;
  }

  if (Object.keys(result).length > 0) {
    return result;
  }

  if (slot === "weapon") return { attack: 2 };
  if (slot === "armor") return { defense: 1, maxHp: 4 };
  return { maxMp: 2 };
}

function normalizeSkillRole(role, index) {
  const normalized = String(role || "").toLowerCase();
  if (["damage", "defense", "utility"].includes(normalized)) {
    return normalized;
  }
  return index === 2 ? "defense" : "damage";
}

function normalizeHealingEffect(effect, item) {
  const hp = Number(effect?.hp ?? item.hp ?? item.heal ?? item.healing ?? item.effect_value);
  return {
    hp: Number.isFinite(hp) && hp > 0 ? hp : 10,
  };
}

function positiveNumber(value, fallback) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function unique(items) {
  return [...new Set(items)];
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toSnakeCaseId(text, fallbackPrefix = "id") {
  const normalized = String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return normalized || fallbackPrefix;
}

module.exports = {
  normalizeRuntimeGameData,
  toSnakeCaseId,
};
