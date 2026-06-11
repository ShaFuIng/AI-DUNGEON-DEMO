const DIRECTIONS = ["north", "south", "east", "west"];
const OPPOSITE_DIRECTION = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

function validateRuntimeGameData(gameData) {
  const errors = [];

  if (!gameData || typeof gameData !== "object" || Array.isArray(gameData)) {
    return { ok: false, errors: ["gameData must be an object."] };
  }

  assertObjectMap(gameData.rooms, "rooms", errors);
  assertObjectMap(gameData.items, "items", errors);
  assertObjectMap(gameData.monsters, "monsters", errors);
  assertObjectMap(gameData.skills, "skills", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

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
    if (room.id !== roomId) errors.push(`room key ${roomId} must match room.id.`);
    if (!room.name) errors.push(`room ${roomId} is missing name.`);
    if (!room.description) errors.push(`room ${roomId} is missing description.`);

    for (const [direction, targetRoomId] of Object.entries(room.exits || {})) {
      if (!DIRECTIONS.includes(direction)) {
        errors.push(`room ${roomId} has invalid exit direction ${direction}.`);
      }
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
  }

  for (const [itemId, item] of Object.entries(items)) {
    if (item.id !== itemId) errors.push(`item key ${itemId} must match item.id.`);
    if (!item.name || !item.description || !item.type || !item.usageHint) {
      errors.push(`item ${itemId} must include name, description, type, and usageHint.`);
    }
    if (item.type === "consumable" && !Number.isFinite(Number(item.effect?.hp))) {
      errors.push(`consumable item ${itemId} must include effect.hp.`);
    }
  }

  for (const [monsterId, monster] of Object.entries(monsters)) {
    if (monster.id !== monsterId) errors.push(`monster key ${monsterId} must match monster.id.`);
    for (const field of ["name", "maxHp", "hp", "attack", "defense", "expReward", "description"]) {
      if (monster[field] === undefined || monster[field] === null || monster[field] === "") {
        errors.push(`monster ${monsterId} is missing ${field}.`);
      }
    }
    if (Array.isArray(monster.drops) === false) errors.push(`monster ${monsterId} drops must be an array.`);
  }

  const skillIds = Object.keys(skills);
  if (skillIds.length < 3) errors.push("skills must contain at least 3 skills.");
  for (const [skillId, skill] of Object.entries(skills)) {
    if (skill.id !== skillId) errors.push(`skill key ${skillId} must match skill.id.`);
    for (const field of ["name", "mpCost", "damage", "description"]) {
      if (skill[field] === undefined || skill[field] === null || skill[field] === "") {
        errors.push(`skill ${skillId} is missing ${field}.`);
      }
    }
  }

  const playerSkills = gameData.player?.skills || [];
  if (!Array.isArray(playerSkills) || playerSkills.length < 3) {
    errors.push("player.skills must contain at least 3 skill ids.");
  }
  for (const skillId of playerSkills) {
    if (!skills[skillId]) errors.push(`player references missing skill ${skillId}.`);
  }

  const winCondition = gameData.winCondition || {};
  if (winCondition.type !== "return_with_item") {
    errors.push("winCondition.type must be return_with_item.");
  }
  if (!items[winCondition.requiredItemId]) {
    errors.push("winCondition.requiredItemId must reference an existing item.");
  }
  if (!rooms[winCondition.returnRoomId]) {
    errors.push("winCondition.returnRoomId must reference an existing room.");
  }

  if (!hasReachableRooms(rooms, gameData.initialRoomId, roomIds.length)) {
    errors.push("all rooms must be reachable from initialRoomId.");
  }

  const hasPotion = Object.values(items).some((item) => item.type === "consumable" && Number(item.effect?.hp) > 0);
  const hasMonsterRoom = roomIds.some((roomId) => rooms[roomId].monster);
  const hasQuestItem = Object.values(items).some((item) => item.type === "quest");
  if (!hasPotion) errors.push("at least one healing consumable is required.");
  if (!hasMonsterRoom) errors.push("at least one monster encounter is required.");
  if (!hasQuestItem) errors.push("at least one quest item is required.");
  if (winCondition.requiredBossDefeated) {
    const guardingRoom = Object.values(rooms).find((room) =>
      (room.items || []).includes(winCondition.requiredItemId)
    );
    if (!guardingRoom?.monster || !monsters[guardingRoom.monster]) {
      errors.push("required quest item must be guarded by a monster when requiredBossDefeated is true.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function assertObjectMap(value, fieldName, errors) {
  if (Array.isArray(value)) {
    errors.push(`${fieldName} must be object map, but got array.`);
    return;
  }

  if (!value || typeof value !== "object") {
    errors.push(`${fieldName} must be object map.`);
  }
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
      if (rooms[targetRoomId] && !visited.has(targetRoomId)) {
        queue.push(targetRoomId);
      }
    }
  }

  return visited.size === expectedCount;
}

module.exports = {
  validateRuntimeGameData,
};
