const DIRECTIONS = ["north", "south", "east", "west"];
const OPPOSITE_DIRECTION = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};
const CHALLENGE_TYPES = ["item_puzzle", "locked_door", "mechanism", "trap", "sealed_chest"];
const FORBIDDEN_CHALLENGE_TYPES = ["riddle", "answer_riddle", "text_answer", "guess", "answer", "solve", "say"];

function validateRuntimeGameData(gameData) {
  const errors = [];

  if (!gameData || typeof gameData !== "object" || Array.isArray(gameData)) {
    return { ok: false, errors: ["gameData must be an object."] };
  }

  assertObjectMap(gameData.rooms, "rooms", errors);
  assertObjectMap(gameData.items, "items", errors);
  assertObjectMap(gameData.monsters, "monsters", errors);
  assertObjectMap(gameData.skills, "skills", errors);
  if (errors.length > 0) return { ok: false, errors };

  const rooms = gameData.rooms || {};
  const items = gameData.items || {};
  const monsters = gameData.monsters || {};
  const skills = gameData.skills || {};
  const roomIds = Object.keys(rooms);

  if (roomIds.length === 0) errors.push("rooms must contain at least one room.");
  if (!gameData.initialRoomId || !rooms[gameData.initialRoomId]) {
    errors.push("initialRoomId must reference an existing room.");
  }

  for (const roomId of roomIds) {
    const room = rooms[roomId];
    validateRoom(gameData, roomId, room, errors);
  }

  validateItems(items, errors);
  validateMonsters(monsters, errors);
  validateSkills(skills, errors);
  validatePlayer(gameData.player, skills, errors);
  validateWinCondition(gameData, errors);
  validateChallengeItemObtainability(gameData, errors);

  if (!hasReachableRooms(rooms, gameData.initialRoomId, roomIds.length)) {
    errors.push("all rooms must be reachable from initialRoomId.");
  }

  const hasPotion = Object.values(items).some((item) => item.type === "consumable" && Number(item.effect?.hp) > 0);
  const hasMonsterRoom = roomIds.some((roomId) => rooms[roomId].monster);
  const hasQuestItem = Object.values(items).some((item) => item.type === "quest");
  const hasEquipment = Object.values(items).some((item) => item.type === "equipment");
  const hasEquipmentBeforeBoss = hasPreBossEquipment(gameData);
  const hasChallenge = Object.values(rooms).some((room) => room.challenge);
  const functionalRoomCount = Object.values(rooms).filter((room) => hasGameplayFunction(room)).length;
  const emptyRoomCount = roomIds.length - functionalRoomCount;

  if (!hasPotion) errors.push("at least one healing consumable is required.");
  if (!hasMonsterRoom) errors.push("at least one monster encounter is required.");
  if (!hasQuestItem) errors.push("at least one quest item is required.");
  if (!hasEquipment) errors.push("at least one equipment item is required.");
  if (!hasEquipmentBeforeBoss) errors.push("at least one equipment item must be obtainable before the boss.");
  if (!hasChallenge) errors.push("at least one item-based challenge is required.");
  if (roomIds.length > 0 && emptyRoomCount / roomIds.length > 0.2) {
    errors.push(`too many empty rooms: ${emptyRoomCount}/${roomIds.length}`);
  }
  if (!hasDamageSkill(skills)) errors.push("at least one damage skill is required.");
  if (!Object.values(skills).some((skill) => ["defense", "utility", "heal"].includes(skill.role))) {
    errors.push("at least one defense, utility, or heal skill is required.");
  }

  validateBossBalance(gameData, rooms, monsters, errors);
  validateRequiredBossDefeated(gameData, rooms, monsters, errors);

  return { ok: errors.length === 0, errors };
}

function validateRoom(gameData, roomId, room, errors) {
  const rooms = gameData.rooms || {};
  const items = gameData.items || {};
  const monsters = gameData.monsters || {};

  if (room.id !== roomId) errors.push(`room key ${roomId} must match room.id.`);
  if (!room.name) errors.push(`room ${roomId} is missing name.`);
  if (!room.description) errors.push(`room ${roomId} is missing description.`);
  if (!["start", "combat", "puzzle", "treasure", "rest", "key", "boss", "lore"].includes(room.kind)) {
    errors.push(`room ${roomId} is missing valid kind.`);
  }

  for (const [direction, targetRoomId] of Object.entries(room.exits || {})) {
    if (!DIRECTIONS.includes(direction)) errors.push(`room ${roomId} has invalid exit direction ${direction}.`);
    if (!rooms[targetRoomId]) {
      errors.push(`room ${roomId} exit ${direction} points to missing room ${targetRoomId}.`);
      continue;
    }
    const oppositeDirection = OPPOSITE_DIRECTION[direction];
    if (rooms[targetRoomId].exits?.[oppositeDirection] !== roomId) {
      errors.push(`exit ${roomId}.${direction} must be mirrored by ${targetRoomId}.${oppositeDirection}.`);
    }
  }

  for (const itemId of room.items || []) {
    if (!items[itemId]) errors.push(`room ${roomId} references missing item ${itemId}.`);
  }

  if (room.monster !== null && room.monster !== undefined && !monsters[room.monster]) {
    errors.push(`room ${roomId} references missing monster ${room.monster}.`);
  }

  if (!room.challenge) return;

  if (FORBIDDEN_CHALLENGE_TYPES.includes(room.challenge.type)) {
    errors.push(`room ${roomId} challenge uses forbidden text-answer type ${room.challenge.type}.`);
  }
  if (!CHALLENGE_TYPES.includes(room.challenge.type)) {
    errors.push(`room ${roomId} challenge has invalid type ${room.challenge.type}.`);
  }
  if (!room.challenge.description) errors.push(`room ${roomId} challenge is missing description.`);
  if (!room.challenge.requiredItemId) {
    errors.push(`room ${roomId} challenge is missing requiredItemId.`);
  } else if (!items[room.challenge.requiredItemId]) {
    errors.push(`room ${roomId} challenge references missing requiredItemId ${room.challenge.requiredItemId}.`);
  }
  for (const rewardItemId of room.challenge.rewardItemIds || []) {
    if (!items[rewardItemId]) errors.push(`room ${roomId} challenge references missing reward item ${rewardItemId}.`);
  }
  for (const direction of room.challenge.blockedExits || []) {
    if (!DIRECTIONS.includes(direction)) {
      errors.push(`room ${roomId} challenge has invalid blockedExits direction ${direction}.`);
    }
    if (!room.exits?.[direction]) {
      errors.push(`room ${roomId} challenge blocks missing exit direction ${direction}.`);
    }
  }
  for (const direction of room.challenge.unlocksExits || []) {
    if (!DIRECTIONS.includes(direction)) {
      errors.push(`room ${roomId} challenge has invalid unlocksExits direction ${direction}.`);
    }
    if (!room.exits?.[direction] && room.challenge.unlocksExit?.direction !== direction) {
      errors.push(`room ${roomId} challenge unlocks missing exit direction ${direction}.`);
    }
  }
  if (room.challenge.unlocksExit) {
    const { direction, roomId: targetRoomId } = room.challenge.unlocksExit;
    if (!DIRECTIONS.includes(direction) || !rooms[targetRoomId]) {
      errors.push(`room ${roomId} challenge has invalid unlocksExit.`);
    }
  }
  if (room.challenge.unlocksRoom && !rooms[room.challenge.unlocksRoom]) {
    errors.push(`room ${roomId} challenge unlocks missing room ${room.challenge.unlocksRoom}.`);
  }
}

function validateItems(items, errors) {
  for (const [itemId, item] of Object.entries(items)) {
    if (item.id !== itemId) errors.push(`item key ${itemId} must match item.id.`);
    if (!item.name || !item.description || !item.type || !item.usageHint) {
      errors.push(`item ${itemId} must include name, description, type, and usageHint.`);
    }
    if (!["direct_pickup", "puzzle_reward", "monster_drop", "sealed_chest", "boss_reward"].includes(item.sourceType)) {
      errors.push(`item ${itemId} must include valid sourceType.`);
    }
    if (!["common", "uncommon", "rare"].includes(item.rarity)) {
      errors.push(`item ${itemId} must include valid rarity.`);
    }
    if (!item.flavorText) errors.push(`item ${itemId} must include flavorText.`);
    if (!item.imagePrompt) errors.push(`item ${itemId} must include imagePrompt.`);
    if (item.type === "consumable" && !Number.isFinite(Number(item.effect?.hp))) {
      errors.push(`consumable item ${itemId} must include effect.hp.`);
    }
    if (item.type === "equipment") {
      if (!["weapon", "armor", "accessory"].includes(item.slot)) errors.push(`equipment item ${itemId} is missing slot.`);
      if (!item.stats || typeof item.stats !== "object" || Array.isArray(item.stats)) {
        errors.push(`equipment item ${itemId} is missing stats.`);
      }
    }
  }
}

function validateMonsters(monsters, errors) {
  for (const [monsterId, monster] of Object.entries(monsters)) {
    if (monster.id !== monsterId) errors.push(`monster key ${monsterId} must match monster.id.`);
    for (const field of ["name", "maxHp", "hp", "attack", "defense", "expReward", "description"]) {
      if (monster[field] === undefined || monster[field] === null || monster[field] === "") {
        errors.push(`monster ${monsterId} is missing ${field}.`);
      }
    }
    if (!Array.isArray(monster.drops)) errors.push(`monster ${monsterId} drops must be an array.`);
  }
}

function validateSkills(skills, errors) {
  const skillIds = Object.keys(skills);
  if (skillIds.length < 3) errors.push("skills must contain at least 3 skills.");

  for (const [skillId, skill] of Object.entries(skills)) {
    if (skill.id !== skillId) errors.push(`skill key ${skillId} must match skill.id.`);
    for (const field of ["name", "mpCost", "damage", "description"]) {
      if (skill[field] === undefined || skill[field] === null || skill[field] === "") {
        errors.push(`skill ${skillId} is missing ${field}.`);
      }
    }
    if (!["basic", "signature", "damage", "defense", "heal", "utility"].includes(skill.role)) {
      errors.push(`skill ${skillId} is missing valid role.`);
    }
    for (const numericField of ["hitCount", "heal", "shield", "defenseBonus", "duration"]) {
      if (skill[numericField] !== undefined && !Number.isFinite(Number(skill[numericField]))) {
        errors.push(`skill ${skillId} has invalid numeric field ${numericField}.`);
      }
    }
  }
}

function validatePlayer(player = {}, skills, errors) {
  const playerSkills = player.skills || [];
  if (!Array.isArray(playerSkills) || playerSkills.length < 3) {
    errors.push("player.skills must contain at least 3 skill ids.");
  }
  for (const skillId of playerSkills) {
    if (!skills[skillId]) errors.push(`player references missing skill ${skillId}.`);
  }
}

function validateWinCondition(gameData, errors) {
  const winCondition = gameData.winCondition || {};
  if (winCondition.type !== "return_with_item") errors.push("winCondition.type must be return_with_item.");
  if (!gameData.items?.[winCondition.requiredItemId]) {
    errors.push("winCondition.requiredItemId must reference an existing item.");
  }
  if (!gameData.rooms?.[winCondition.returnRoomId]) {
    errors.push("winCondition.returnRoomId must reference an existing room.");
  }
}

function validateChallengeItemObtainability(gameData, errors) {
  for (const room of Object.values(gameData.rooms || {})) {
    if (!room.challenge) continue;
    const requiredItemId = room.challenge.requiredItemId;
    if (!requiredItemId || !gameData.items?.[requiredItemId]) continue;

    const sources = findItemSources(gameData, requiredItemId);
    if (sources.length === 0) {
      errors.push(`room ${room.id} challenge required item ${requiredItemId} has no source.`);
      continue;
    }

    const usefulSources = sources.filter((source) => isValidChallengeItemSource(gameData, source, room));
    if (usefulSources.length === 0) {
      errors.push(`room ${room.id} challenge required item ${requiredItemId} appears only behind its own gate or after the challenge.`);
    }
  }
}

function findItemSources(gameData, itemId) {
  const sources = [];

  for (const room of Object.values(gameData.rooms || {})) {
    if ((room.items || []).includes(itemId)) {
      sources.push({ sourceType: "direct_pickup", roomId: room.id });
    }
    if (room.challenge?.rewardItemIds?.includes(itemId)) {
      sources.push({ sourceType: "puzzle_reward", roomId: room.id, challengeId: `${room.id}:challenge` });
    }
  }

  for (const room of Object.values(gameData.rooms || {})) {
    const monster = gameData.monsters?.[room.monster];
    if (monster?.drops?.includes(itemId)) {
      sources.push({
        sourceType: monster.isBoss || monster.role === "boss" || room.kind === "boss" ? "boss_reward" : "monster_drop",
        roomId: room.id,
        monsterId: monster.id,
      });
    }
  }

  return sources;
}

function isValidChallengeItemSource(gameData, source, challengeRoom) {
  if (!source || source.roomId === challengeRoom.id) return false;
  const sourceRoom = gameData.rooms?.[source.roomId];
  if (!sourceRoom || sourceRoom.kind === "boss") return false;
  if (source.challengeId === `${challengeRoom.id}:challenge`) return false;
  return getRoomOrder(gameData, source.roomId) <= getRoomOrder(gameData, challengeRoom.id);
}

function hasPreBossEquipment(gameData) {
  const bossRoom = findBossRoom(gameData);
  return Object.values(gameData.rooms || {}).some(
    (room) =>
      room.id !== bossRoom?.id &&
      (room.items || []).some((itemId) => gameData.items?.[itemId]?.type === "equipment")
  );
}

function hasGameplayFunction(room) {
  return (
    room.kind === "start" ||
    room.kind === "rest" ||
    room.kind === "lore" ||
    room.kind === "boss" ||
    Boolean(room.monster) ||
    Boolean(room.challenge) ||
    (room.items || []).length > 0
  );
}

function hasSkillRole(skills, role) {
  return Object.values(skills || {}).some((skill) => skill.role === role);
}

function hasDamageSkill(skills) {
  return Object.values(skills || {}).some((skill) => Number(skill.damage) > 0);
}

function validateBossBalance(gameData, rooms, monsters, errors) {
  const playerMaxHp = Number(gameData.player?.maxHp) || 30;
  const playerAttack = Number(gameData.player?.attack) || 6;
  const expectedDpr = Math.max(playerAttack, averageDamageSkill(gameData));
  const bossRoom = Object.values(rooms).find((room) => room.kind === "boss");

  if (!bossRoom?.monster || !monsters[bossRoom.monster]) {
    errors.push("boss room must contain a boss monster.");
    return;
  }

  const boss = monsters[bossRoom.monster];
  if (Number(boss.attack) > Math.ceil(playerMaxHp / 4)) errors.push("boss attack is too high for player maxHp.");
  if (Number(boss.maxHp) > expectedDpr * 10) errors.push("boss maxHp is too high for level 1 player.");
}

function validateRequiredBossDefeated(gameData, rooms, monsters, errors) {
  const winCondition = gameData.winCondition || {};
  if (!winCondition.requiredBossDefeated) return;
  const guardingRoom = Object.values(rooms).find((room) => (room.items || []).includes(winCondition.requiredItemId));
  if (!guardingRoom?.monster || !monsters[guardingRoom.monster]) {
    errors.push("required quest item must be guarded by a monster when requiredBossDefeated is true.");
  }
}

function averageDamageSkill(gameData) {
  const damageSkills = Object.values(gameData.skills || {}).filter((skill) => Number(skill.damage) > 0);
  if (damageSkills.length === 0) return 0;
  return Math.round(damageSkills.reduce((sum, skill) => sum + Number(skill.damage), 0) / damageSkills.length);
}

function assertObjectMap(value, fieldName, errors) {
  if (Array.isArray(value)) {
    errors.push(`${fieldName} must be object map, but got array.`);
    return;
  }
  if (!value || typeof value !== "object") errors.push(`${fieldName} must be object map.`);
}

function hasReachableRooms(rooms, initialRoomId, expectedCount) {
  if (!initialRoomId || !rooms[initialRoomId]) return false;
  const visited = new Set();
  const queue = [initialRoomId];

  while (queue.length > 0) {
    const roomId = queue.shift();
    if (visited.has(roomId)) continue;
    visited.add(roomId);

    for (const targetRoomId of Object.values(rooms[roomId].exits || {})) {
      if (rooms[targetRoomId] && !visited.has(targetRoomId)) queue.push(targetRoomId);
    }
  }

  return visited.size === expectedCount;
}

function findBossRoom(gameData) {
  const requiredItemId = gameData.winCondition?.requiredItemId;
  return (
    Object.values(gameData.rooms || {}).find((room) => room.kind === "boss") ||
    Object.values(gameData.rooms || {}).find((room) => room.monster && room.items?.includes(requiredItemId))
  );
}

function getRoomOrder(gameData, roomId) {
  return Object.keys(gameData.rooms || {}).indexOf(roomId);
}

module.exports = {
  validateRuntimeGameData,
  findItemSources,
  validateChallengeItemObtainability,
};
