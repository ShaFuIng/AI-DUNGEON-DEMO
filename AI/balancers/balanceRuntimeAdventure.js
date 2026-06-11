const CHALLENGE_TYPES = ["item_puzzle", "locked_door", "mechanism", "trap", "sealed_chest"];
const OPPOSITE_DIRECTIONS = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

function balanceRuntimeAdventure(gameData, input = {}) {
  const balanced = cloneObject(gameData);
  const difficulty = clamp(Number(input.difficulty) || 4, 1, 10);

  ensureRoomKinds(balanced);
  ensureItemMetadata(balanced);
  ensureConsumables(balanced, difficulty);
  ensureEquipment(balanced, difficulty);
  ensureChallenge(balanced);
  ensureChallengeItemsObtainable(balanced);
  ensureWinConditionPlacement(balanced);
  balanceSkills(balanced);
  balanceMonsterStats(balanced, difficulty);
  ensureMirroredExits(balanced);
  ensureReachability(balanced);
  ensureMirroredExits(balanced);

  return balanced;
}

function ensureRoomKinds(gameData) {
  const rooms = Object.values(gameData.rooms || {});
  const initialRoomId = gameData.initialRoomId || rooms[0]?.id;
  const bossRoom = findBossRoom(gameData);

  rooms.forEach((room, index) => {
    if (room.id === initialRoomId) room.kind = "start";
    else if (room.id === bossRoom?.id) room.kind = "boss";
    else if (room.monster) room.kind = "combat";
    else if ((room.items || []).some((itemId) => gameData.items?.[itemId]?.type === "equipment")) room.kind = "treasure";
    else if (!room.kind || room.kind === "lore") room.kind = ["puzzle", "key", "rest", "lore"][index % 4];
  });
}

function ensureItemMetadata(gameData) {
  for (const item of Object.values(gameData.items || {})) {
    item.sourceType = item.sourceType || defaultSourceType(item);
    item.rarity = item.rarity || (item.type === "quest" || item.type === "equipment" ? "uncommon" : "common");
    item.flavorText = item.flavorText || item.description || "這個物品與冒險的線索有所呼應。";
    item.imagePrompt = item.imagePrompt || `fantasy RPG ${item.name || item.id} item icon, clear readable design`;
  }
}

function ensureConsumables(gameData, difficulty) {
  const consumables = Object.values(gameData.items || {}).filter((item) => item.type === "consumable");
  if (consumables.length === 0) {
    gameData.items.healing_potion = {
      id: "healing_potion",
      name: "療傷藥水",
      description: "一瓶溫熱的藥水，能在危急時恢復生命。",
      type: "consumable",
      usageHint: "use healing_potion 恢復 12 HP。",
      effect: { hp: 12 },
      sourceType: "direct_pickup",
      rarity: "common",
      flavorText: "瓶身還殘留草藥的苦味。",
      imagePrompt: "small red healing potion bottle, fantasy RPG item icon",
    };
    placeItemBeforeBoss(gameData, "healing_potion");
  }

  if (difficulty >= 4 && Object.values(gameData.items).filter((item) => item.type === "consumable").length < 2) {
    gameData.items.guardian_tonic = {
      id: "guardian_tonic",
      name: "守護者補劑",
      description: "專為挑戰 Boss 前準備的補給。",
      type: "consumable",
      usageHint: "use guardian_tonic 恢復 10 HP。",
      effect: { hp: 10 },
      sourceType: "direct_pickup",
      rarity: "common",
      flavorText: "喝下去時像吞了一口暖光。",
      imagePrompt: "amber fantasy tonic bottle, RPG item icon",
    };
    placeItemBeforeBoss(gameData, "guardian_tonic");
  }
}

function ensureEquipment(gameData, difficulty) {
  const equipment = Object.values(gameData.items || {}).filter((item) => item.type === "equipment");
  if (equipment.length > 0) {
    equipment.forEach((item) => {
      item.sourceType = item.sourceType || "direct_pickup";
      item.rarity = item.rarity || "uncommon";
    });
    ensureEquipmentBeforeBoss(gameData);
    return;
  }

  const defensive = difficulty >= 5;
  const itemId = defensive ? "warded_armor" : "balanced_blade";
  gameData.items[itemId] = defensive
    ? {
        id: itemId,
        name: "護符皮甲",
        description: "鑲著簡易護符的皮甲，適合在 Boss 戰前穿上。",
        type: "equipment",
        slot: "armor",
        stats: { defense: 2, maxHp: 6 },
        usageHint: "use warded_armor 裝備護甲。",
        sourceType: "direct_pickup",
        rarity: "uncommon",
        flavorText: "縫線裡藏著微弱的守護咒。",
        imagePrompt: "fantasy leather armor with small ward charms, RPG item icon",
      }
    : {
        id: itemId,
        name: "平衡短刃",
        description: "重量剛好的短刃，能提高冒險者的輸出。",
        type: "equipment",
        slot: "weapon",
        stats: { attack: 2 },
        usageHint: "use balanced_blade 裝備武器。",
        sourceType: "direct_pickup",
        rarity: "uncommon",
        flavorText: "刀身沒有華麗裝飾，只有實用的鋒利。",
        imagePrompt: "balanced fantasy short blade, RPG item icon",
      };

  placeItemBeforeBoss(gameData, itemId, ["treasure", "key", "rest"]);
}

function ensureEquipmentBeforeBoss(gameData) {
  const bossRoom = findBossRoom(gameData);
  const equipmentIds = Object.values(gameData.items || {}).filter((item) => item.type === "equipment").map((item) => item.id);
  const placedBeforeBoss = Object.values(gameData.rooms || {}).some(
    (room) => room.id !== bossRoom?.id && (room.items || []).some((itemId) => equipmentIds.includes(itemId))
  );
  if (!placedBeforeBoss && equipmentIds[0]) placeItemBeforeBoss(gameData, equipmentIds[0], ["treasure", "key", "rest", "start"]);
}

function ensureChallenge(gameData) {
  const rooms = Object.values(gameData.rooms || {});
  const hasChallenge = rooms.some((room) => room.challenge);
  if (hasChallenge) {
    for (const room of rooms) normalizeChallengeForItemPlay(gameData, room);
    return;
  }

  const targetRoom =
    rooms.find((room) => room.kind === "puzzle") ||
    rooms.find((room) => room.id !== gameData.initialRoomId && room.kind !== "boss") ||
    rooms[0];
  const keyItemId = ensureKeyItem(gameData);

  targetRoom.kind = "puzzle";
  targetRoom.challenge = {
    type: "item_puzzle",
    description: "牆面上有一處凹槽，形狀與某個古老信物相符。",
    requiredItemId: keyItemId,
    solutionHint: `使用 ${gameData.items[keyItemId].name} 可以啟動這裡的機關。`,
    rewardItemIds: [],
    unlocksExit: null,
    unlocksRoom: null,
  };

  placeItemBeforeRoom(gameData, keyItemId, targetRoom.id);
}

function normalizeChallengeForItemPlay(gameData, room) {
  if (!room.challenge) return;
  if (!CHALLENGE_TYPES.includes(room.challenge.type)) room.challenge.type = "item_puzzle";
  if (!room.challenge.requiredItemId || !gameData.items?.[room.challenge.requiredItemId]) {
    room.challenge.requiredItemId = ensureKeyItem(gameData);
  }
  room.challenge.rewardItemIds = Array.isArray(room.challenge.rewardItemIds) ? room.challenge.rewardItemIds : [];
  room.challenge.blockedExits = normalizeDirectionList(room.challenge.blockedExits || room.challenge.blocksExit);
  room.challenge.unlocksExits = normalizeDirectionList(room.challenge.unlocksExits);
  if (room.challenge.unlocksExit?.direction && !room.challenge.unlocksExits.includes(room.challenge.unlocksExit.direction)) {
    room.challenge.unlocksExits.push(room.challenge.unlocksExit.direction);
  }
  if (room.challenge.blockedExits.length === 0 && room.challenge.unlocksExit?.direction) {
    room.challenge.blockedExits.push(room.challenge.unlocksExit.direction);
  }
  if (room.challenge.blockedExits.length === 0) {
    const forwardDirection = chooseForwardExitDirection(gameData, room);
    if (forwardDirection) {
      room.challenge.blockedExits.push(forwardDirection);
      if (!room.challenge.unlocksExits.includes(forwardDirection)) {
        room.challenge.unlocksExits.push(forwardDirection);
      }
    }
  }
  room.challenge.solutionHint =
    room.challenge.solutionHint || `使用 ${gameData.items[room.challenge.requiredItemId]?.name || room.challenge.requiredItemId} 處理這個障礙。`;
}

function ensureChallengeItemsObtainable(gameData) {
  const rooms = Object.values(gameData.rooms || {});

  for (const room of rooms) {
    if (!room.challenge) continue;
    normalizeChallengeForItemPlay(gameData, room);

    const requiredItemId = room.challenge.requiredItemId;
    const item = gameData.items?.[requiredItemId];
    if (!item) continue;

    const usefulSources = findItemSources(gameData, requiredItemId).filter((source) =>
      isValidChallengeItemSource(gameData, source, room)
    );

    if (usefulSources.length === 0) {
      item.sourceType = "direct_pickup";
      placeItemBeforeRoom(gameData, requiredItemId, room.id);
    }
  }

  for (const room of rooms) {
    if (!room.challenge) continue;
    for (const rewardItemId of room.challenge.rewardItemIds || []) {
      if (gameData.items?.[rewardItemId]) {
        gameData.items[rewardItemId].sourceType = room.challenge.type === "sealed_chest" ? "sealed_chest" : "puzzle_reward";
      }
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

function ensureKeyItem(gameData) {
  const keyItem = Object.values(gameData.items || {}).find((item) => item.type === "key" || item.type === "material");
  if (keyItem) {
    keyItem.sourceType = keyItem.sourceType || "direct_pickup";
    return keyItem.id;
  }

  gameData.items.ancient_symbol = {
    id: "ancient_symbol",
    name: "古老符記",
    description: "一枚刻著淺淡紋路的符記，可以與遺跡中的機關呼應。",
    type: "key",
    usageHint: "use ancient_symbol 啟動相符的機關。",
    unlocks: [],
    sourceType: "direct_pickup",
    rarity: "common",
    flavorText: "符記邊緣被磨得發亮，像是曾被反覆握緊。",
    imagePrompt: "ancient stone symbol token, fantasy RPG item icon",
  };

  return "ancient_symbol";
}

function ensureWinConditionPlacement(gameData) {
  const winCondition = gameData.winCondition || {};
  const requiredItemId = winCondition.requiredItemId;
  const bossRoom = findBossRoom(gameData) || Object.values(gameData.rooms || {}).at(-1);
  if (!requiredItemId || !bossRoom) return;

  for (const room of Object.values(gameData.rooms || {})) {
    if (room.id !== bossRoom.id) {
      room.items = (room.items || []).filter((itemId) => itemId !== requiredItemId);
    }
  }

  bossRoom.kind = "boss";
  bossRoom.items = bossRoom.items || [];
  if (!bossRoom.items.includes(requiredItemId)) bossRoom.items.push(requiredItemId);
  if (!bossRoom.monster) bossRoom.monster = ensureBossMonster(gameData);
  if (gameData.items[requiredItemId]) gameData.items[requiredItemId].sourceType = "boss_reward";
  if (gameData.monsters[bossRoom.monster]) {
    gameData.monsters[bossRoom.monster].role = "boss";
    gameData.monsters[bossRoom.monster].isBoss = true;
  }
  gameData.winCondition.requiredBossDefeated = true;
  gameData.winCondition.returnRoomId = gameData.winCondition.returnRoomId || gameData.initialRoomId;
}

function balanceSkills(gameData) {
  const player = gameData.player || {};
  const playerAttack = Number(player.attack) || 6;
  const skills = Object.values(gameData.skills || {});
  const selected = skills.slice(0, 3);

  selected.forEach((skill, index) => {
    skill.hitCount = Math.max(1, Number(skill.hitCount) || 1);
    skill.heal = Number(skill.heal) || 0;
    skill.shield = Number(skill.shield) || 0;
    skill.defenseBonus = Number(skill.defenseBonus) || 0;
    skill.duration = Number(skill.duration) || 0;
    skill.scaling = skill.scaling || "attack";
    skill.flavorText = skill.flavorText || skill.description || "";

    if (index === 0) {
      skill.role = skill.role === "basic" ? "basic" : "damage";
      skill.mpCost = Math.min(Number(skill.mpCost) || 0, 1);
      skill.damage = clamp(Number(skill.damage) || playerAttack + 2, playerAttack + 1, playerAttack + 3);
    } else if (index === 1) {
      skill.role = skill.role === "signature" ? "signature" : "damage";
      skill.mpCost = clamp(Number(skill.mpCost) || 4, 3, 5);
      skill.damage = clamp(Number(skill.damage) || Math.round(playerAttack * 1.8), playerAttack + 4, playerAttack * 2 + 4);
    } else {
      skill.role = ["defense", "utility", "heal"].includes(skill.role) ? skill.role : "defense";
      skill.mpCost = clamp(Number(skill.mpCost) || 3, 2, 4);
      skill.damage = Number(skill.damage) > 0 && skill.role === "utility" ? Number(skill.damage) : 0;
      if (skill.role === "defense" && skill.defenseBonus <= 0 && skill.shield <= 0) {
        skill.defenseBonus = 2;
        skill.duration = Math.max(skill.duration, 2);
      }
    }
  });

  gameData.player.skills = selected.map((skill) => skill.id);
  gameData.player.maxMp = Math.max(Number(gameData.player.maxMp) || 10, (selected[1]?.mpCost || 4) * 2);
  gameData.player.mp = Math.min(Number(gameData.player.mp) || gameData.player.maxMp, gameData.player.maxMp);
}

function balanceMonsterStats(gameData, difficulty) {
  const player = gameData.player || {};
  const playerMaxHp = Number(player.maxHp) || 30;
  const playerAttack = Number(player.attack) || 6;
  const weaponBonus = getBestEquipmentBonus(gameData, "attack");
  const armorDefense = getBestEquipmentBonus(gameData, "defense");
  const playerDpr = Math.max(playerAttack + weaponBonus, averageDamageSkill(gameData) || playerAttack);
  const bossRoom = findBossRoom(gameData);

  for (const room of Object.values(gameData.rooms || {})) {
    if (!room.monster || !gameData.monsters[room.monster]) continue;
    const monster = gameData.monsters[room.monster];
    const isBoss = room.id === bossRoom?.id || room.kind === "boss";

    if (isBoss) {
      monster.maxHp = clamp(Math.round(playerDpr * (5 + difficulty * 0.18)), playerDpr * 5, playerDpr * 7);
      monster.attack = clamp(Math.round(playerMaxHp / (7 - Math.min(difficulty, 6) * 0.25)) - armorDefense, 4, Math.ceil(playerMaxHp / 5));
      monster.defense = Math.min(Number(monster.defense) || 2, 3);
      monster.expReward = Math.max(Number(monster.expReward) || 25, 25);
      monster.role = "boss";
      monster.isBoss = true;
    } else {
      monster.maxHp = clamp(Math.round(playerDpr * (2.5 + difficulty * 0.08)), playerDpr * 2, playerDpr * 4);
      monster.attack = clamp(Math.round(playerMaxHp / 8 + difficulty * 0.4), 3, Math.ceil(playerMaxHp / 5));
      monster.defense = Math.min(Number(monster.defense) || 1, 2);
      monster.expReward = Math.max(Number(monster.expReward) || 10, 10);
    }

    monster.hp = monster.maxHp;
  }
}

function placeItemBeforeBoss(gameData, itemId, preferredKinds = ["rest", "treasure", "key", "lore", "start"]) {
  const bossRoom = findBossRoom(gameData);
  const rooms = Object.values(gameData.rooms || {});
  const room =
    rooms.find((candidate) => candidate.id !== bossRoom?.id && preferredKinds.includes(candidate.kind)) ||
    rooms.find((candidate) => candidate.id !== bossRoom?.id && candidate.id !== gameData.initialRoomId) ||
    rooms[0];
  if (room) addRoomItem(room, itemId);
}

function placeItemBeforeRoom(gameData, itemId, targetRoomId) {
  const rooms = Object.values(gameData.rooms || {});
  const targetIndex = rooms.findIndex((room) => room.id === targetRoomId);
  const candidates = rooms
    .slice(0, Math.max(1, targetIndex))
    .filter((room) => room.id !== targetRoomId && room.kind !== "boss");
  const room = candidates.at(-1) || rooms.find((candidate) => candidate.id !== targetRoomId && candidate.kind !== "boss") || rooms[0];
  if (room) addRoomItem(room, itemId);
}

function addRoomItem(room, itemId) {
  room.items = room.items || [];
  if (!room.items.includes(itemId)) room.items.push(itemId);
}

function getRoomOrder(gameData, roomId) {
  return Object.keys(gameData.rooms || {}).indexOf(roomId);
}

function findBossRoom(gameData) {
  const rooms = Object.values(gameData.rooms || {});
  const requiredItemId = gameData.winCondition?.requiredItemId;
  return (
    rooms.find((room) => room.kind === "boss") ||
    rooms.find((room) => room.items?.includes(requiredItemId) && room.monster) ||
    rooms.find((room) => /boss|final|guardian|golem|lord|king/i.test(String(room.monster || room.id))) ||
    rooms.at(-1)
  );
}

function ensureBossMonster(gameData) {
  const existingBoss = Object.values(gameData.monsters || {}).find((monster) =>
    /boss|final|guardian|golem|lord|king/i.test(monster.id)
  );
  if (existingBoss) return existingBoss.id;

  gameData.monsters.final_guardian = {
    id: "final_guardian",
    name: "終末守衛",
    maxHp: 34,
    hp: 34,
    attack: 7,
    defense: 2,
    expReward: 25,
    drops: [],
    description: "守在最深處的敵人，保護著完成任務所需的關鍵物品。",
    role: "boss",
    isBoss: true,
  };
  return "final_guardian";
}

function averageDamageSkill(gameData) {
  const damageSkills = Object.values(gameData.skills || {}).filter((skill) => Number(skill.damage) > 0);
  if (damageSkills.length === 0) return 0;
  return Math.round(damageSkills.reduce((sum, skill) => sum + Number(skill.damage), 0) / damageSkills.length);
}

function getBestEquipmentBonus(gameData, stat) {
  return Math.max(
    0,
    ...Object.values(gameData.items || {})
      .filter((item) => item.type === "equipment")
      .map((item) => Number(item.stats?.[stat]) || 0)
  );
}

function ensureMirroredExits(gameData) {
  const rooms = gameData.rooms || {};

  for (const room of Object.values(rooms)) {
    room.exits = room.exits || {};

    for (const [direction, targetRoomId] of Object.entries(room.exits)) {
      const targetRoom = rooms[targetRoomId];
      const oppositeDirection = OPPOSITE_DIRECTIONS[direction];
      if (!targetRoom || !oppositeDirection) continue;

      targetRoom.exits = targetRoom.exits || {};
      if (!targetRoom.exits[oppositeDirection]) {
        targetRoom.exits[oppositeDirection] = room.id;
      } else if (targetRoom.exits[oppositeDirection] !== room.id) {
        console.warn(
          `Skipped conflicting mirrored exit: ${targetRoom.id}.${oppositeDirection} already points to ${targetRoom.exits[oppositeDirection]}, expected ${room.id}.`
        );
      }
    }
  }
}

function ensureReachability(gameData) {
  const rooms = gameData.rooms || {};
  const initialRoomId = gameData.initialRoomId || Object.keys(rooms)[0];
  if (!initialRoomId || !rooms[initialRoomId]) return;

  let reachable = getReachableRoomIds(rooms, initialRoomId);
  let unreachable = Object.keys(rooms).filter((roomId) => !reachable.has(roomId));

  while (unreachable.length > 0) {
    const toRoom = rooms[unreachable[0]];
    const connection = findReachableConnection(rooms, reachable, toRoom);
    if (!toRoom || !connection) {
      console.warn(`Unable to connect unreachable room: ${unreachable[0]}`);
      break;
    }

    const { fromRoom, directionPair } = connection;
    fromRoom.exits = fromRoom.exits || {};
    toRoom.exits = toRoom.exits || {};
    fromRoom.exits[directionPair.forward] = toRoom.id;
    toRoom.exits[directionPair.backward] = fromRoom.id;

    reachable = getReachableRoomIds(rooms, initialRoomId);
    unreachable = Object.keys(rooms).filter((roomId) => !reachable.has(roomId));
  }
}

function getReachableRoomIds(rooms, initialRoomId) {
  const visited = new Set();
  const queue = [initialRoomId];

  while (queue.length > 0) {
    const roomId = queue.shift();
    if (visited.has(roomId) || !rooms[roomId]) continue;
    visited.add(roomId);

    for (const targetRoomId of Object.values(rooms[roomId].exits || {})) {
      if (rooms[targetRoomId] && !visited.has(targetRoomId)) queue.push(targetRoomId);
    }
  }

  return visited;
}

function findFreeDirectionPair(fromRoom, toRoom) {
  const preferredPairs = [
    ["east", "west"],
    ["west", "east"],
    ["north", "south"],
    ["south", "north"],
  ];

  return preferredPairs
    .map(([forward, backward]) => ({ forward, backward }))
    .find(({ forward, backward }) => !fromRoom.exits?.[forward] && !toRoom.exits?.[backward]);
}

function findReachableConnection(rooms, reachable, toRoom) {
  for (const roomId of reachable) {
    const fromRoom = rooms[roomId];
    if (!fromRoom) continue;
    const directionPair = findFreeDirectionPair(fromRoom, toRoom);
    if (directionPair) return { fromRoom, directionPair };
  }
  return null;
}

function defaultSourceType(item) {
  if (item.type === "quest") return "boss_reward";
  return "direct_pickup";
}

function normalizeDirectionList(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.filter((direction) => OPPOSITE_DIRECTIONS[direction]))];
}

function chooseForwardExitDirection(gameData, room) {
  const currentOrder = getRoomOrder(gameData, room.id);
  const forwardEntry = Object.entries(room.exits || {}).find(([, targetRoomId]) => getRoomOrder(gameData, targetRoomId) > currentOrder);

  return forwardEntry?.[0] || null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

module.exports = {
  balanceRuntimeAdventure,
  findItemSources,
  ensureChallengeItemsObtainable,
};
