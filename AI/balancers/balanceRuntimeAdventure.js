function balanceRuntimeAdventure(gameData, input = {}) {
  const balanced = cloneObject(gameData);
  const difficulty = clamp(Number(input.difficulty) || 4, 1, 10);

  ensureRoomKinds(balanced);
  ensureConsumables(balanced, difficulty);
  ensureEquipment(balanced, difficulty);
  ensureChallenge(balanced);
  ensureWinConditionPlacement(balanced);
  balanceSkills(balanced);
  balanceMonsterStats(balanced, difficulty);

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

function ensureConsumables(gameData, difficulty) {
  const consumables = Object.values(gameData.items || {}).filter((item) => item.type === "consumable");
  if (consumables.length === 0) {
    gameData.items.healing_potion = {
      id: "healing_potion",
      name: "療癒藥水",
      description: "能在危急時恢復生命的小瓶藥水。",
      type: "consumable",
      usageHint: "受傷時使用，可恢復 12 點 HP。",
      effect: { hp: 12 },
    };
    placeItemBeforeBoss(gameData, "healing_potion");
  }

  if (difficulty >= 4 && Object.values(gameData.items).filter((item) => item.type === "consumable").length < 2) {
    gameData.items.guardian_tonic = {
      id: "guardian_tonic",
      name: "守護藥劑",
      description: "能在 Boss 戰前提供額外喘息空間的補給。",
      type: "consumable",
      usageHint: "HP 偏低時使用，可恢復 10 點 HP。",
      effect: { hp: 10 },
    };
    placeItemBeforeBoss(gameData, "guardian_tonic");
  }
}

function ensureEquipment(gameData, difficulty) {
  const equipment = Object.values(gameData.items || {}).filter((item) => item.type === "equipment");
  if (equipment.length > 0) return;

  const defensive = difficulty >= 5;
  const itemId = defensive ? "warded_armor" : "balanced_blade";
  gameData.items[itemId] = defensive
    ? {
        id: itemId,
        name: "守紋護甲",
        description: "刻著守護紋路的輕甲，能提高防禦與生命上限。",
        type: "equipment",
        slot: "armor",
        stats: { defense: 2, maxHp: 6 },
        usageHint: "在 Boss 戰前裝備，能承受更多傷害。",
      }
    : {
        id: itemId,
        name: "平衡短刃",
        description: "重量適中的短刃，能提高穩定攻擊力。",
        type: "equipment",
        slot: "weapon",
        stats: { attack: 2 },
        usageHint: "裝備後可提高普通攻擊與技能傷害。",
      };

  placeItemBeforeBoss(gameData, itemId, ["treasure", "key", "rest"]);
}

function ensureChallenge(gameData) {
  const rooms = Object.values(gameData.rooms || {});
  const hasChallenge = rooms.some((room) => room.challenge);
  if (hasChallenge) return;

  const targetRoom =
    rooms.find((room) => room.kind === "puzzle") ||
    rooms.find((room) => room.id !== gameData.initialRoomId && room.kind !== "boss") ||
    rooms[0];
  const keyItemId = ensureKeyItem(gameData);

  targetRoom.kind = "puzzle";
  targetRoom.challenge = {
    type: "riddle",
    description: "牆面上的符號需要一個能對應古老紋路的物品才能安定下來。",
    requiredItemId: keyItemId,
    solutionHint: `使用 ${gameData.items[keyItemId].name} 觀察符號的排列。`,
    rewardItemIds: [],
  };

  placeItemBeforeRoom(gameData, keyItemId, targetRoom.id);
}

function ensureKeyItem(gameData) {
  const keyItem = Object.values(gameData.items || {}).find((item) => item.type === "key");
  if (keyItem) return keyItem.id;

  gameData.items.ancient_symbol = {
    id: "ancient_symbol",
    name: "古代符記",
    description: "一枚刻著古老符號的小石片，可與遺跡中的機關共鳴。",
    type: "key",
    usageHint: "可用於解開符號、門鎖或謎題機關。",
    unlocks: [],
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
  if (!bossRoom.items.includes(requiredItemId)) bossRoom.items.push(requiredItemId);
  if (!bossRoom.monster) {
    bossRoom.monster = ensureBossMonster(gameData);
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
    if (index === 0) {
      skill.role = "damage";
      skill.mpCost = Math.min(Number(skill.mpCost) || 0, 1);
      skill.damage = clamp(Number(skill.damage) || playerAttack + 2, playerAttack + 1, playerAttack + 3);
    } else if (index === 1) {
      skill.role = "damage";
      skill.mpCost = clamp(Number(skill.mpCost) || 4, 3, 5);
      skill.damage = clamp(Number(skill.damage) || Math.round(playerAttack * 1.8), playerAttack + 4, playerAttack * 2 + 4);
    } else {
      skill.role = ["defense", "utility"].includes(skill.role) ? skill.role : "defense";
      skill.mpCost = clamp(Number(skill.mpCost) || 3, 2, 4);
      skill.damage = Number(skill.damage) > 0 && skill.role === "utility" ? Number(skill.damage) : 0;
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
    } else {
      monster.maxHp = clamp(Math.round(playerDpr * (2.5 + difficulty * 0.08)), playerDpr * 2, playerDpr * 4);
      monster.attack = clamp(Math.round(playerMaxHp / 8 + difficulty * 0.4), 3, Math.ceil(playerMaxHp / 5));
      monster.defense = Math.min(Number(monster.defense) || 1, 2);
      monster.expReward = Math.max(Number(monster.expReward) || 10, 10);
    }

    monster.hp = monster.maxHp;
  }
}

function placeItemBeforeBoss(gameData, itemId, preferredKinds = ["rest", "treasure", "key", "lore"]) {
  const bossRoom = findBossRoom(gameData);
  const rooms = Object.values(gameData.rooms || {});
  const room =
    rooms.find((candidate) => candidate.id !== bossRoom?.id && preferredKinds.includes(candidate.kind)) ||
    rooms.find((candidate) => candidate.id !== bossRoom?.id && candidate.id !== gameData.initialRoomId) ||
    rooms[0];
  if (room && !room.items.includes(itemId)) room.items.push(itemId);
}

function placeItemBeforeRoom(gameData, itemId, targetRoomId) {
  const rooms = Object.values(gameData.rooms || {});
  const targetIndex = rooms.findIndex((room) => room.id === targetRoomId);
  const room = rooms[Math.max(0, targetIndex - 1)] || rooms[0];
  if (room && !room.items.includes(itemId)) room.items.push(itemId);
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
    description: "守護任務物品的最後敵人。",
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

module.exports = {
  balanceRuntimeAdventure,
};
