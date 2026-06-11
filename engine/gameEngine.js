const { loadGameData } = require("../data/loadGameData");
const gameData = loadGameData();

const LOCKED_EXITS = [
  {
    fromRoomId: "altar",
    direction: "east",
    toRoomId: "boss_room",
    keyItemId: "rusty_key",
    lockedMessage: "通往核心密室的石門被鎖住了。你需要在這道門前使用對應的鑰匙。",
    unlockMessage:
      "你將生鏽鑰匙插入石門鎖孔。鏽蝕的齒輪發出沉重低鳴，通往核心密室的石門緩緩打開。鑰匙也在轉動後斷裂了。",
    unlockLog: "你開啟了通往核心密室的石門",
    alreadyUnlockedMessage: "這道門已經打開，不需要再使用鑰匙。",
  },
];

function getInitialRoomId() {
  if (gameData.initialRoomId && gameData.rooms[gameData.initialRoomId]) {
    return gameData.initialRoomId;
  }

  if (gameData.rooms.entrance) {
    return "entrance";
  }

  const roomIds = Object.keys(gameData.rooms || {});
  if (roomIds.length === 0) {
    throw new Error("gameData.rooms must contain at least one room.");
  }

  return roomIds[0];
}

function getExpToNextLevel(level) {
  return Math.max(1, level) * 20;
}


function createInitialGameState() {
  const initialRoomId = getInitialRoomId();
  const initialRoom = gameData.rooms[initialRoomId];

  return {
    player: {
      hp: 30,
      maxHp: 30,
      mp: 10,
      maxMp: 10,
      attack: 6,
      defense: 2,
      level: 1,
      exp: 0,
      nextExp: getExpToNextLevel(1),
      inventory: [],
      currentRoom: initialRoomId,
      visitedRooms: [initialRoomId],
      isDefending: false,
    },

    flags: {
      hasAncientCore: false,
      bossDefeated: false,
      gameWon: false,
      gameOver: false,
      unlockedDoors: [],
    },

    monsters: createMonsterState(),

    mode: "explore",
    activeMonsterId: null,
    battle: createInitialBattleState(),

    log: [`遊戲開始。你站在${initialRoom.name}。`],
  };
}

function createInitialBattleState() {
  return {
    turn: 0,
    log: [],
    status: "idle",
    lastEvent: null,
  };
}

function createMonsterState() {
  const monsterState = {};

  for (const monsterId in gameData.monsters) {
    const monster = gameData.monsters[monsterId];

    monsterState[monsterId] = {
      hp: monster.maxHp,
      defeated: false,
    };
  }

  return monsterState;
}

function getCurrentRoom(gameState) {
  return gameData.rooms[gameState.player.currentRoom];
}

function getPublicGameState(gameState) {
  const currentRoom = getCurrentRoom(gameState);
  const activeMonster = getActiveBattleMonsterInfo(gameState);

  return {
    mode: gameState.mode,
    activeMonsterId: gameState.activeMonsterId,
    activeMonster,
    battle: {
      turn: gameState.battle.turn,
      log: gameState.battle.log,
      status: gameState.battle.status,
      lastEvent: gameState.battle.lastEvent,
    },
    gameOver: gameState.flags.gameOver,

    player: {
      hp: gameState.player.hp,
      maxHp: gameState.player.maxHp,
      mp: gameState.player.mp,
      maxMp: gameState.player.maxMp,
      attack: gameState.player.attack,
      defense: gameState.player.defense,
      level: gameState.player.level,
      exp: gameState.player.exp,
      nextExp: getExpToNextLevel(gameState.player.level),
      inventory: gameState.player.inventory.map((itemId) => {
        return gameData.items[itemId].name;
      }),
      inventoryItems: gameState.player.inventory.map((itemId) =>
        getPublicItemInfo(itemId)
      ),
      currentRoom: currentRoom.name,
      currentRoomId: currentRoom.id,
      visitedRooms: gameState.player.visitedRooms,
    },

    flags: gameState.flags,

    currentRoom: {
      id: currentRoom.id,
      name: currentRoom.name,
      description: currentRoom.description,
      ascii: currentRoom.ascii,
      exits: currentRoom.exits,
      items: currentRoom.items
        .filter((itemId) => !gameState.player.inventory.includes(itemId))
        .map((itemId) => gameData.items[itemId].name),
      monster: getRoomMonsterInfo(gameState, currentRoom),
    },

    itemDetails: Object.fromEntries(
      Object.keys(gameData.items || {}).map((itemId) => [
        itemId,
        getPublicItemInfo(itemId),
      ])
    ),

    log: gameState.log,
  };
}

function getPublicItemInfo(itemId) {
  const item = gameData.items[itemId];

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    type: item.type || "material",
    description: item.description || "這個道具還沒有詳細說明。",
    usageHint: item.usageHint || "",
    effect: item.effect || null,
    unlocks: item.unlocks || [],
    slot: item.slot || null,
    stats: item.stats || null,
  };
}

function getRoomMonsterInfo(gameState, room) {
  if (!room.monster) {
    return null;
  }

  const monsterId = room.monster;
  const monsterData = gameData.monsters[monsterId];
  const monsterState = gameState.monsters[monsterId];

  if (monsterState.defeated) {
    return null;
  }

  return {
    id: monsterId,
    name: monsterData.name,
    hp: monsterState.hp,
    maxHp: monsterData.maxHp,
    attack: monsterData.attack,
    defense: monsterData.defense || 0,
    expReward: monsterData.expReward || 0,
    description: monsterData.description,
  };
}

function getActiveRoomMonsterInfo(gameState) {
  return getRoomMonsterInfo(gameState, getCurrentRoom(gameState));
}

function getMonsterInfoById(gameState, monsterId) {
  if (!monsterId) {
    return null;
  }

  const monsterData = gameData.monsters[monsterId];
  const monsterState = gameState.monsters[monsterId];

  if (!monsterData || !monsterState || monsterState.defeated) {
    return null;
  }

  return {
    id: monsterId,
    name: monsterData.name,
    hp: monsterState.hp,
    maxHp: monsterData.maxHp,
    attack: monsterData.attack,
    defense: monsterData.defense || 0,
    expReward: monsterData.expReward || 0,
    description: monsterData.description,
  };
}

function getActiveBattleMonsterInfo(gameState) {
  return getMonsterInfoById(gameState, gameState.activeMonsterId);
}

function handleCommand(gameState, rawCommand) {
  const command = rawCommand.trim().toLowerCase();
  const parts = command.split(/\s+/);
  const action = parts[0];
  const target = parts.slice(1).join(" ");

  if (command === "") {
    return createEventResult("empty", "請輸入指令。");
  }

  if (action === "reset" || action === "restart") {
    return createEventResult("reset", "遊戲即將重置。");
  }

  if (gameState.mode === "gameOver" || gameState.flags.gameOver || gameState.flags.gameWon) {
    if (action === "reset") {
      return createEventResult("reset", "遊戲即將重置。");
    }

    return createEventResult("game_ended", "遊戲已結束，請輸入 reset 重新開始。");
  }

  if (
    (action === "battle" && target === "start") ||
    (action === "start" && target === "battle")
  ) {
    return handleBattleStart(gameState);
  }

  if (gameState.mode === "battle") {
    return handleBattleModeCommand(gameState, action, target);
  }

  if (action === "attack") {
    return createEventResult("not_in_battle", "請先進入戰鬥，再揮出你的攻擊。");
  }

  if (action === "skill") {
    return handleExploreSkill(gameState, target);
  }

  if (action === "escape") {
    return createEventResult("no_battle_to_escape", "現在沒有需要逃跑的戰鬥。");
  }

  if (action === "retreat" || (action === "boss" && target === "retreat")) {
    return handleBossRetreat(gameState);
  }

  const isExplorationAction = action === "move" || action === "take";
  const activeMonster = getActiveRoomMonsterInfo(gameState);

  if (activeMonster && isExplorationAction) {
    if (isBossThreat(gameState) && action === "move") {
      return createEventResult(
        "boss_retreat_required",
        "遺跡守護者壓迫著整個密室。若要撤退，請使用 retreat。"
      );
    }

    return createEventResult(
      "blocked_by_battle",
      `${activeMonster.name} 仍擋在你面前。此刻無法探索，請先戰鬥或嘗試 escape。`
    );
  }

  switch (action) {
    case "help":
      return handleHelp();

    case "look":
      return handleLook(gameState);

    case "status":
      return handleStatus(gameState);

    case "move":
      return handleMove(gameState, target);

    case "take":
      return handleTake(gameState, target);

    case "use":
      return handleUseItem(gameState, target);

    case "log":
      return handleLog(gameState);

    case "reset":
      return createEventResult("reset", "遊戲即將重置。");

    default:
      return createEventResult("unknown_command", "未知指令。請輸入 help 查看可用指令。");
  }
}

function handleBattleModeCommand(gameState, action, target) {
  switch (action) {
    case "attack":
      return handleAttack(gameState);

    case "skill":
      return handleSkill(gameState, target);

    case "use":
      return handleUseItem(gameState, target);

    case "escape":
      return handleEscape(gameState);

    case "status":
      return handleStatus(gameState);

    case "look":
      return handleBattleLook(gameState);

    case "log":
      return handleLog(gameState);

    default:
      return createEventResult(
        "battle_command_blocked",
        "戰鬥尚未結束，現在只能 attack、skill、use small_potion、escape、status 或 look。"
      );
  }
}

function createEventResult(type, message, extra = {}) {
  return {
    type,
    message,
    ...extra,
  };
}

function addLog(gameState, text) {
  gameState.log.push(text);

  if (gameState.log.length > 30) {
    gameState.log.shift();
  }
}

function addBattleLog(gameState, text) {
  if (!text) {
    return;
  }

  const lines = String(text).split("\n").filter(Boolean);
  gameState.battle.log.push(...lines);

  if (gameState.battle.log.length > 30) {
    gameState.battle.log = gameState.battle.log.slice(-30);
  }
}

function setBattleEvent(gameState, status, lastEvent) {
  gameState.battle.status = status;
  gameState.battle.lastEvent = lastEvent;
}

function clearActiveBattle(gameState, status, lastEvent) {
  gameState.mode = "explore";
  gameState.activeMonsterId = null;
  gameState.player.isDefending = false;
  setBattleEvent(gameState, status, lastEvent);
}

function handleBattleStart(gameState) {
  if (gameState.mode === "battle") {
    const activeMonster = getActiveBattleMonsterInfo(gameState);

    return createEventResult(
      "battle_already_started",
      activeMonster
        ? `你已經正在與 ${activeMonster.name} 戰鬥。`
        : "戰鬥已經開始。"
    );
  }

  const monsterInfo = getActiveRoomMonsterInfo(gameState);

  if (!monsterInfo) {
    return createEventResult("no_battle_target", "這裡沒有需要戰鬥的敵人。");
  }

  gameState.mode = "battle";
  gameState.activeMonsterId = monsterInfo.id;
  gameState.battle = {
    turn: 1,
    log: [
      `${monsterInfo.name} 擋住了你的去路。`,
      "戰鬥開始，請選擇你的行動。",
    ],
    status: "fighting",
    lastEvent: "battle_started",
  };

  addLog(gameState, `你與 ${monsterInfo.name} 進入戰鬥。`);

  return createEventResult(
    "battle_started",
    `你面對 ${monsterInfo.name} 擺開架勢。戰鬥開始。`
  );
}

function isBossThreat(gameState) {
  const room = getCurrentRoom(gameState);
  const monsterInfo = getRoomMonsterInfo(gameState, room);

  return room?.id === "boss_room" && monsterInfo?.id === "ruin_guardian";
}

function handleBossRetreat(gameState) {
  const room = getCurrentRoom(gameState);
  const monsterInfo = getRoomMonsterInfo(gameState, room);
  const retreatRoomId = room?.exits?.west;

  if (room?.id !== "boss_room" || monsterInfo?.id !== "ruin_guardian") {
    return createEventResult(
      "retreat_unavailable",
      "這裡沒有需要立刻撤退的 Boss 威脅。"
    );
  }

  if (!retreatRoomId || !gameData.rooms[retreatRoomId]) {
    return createEventResult(
      "retreat_blocked",
      "你想撤退，但身後沒有安全退路。"
    );
  }

  gameState.player.currentRoom = retreatRoomId;

  if (!gameState.player.visitedRooms.includes(retreatRoomId)) {
    gameState.player.visitedRooms.push(retreatRoomId);
  }

  addLog(gameState, "你暫時撤離了核心密室");

  return createEventResult(
    "boss_retreat",
    "你壓低腳步，趁遺跡守護者完全甦醒前退回祭壇大廳。"
  );
}

function awardExperience(gameState, monsterData) {
  const expReward = monsterData.expReward || 0;
  const messages = [];

  if (expReward <= 0) {
    return messages;
  }

  gameState.player.exp += expReward;
  messages.push(`你獲得 ${expReward} 點經驗值。`);
  addLog(gameState, `你獲得 ${expReward} 點經驗值`);

  while (gameState.player.exp >= getExpToNextLevel(gameState.player.level)) {
    const requiredExp = getExpToNextLevel(gameState.player.level);
    gameState.player.exp -= requiredExp;

    const before = {
      level: gameState.player.level,
      maxHp: gameState.player.maxHp,
      maxMp: gameState.player.maxMp,
      attack: gameState.player.attack,
      defense: gameState.player.defense,
    };

    gameState.player.level += 1;
    gameState.player.maxHp += 6;
    gameState.player.maxMp += 3;
    gameState.player.attack += 2;
    gameState.player.defense += 1;
    gameState.player.nextExp = getExpToNextLevel(gameState.player.level);

    // MVP rule: level up fully restores HP/MP so the player can continue exploring.
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    messages.push(
      [
        `你升到了 Lv. ${gameState.player.level}！`,
        `HP 上限 ${before.maxHp}→${gameState.player.maxHp}`,
        `MP 上限 ${before.maxMp}→${gameState.player.maxMp}`,
        `攻擊 ${before.attack}→${gameState.player.attack}`,
        `防禦 ${before.defense}→${gameState.player.defense}`,
        "HP / MP 已回滿。",
      ].join("，")
    );
    addLog(gameState, `你升到了 Lv. ${gameState.player.level}`);
  }

  gameState.player.nextExp = getExpToNextLevel(gameState.player.level);

  return messages;
}

function applyMonsterDrops(gameState, monsterData) {
  const drops = Array.isArray(monsterData.drops) ? monsterData.drops : [];
  const messages = [];

  for (const drop of drops) {
    const itemId = typeof drop === "string" ? drop : drop?.id;
    if (!itemId || !gameData.items[itemId]) {
      continue;
    }

    gameState.player.inventory.push(itemId);
    messages.push(`${monsterData.name} 掉落了 ${gameData.items[itemId].name}。`);
    addLog(gameState, `你獲得掉落物 ${gameData.items[itemId].name}`);
  }

  return messages;
}

function handleHelp() {
  return createEventResult(
    "help",
    [
      "可用指令：",
      "- help：顯示指令列表",
      "- look：觀察目前房間",
      "- status：查看角色狀態",
      "- move north / south / east / west：移動",
      "- take item：撿起道具（例：take torch）",
      "- battle start：遭遇敵人時進入戰鬥",
      "- attack：普通攻擊",
      "- skill slash：施放斬擊",
      "- skill fireball：施放火球術",
      "- skill guard：施放防禦姿態",
      "- escape：嘗試脫離目前戰鬥",
      "- use small_potion：使用藥水",
      "- log：查看最近行動紀錄",
      "- reset：重新開始",
    ].join("\n")
  );
}

function handleLook(gameState) {
  const room = getCurrentRoom(gameState);
  const visibleItems = room.items.filter(
    (itemId) => !gameState.player.inventory.includes(itemId)
  );

  const itemText =
    visibleItems.length > 0
      ? `你看到道具：${visibleItems.map((id) => gameData.items[id].name).join("、")}`
      : "這裡沒有可撿取的道具。";

  const monsterInfo = getRoomMonsterInfo(gameState, room);
  const monsterText = monsterInfo
    ? `你看到怪物：${monsterInfo.name}（HP ${monsterInfo.hp}/${monsterInfo.maxHp}）`
    : "這裡沒有怪物。";

  const actionHints = [];

  for (const itemId of visibleItems) {
    actionHints.push(`take ${itemId}`);
  }

  for (const direction in room.exits) {
    actionHints.push(`move ${direction}`);
  }

  if (monsterInfo) {
    actionHints.push("battle start");
  }

  if (gameState.player.inventory.includes("small_potion")) {
    actionHints.push("use small_potion");
  }

  actionHints.push("status");
  actionHints.push("help");

  return createEventResult(
    "look",
    `${room.description}\n${itemText}\n${monsterText}\n可用建議：\n- ${actionHints.join("\n- ")}`
  );
}

function handleStatus(gameState) {
  const room = getCurrentRoom(gameState);
  const inventoryNames =
    gameState.player.inventory.length > 0
      ? gameState.player.inventory.map((id) => gameData.items[id].name).join("、")
      : "無";

  return createEventResult(
    "status",
    `角色狀態：Lv. ${gameState.player.level}，EXP ${gameState.player.exp}/${gameState.player.nextExp}，HP ${gameState.player.hp}/${gameState.player.maxHp}，MP ${gameState.player.mp}/${gameState.player.maxMp}，攻擊力 ${gameState.player.attack}，防禦力 ${gameState.player.defense}，目前位置：${room.name}，背包：${inventoryNames}`
  );
}

function handleBattleLook(gameState) {
  const monsterInfo = getActiveBattleMonsterInfo(gameState);

  if (!monsterInfo) {
    return createEventResult("battle_look_missing_enemy", "戰鬥資料已經消散，請重新觀察四周。");
  }

  return createEventResult(
    "battle_look",
    [
      `你正在與 ${monsterInfo.name} 戰鬥。`,
      `${monsterInfo.name} HP：${monsterInfo.hp}/${monsterInfo.maxHp}`,
      `你的 HP：${gameState.player.hp}/${gameState.player.maxHp}，MP：${gameState.player.mp}/${gameState.player.maxMp}`,
      `目前回合：${gameState.battle.turn}`,
    ].join("\n")
  );
}

function handleMove(gameState, direction) {
  const room = getCurrentRoom(gameState);

  if (!direction) {
    return createEventResult("move_missing_direction", "請指定移動方向，例如 move north。");
  }

  if (!room.exits[direction]) {
    return createEventResult(
      "invalid_move",
      `無法往 ${direction} 移動。可用方向：${Object.keys(room.exits).join("、")}`
    );
  }

  const monsterInfo = getRoomMonsterInfo(gameState, room);
  if (monsterInfo) {
    return createEventResult(
      "blocked_by_monster",
      `你被 ${monsterInfo.name} 擋住去路，必須先擊敗它。`
    );
  }

  const nextRoomId = room.exits[direction];

  const lockedExit = getLockedExit(room.id, direction, nextRoomId);
  if (lockedExit && !isDoorUnlocked(gameState, room.id, direction, nextRoomId)) {
    return createEventResult("locked_door", lockedExit.lockedMessage);
  }

  gameState.player.currentRoom = nextRoomId;

  if (!gameState.player.visitedRooms.includes(nextRoomId)) {
    gameState.player.visitedRooms.push(nextRoomId);
  }

  const nextRoom = getCurrentRoom(gameState);
  addLog(gameState, `你移動到了 ${nextRoom.name}`);

  checkWinCondition(gameState);

  if (gameState.flags.gameWon) {
    return createEventResult(
      "game_won",
      "你帶著古代核心回到了入口。遺跡深處的能量逐漸平息，你成功完成了這次探索。"
    );
  }

  return handleLook(gameState);
}

function handleTake(gameState, targetName) {
  const room = getCurrentRoom(gameState);
  const monsterInfo = getRoomMonsterInfo(gameState, room);

  if (monsterInfo) {
    return createEventResult(
      "blocked_by_battle",
      `${monsterInfo.name} 的殺意逼近，你無法分心搜刮道具。請先戰鬥或嘗試 escape。`
    );
  }

  if (!targetName) {
    return createEventResult("take_missing_item", "請指定要拿取的道具，例如 take torch。");
  }

  const itemId = findItemIdByNameOrId(targetName);

  if (!itemId) {
    return createEventResult("item_not_found", `找不到道具：${targetName}`);
  }

  if (!room.items.includes(itemId)) {
    return createEventResult("item_not_in_room", `${gameData.items[itemId].name} 不在這個房間。`);
  }

  if (gameState.player.inventory.includes(itemId)) {
    return createEventResult("item_already_taken", `你已經拿過 ${gameData.items[itemId].name}。`);
  }

  if (itemId === "ancient_core" && !gameState.flags.bossDefeated) {
    return createEventResult("core_protected", "古代核心仍被守護者保護，先擊敗它再來拿取。");
  }

  gameState.player.inventory.push(itemId);

  if (itemId === "ancient_core") {
    gameState.flags.hasAncientCore = true;
    checkWinCondition(gameState);
  }

  addLog(gameState, `你取得了 ${gameData.items[itemId].name}`);

  return createEventResult(
    "take",
    `你拿到了 ${gameData.items[itemId].name}。${gameData.items[itemId].description}`
  );
}

function handleAttack(gameState) {
  return performPlayerAttack(gameState, {
    type: "attack",
    name: "普通攻擊",
    damage: gameState.player.attack,
    mpCost: 0,
  });
}

function handleExploreSkill(gameState, skillName) {
  if (!skillName) {
    return createEventResult(
      "skill_missing",
      "請指定技能名稱，例如 skill slash、skill fireball、skill guard。"
    );
  }

  const skillId = findSkillIdByNameOrId(skillName);

  if (!skillId) {
    return createEventResult("skill_not_found", `找不到技能：${skillName}`);
  }

  const skill = gameData.skills[skillId];
  const monsterInfo = getActiveRoomMonsterInfo(gameState);

  if (monsterInfo) {
    return createEventResult(
      "not_in_battle",
      `${monsterInfo.name} 正在逼近。請先輸入 battle start，再使用 ${skill.name}。`
    );
  }

  return createEventResult(
    "no_monster_for_skill",
    `四周暫時沒有敵人，${skill.name} 沒有施放的目標。`
  );
}

function handleSkill(gameState, skillName) {
  if (!skillName) {
    return createEventResult(
      "skill_missing",
      "請指定技能名稱，例如 skill slash、skill fireball、skill guard。"
    );
  }

  const skillId = findSkillIdByNameOrId(skillName);

  if (!skillId) {
    return createEventResult("skill_not_found", `找不到技能：${skillName}`);
  }

  const skill = gameData.skills[skillId];
  const monsterInfo = getActiveBattleMonsterInfo(gameState);

  if (!monsterInfo) {
    return createEventResult(
      "no_monster_for_skill",
      `四周暫時沒有敵人，${skill.name} 沒有施放的目標。`
    );
  }

  if (gameState.player.mp < skill.mpCost) {
    return createEventResult("not_enough_mp", `MP 不足，${skill.name} 需要 ${skill.mpCost} MP。`);
  }

  gameState.player.mp -= skill.mpCost;

  if (skillId === "guard") {
    gameState.player.isDefending = true;
    addLog(gameState, "你進入防禦姿態。");
    gameState.battle.turn += 1;
    const message = `你施放了 ${skill.name}，消耗 ${skill.mpCost} MP。下一次受到的傷害會減半。`;
    addBattleLog(gameState, message);
    setBattleEvent(gameState, "fighting", "guard");

    return createEventResult("guard", message);
  }

  return performPlayerAttack(gameState, {
    type: "skill",
    name: skill.name,
    damage: skill.damage,
    mpCost: skill.mpCost,
  });
}

function handleEscape(gameState) {
  const monsterInfo = getActiveBattleMonsterInfo(gameState);

  if (!monsterInfo) {
    return createEventResult("no_battle_to_escape", "現在沒有需要逃跑的戰鬥。");
  }

  const room = getCurrentRoom(gameState);
  const monsterData = gameData.monsters[monsterInfo.id];
  const escapeSucceeded = Math.random() < 0.6;

  if (escapeSucceeded) {
    addLog(gameState, `你從 ${monsterData.name} 面前撤退。`);
    const message = `你抓住 ${monsterData.name} 動作的空隙，退回 ${room.name} 的陰影裡。戰鬥暫時中止。`;
    addBattleLog(gameState, message);
    clearActiveBattle(gameState, "escaped", "escape_success");

    return createEventResult("escape_success", message);
  }

  const counterText = performMonsterCounterAttack(gameState, monsterData);
  checkGameOver(gameState);

  const messageLines = [
    `你試圖脫離戰鬥，但 ${monsterData.name} 封住了退路。`,
    counterText,
  ];

  if (gameState.flags.gameOver) {
    messageLines.push("你的 HP 歸零了。輸入 reset 可重新開始。");
  }

  addLog(gameState, `你逃離 ${monsterData.name} 失敗。`);
  gameState.battle.turn += 1;
  addBattleLog(gameState, messageLines.join("\n"));
  setBattleEvent(
    gameState,
    gameState.mode === "gameOver" ? "defeat" : "fighting",
    "escape_failed"
  );

  return createEventResult("escape_failed", messageLines.join("\n"));
}

function performPlayerAttack(gameState, attackInfo) {
  const monsterInfo = getActiveBattleMonsterInfo(gameState);

  if (!monsterInfo) {
    return createEventResult("no_monster", "目前沒有正在交戰的敵人。");
  }

  const monsterId = monsterInfo.id;
  const monsterData = gameData.monsters[monsterId];
  const monsterState = gameState.monsters[monsterId];

  monsterState.hp -= attackInfo.damage;

  let messageLines = [];

  messageLines.push(`你使用 ${attackInfo.name}，對 ${monsterData.name} 造成 ${attackInfo.damage} 點傷害。`);

  if (monsterState.hp <= 0) {
    monsterState.hp = 0;
    monsterState.defeated = true;

    if (monsterId === "ruin_guardian") {
      gameState.flags.bossDefeated = true;
      messageLines.push("遺跡守護者倒下了。古代核心周圍的能量屏障隨之消散。");
    } else {
      messageLines.push(`${monsterData.name} 被你擊敗了。`);
    }

    addLog(gameState, `你擊敗了 ${monsterData.name}`);

    messageLines.push(...awardExperience(gameState, monsterData));
    messageLines.push(...applyMonsterDrops(gameState, monsterData));
    messageLines.push("你現在可以輸入 look 重新觀察房間。");
    addBattleLog(gameState, messageLines.join("\n"));
    clearActiveBattle(gameState, "victory", "monster_defeated");

    return createEventResult("monster_defeated", messageLines.join("\n"));
  }

  messageLines.push(`${monsterData.name} 剩餘 HP：${monsterState.hp}/${monsterData.maxHp}`);

  const monsterAttackResult = performMonsterCounterAttack(gameState, monsterData);
  messageLines.push(monsterAttackResult);

  checkGameOver(gameState);

  if (gameState.flags.gameOver) {
    messageLines.push("你的 HP 歸零了。輸入 reset 可重新開始。");
  }

  addLog(gameState, `你攻擊了 ${monsterData.name}`);
  gameState.battle.turn += 1;
  addBattleLog(gameState, messageLines.join("\n"));
  setBattleEvent(
    gameState,
    gameState.mode === "gameOver" ? "defeat" : "fighting",
    attackInfo.type
  );

  return createEventResult("attack", messageLines.join("\n"));
}

function performMonsterCounterAttack(gameState, monsterData) {
  let damage = monsterData.attack;

  if (gameState.player.isDefending) {
    damage = Math.ceil(damage / 2);
    gameState.player.isDefending = false;
  }

  gameState.player.hp -= damage;

  if (gameState.player.hp < 0) {
    gameState.player.hp = 0;
  }

  return `${monsterData.name} 反擊你，造成 ${damage} 點傷害。`;
}

function handleUseItem(gameState, targetName) {
  if (!targetName) {
    return createEventResult("use_missing_item", "請指定要使用的道具，例如 use small_potion。");
  }

  const itemId = findItemIdByNameOrId(targetName);

  if (!itemId) {
    return createEventResult("use_item_not_found", `找不到道具：${targetName}`);
  }

  if (!gameState.player.inventory.includes(itemId)) {
    return createEventResult("use_item_not_owned", `你的背包裡沒有 ${gameData.items[itemId].name}。`);
  }

  const item = gameData.items[itemId];

  if (item.type === "consumable" && item.effect && item.effect.hp) {
    const oldHp = gameState.player.hp;
    gameState.player.hp += item.effect.hp;

    if (gameState.player.hp > gameState.player.maxHp) {
      gameState.player.hp = gameState.player.maxHp;
    }

    const healed = gameState.player.hp - oldHp;

    removeItemFromInventory(gameState, itemId);
    addLog(gameState, `你使用了 ${item.name}`);
    const message = `你使用了 ${item.name}，恢復 ${healed} 點 HP。現在 HP：${gameState.player.hp}/${gameState.player.maxHp}`;

    if (gameState.mode === "battle") {
      gameState.battle.turn += 1;
      addBattleLog(gameState, message);
      setBattleEvent(gameState, "fighting", "use_item");
    }

    return createEventResult("use_item", message);
  }

  if (item.type === "key") {
    return handleUseKeyItem(gameState, item);
  }

  if (item.type === "quest") {
    const message = item.usageHint
      ? `${item.name} 暫時不能直接使用。${item.usageHint}`
      : `${item.name} 是重要物品，但現在還不是直接使用它的時候。`;
    addLog(gameState, `你查看了 ${item.name}`);
    return createEventResult("use_quest_item", message);
  }

  if (item.type === "equipment") {
    const message = `裝備系統尚未開放，暫時無法使用 ${item.name}。`;
    addLog(gameState, `你嘗試使用 ${item.name}`);
    return createEventResult("use_equipment_unavailable", message);
  }

  if (item.type === "material") {
    const message = `目前環境中沒有適合使用 ${item.name} 的地方。`;
    addLog(gameState, `你嘗試使用 ${item.name}`);
    return createEventResult("use_material_no_target", message);
  }

  return createEventResult("use_no_effect", `${item.name} 沒有可用效果。`);
}

function handleUseKeyItem(gameState, item) {
  const room = getCurrentRoom(gameState);
  const matchedExit = findKeyUnlockTarget(gameState, room, item);

  if (!matchedExit) {
    const message = `你拿出 ${item.name}，但附近沒有能使用它的機關或門鎖。`;
    addLog(gameState, `你嘗試使用 ${item.name}`);
    return createEventResult("use_key_no_target", message);
  }

  if (matchedExit.unlocked) {
    return createEventResult(
      "use_key_already_unlocked",
      matchedExit.lockedExit.alreadyUnlockedMessage
    );
  }

  unlockDoor(gameState, room.id, matchedExit.direction, matchedExit.toRoomId);
  removeItemFromInventory(gameState, item.id);
  addLog(gameState, matchedExit.lockedExit.unlockLog);

  return createEventResult("use_key", matchedExit.lockedExit.unlockMessage);
}

function removeItemFromInventory(gameState, itemId) {
  const index = gameState.player.inventory.indexOf(itemId);

  if (index !== -1) {
    gameState.player.inventory.splice(index, 1);
  }
}

function getDoorId(fromRoomId, direction, toRoomId) {
  return `${fromRoomId}:${direction}:${toRoomId}`;
}

function getUnlockedDoors(gameState) {
  if (!Array.isArray(gameState.flags.unlockedDoors)) {
    gameState.flags.unlockedDoors = [];
  }

  return gameState.flags.unlockedDoors;
}

function getLockedExit(fromRoomId, direction, toRoomId) {
  return LOCKED_EXITS.find(
    (exit) =>
      exit.fromRoomId === fromRoomId &&
      exit.direction === direction &&
      exit.toRoomId === toRoomId
  );
}

function isDoorUnlocked(gameState, fromRoomId, direction, toRoomId) {
  return getUnlockedDoors(gameState).includes(getDoorId(fromRoomId, direction, toRoomId));
}

function unlockDoor(gameState, fromRoomId, direction, toRoomId) {
  const unlockedDoors = getUnlockedDoors(gameState);
  const doorId = getDoorId(fromRoomId, direction, toRoomId);

  if (!unlockedDoors.includes(doorId)) {
    unlockedDoors.push(doorId);
  }
}

function findKeyUnlockTarget(gameState, room, item) {
  const exits = room.exits || {};
  const unlocks = Array.isArray(item.unlocks) ? item.unlocks : [];

  for (const [direction, toRoomId] of Object.entries(exits)) {
    if (!unlocks.includes(toRoomId)) {
      continue;
    }

    const lockedExit = getLockedExit(room.id, direction, toRoomId);

    if (!lockedExit || lockedExit.keyItemId !== item.id) {
      continue;
    }

    return {
      direction,
      toRoomId,
      lockedExit,
      unlocked: isDoorUnlocked(gameState, room.id, direction, toRoomId),
    };
  }

  return null;
}

function checkGameOver(gameState) {
  if (gameState.player.hp <= 0) {
    gameState.flags.gameOver = true;
    gameState.mode = "gameOver";
    gameState.battle.status = "defeat";
    gameState.battle.lastEvent = "player_defeated";
  }
}

function checkWinCondition(gameState) {
  if (
    !gameState.flags.gameWon &&
    gameState.flags.hasAncientCore &&
    gameState.flags.bossDefeated &&
    gameState.player.currentRoom === "entrance"
  ) {
    gameState.flags.gameWon = true;
    addLog(gameState, "你帶著古代核心回到了遺跡入口，探索完成。");
  }
}

function findItemIdByNameOrId(input) {
  for (const itemId in gameData.items) {
    const item = gameData.items[itemId];

    if (item.id.toLowerCase() === input || item.name.toLowerCase() === input) {
      return itemId;
    }
  }

  return null;
}

function findSkillIdByNameOrId(input) {
  for (const skillId in gameData.skills) {
    const skill = gameData.skills[skillId];

    if (skill.id.toLowerCase() === input || skill.name.toLowerCase() === input) {
      return skillId;
    }
  }

  return null;
}

function handleLog(gameState) {
  return createEventResult("log", gameState.log.join("\n"));
}

module.exports = {
  getInitialRoomId,
  createInitialGameState,
  getPublicGameState,
  handleCommand,
};
