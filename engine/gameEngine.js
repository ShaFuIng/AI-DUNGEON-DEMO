const { loadGameData } = require("../data/loadGameData");
let gameData = loadGameData();

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

function setRuntimeGameData(nextGameData) {
  gameData = nextGameData;
}

function getRuntimeGameData() {
  return gameData;
}

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


function createInitialGameState(nextGameData = gameData) {
  gameData = nextGameData;
  const initialRoomId = getInitialRoomId();
  const initialRoom = gameData.rooms[initialRoomId];
  const playerData = gameData.player || {};
  const startingSkills = Array.isArray(playerData.skills)
    ? playerData.skills.filter((skillId) => gameData.skills?.[skillId])
    : Object.keys(gameData.skills || {}).slice(0, 3);

  return {
    player: {
      hp: playerData.hp ?? 30,
      maxHp: playerData.maxHp ?? playerData.hp ?? 30,
      mp: playerData.mp ?? 10,
      maxMp: playerData.maxMp ?? playerData.mp ?? 10,
      attack: playerData.attack ?? 6,
      defense: playerData.defense ?? 2,
      level: playerData.level ?? 1,
      exp: 0,
      nextExp: getExpToNextLevel(1),
      statPoints: playerData.statPoints ?? playerData.unspentStatPoints ?? 0,
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        accessory: null,
      },
      skills: startingSkills,
      currentRoom: initialRoomId,
      previousRoomId: null,
      visitedRooms: [initialRoomId],
      isDefending: false,
    },

    flags: {
      hasAncientCore: false,
      bossDefeated: false,
      gameWon: false,
      gameOver: false,
      unlockedDoors: [],
      collectedItems: [],
      resolvedChallenges: [],
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

function getRoomItemKey(roomId, itemId) {
  return `${roomId}:${itemId}`;
}

function getCollectedItems(gameState) {
  if (!Array.isArray(gameState.flags.collectedItems)) {
    gameState.flags.collectedItems = [];
  }

  return gameState.flags.collectedItems;
}

function isRoomItemCollected(gameState, roomId, itemId) {
  return getCollectedItems(gameState).includes(getRoomItemKey(roomId, itemId));
}

function markRoomItemCollected(gameState, roomId, itemId) {
  const collectedItems = getCollectedItems(gameState);
  const itemKey = getRoomItemKey(roomId, itemId);

  if (!collectedItems.includes(itemKey)) {
    collectedItems.push(itemKey);
  }
}

function getAvailableRoomItemIds(gameState, room = getCurrentRoom(gameState)) {
  return (room.items || []).filter(
    (itemId) => !isRoomItemCollected(gameState, room.id, itemId)
  );
}

function getPublicGameState(gameState) {
  const currentRoom = getCurrentRoom(gameState);
  const activeMonster = getActiveBattleMonsterInfo(gameState);
  const effectiveStats = getEffectivePlayerStats(gameState);

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
      maxHp: effectiveStats.maxHp,
      mp: gameState.player.mp,
      maxMp: effectiveStats.maxMp,
      attack: effectiveStats.attack,
      defense: effectiveStats.defense,
      baseAttack: gameState.player.attack,
      baseDefense: gameState.player.defense,
      baseMaxHp: gameState.player.maxHp,
      baseMaxMp: gameState.player.maxMp,
      level: gameState.player.level,
      exp: gameState.player.exp,
      nextExp: getExpToNextLevel(gameState.player.level),
      statPoints: gameState.player.statPoints ?? 0,
      unspentStatPoints: gameState.player.statPoints ?? 0,
      inventory: gameState.player.inventory.map((itemId) => {
        return gameData.items[itemId].name;
      }),
      inventoryItems: gameState.player.inventory.map((itemId) =>
        getPublicItemInfo(itemId)
      ),
      currentRoom: currentRoom.name,
      currentRoomId: currentRoom.id,
      previousRoomId: gameState.player.previousRoomId,
      visitedRooms: gameState.player.visitedRooms,
      equipment: gameState.player.equipment || {},
      equipmentItems: getEquippedItemIds(gameState)
        .map((itemId) => getPublicItemInfo(itemId))
        .filter(Boolean),
      skills: getPlayerSkillIds(gameState).map((skillId) => getPublicSkillInfo(skillId)).filter(Boolean),
      skillIds: getPlayerSkillIds(gameState),
    },

    flags: gameState.flags,

    currentRoom: {
      id: currentRoom.id,
      name: currentRoom.name,
      description: currentRoom.description,
      kind: currentRoom.kind || "lore",
      challenge: getPublicChallengeInfo(gameState, currentRoom),
      ascii: currentRoom.ascii,
      exits: currentRoom.exits,
      items: getAvailableRoomItemIds(gameState, currentRoom)
        .map((itemId) => gameData.items[itemId].name),
      monster: getRoomMonsterInfo(gameState, currentRoom),
    },

    itemDetails: Object.fromEntries(
      Object.keys(gameData.items || {}).map((itemId) => [
        itemId,
        getPublicItemInfo(itemId),
      ])
    ),

    skillDetails: Object.fromEntries(
      Object.keys(gameData.skills || {}).map((skillId) => [
        skillId,
        getPublicSkillInfo(skillId),
      ])
    ),

    log: gameState.log,
  };
}

function getPlayerSkillIds(gameState) {
  if (Array.isArray(gameState.player.skills) && gameState.player.skills.length > 0) {
    return gameState.player.skills.filter((skillId) => gameData.skills?.[skillId]);
  }

  return Object.keys(gameData.skills || {}).slice(0, 3);
}

function getEquippedItemIds(gameState) {
  const equipment = gameState.player.equipment || {};
  return ["weapon", "armor", "accessory"].map((slot) => equipment[slot]).filter(Boolean);
}

function getEquipmentStats(gameState) {
  return getEquippedItemIds(gameState).reduce(
    (totals, itemId) => {
      const stats = gameData.items[itemId]?.stats || {};
      return {
        attack: totals.attack + (Number(stats.attack) || 0),
        defense: totals.defense + (Number(stats.defense) || 0),
        maxHp: totals.maxHp + (Number(stats.maxHp) || 0),
        maxMp: totals.maxMp + (Number(stats.maxMp) || 0),
      };
    },
    { attack: 0, defense: 0, maxHp: 0, maxMp: 0 }
  );
}

function getEffectivePlayerStats(gameState) {
  const equipmentStats = getEquipmentStats(gameState);

  return {
    attack: gameState.player.attack + equipmentStats.attack,
    defense: gameState.player.defense + equipmentStats.defense,
    maxHp: gameState.player.maxHp + equipmentStats.maxHp,
    maxMp: gameState.player.maxMp + equipmentStats.maxMp,
  };
}

function getResolvedChallenges(gameState) {
  if (!Array.isArray(gameState.flags.resolvedChallenges)) {
    gameState.flags.resolvedChallenges = [];
  }

  return gameState.flags.resolvedChallenges;
}

function getChallengeId(room) {
  return `${room.id}:challenge`;
}

function isChallengeResolved(gameState, room) {
  return getResolvedChallenges(gameState).includes(getChallengeId(room));
}

function getPublicChallengeInfo(gameState, room) {
  if (!room.challenge) {
    return null;
  }

  return {
    ...room.challenge,
    blockedExits: getChallengeBlockedDirections(room.challenge),
    unlocksExits: getChallengeUnlockDirections(room.challenge),
    resolved: isChallengeResolved(gameState, room),
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
    sourceType: item.sourceType || null,
    rarity: item.rarity || null,
    flavorText: item.flavorText || "",
    imagePrompt: item.imagePrompt || "",
  };
}

function getPublicSkillInfo(skillId) {
  const skill = gameData.skills?.[skillId];

  if (!skill) {
    return null;
  }

  return {
    id: skill.id,
    name: skill.name,
    mpCost: skill.mpCost ?? 0,
    damage: skill.damage ?? 0,
    scaling: skill.scaling || "attack",
    hitCount: skill.hitCount ?? 1,
    heal: skill.heal ?? 0,
    shield: skill.shield ?? 0,
    defenseBonus: skill.defenseBonus ?? 0,
    duration: skill.duration ?? 0,
    role: skill.role || inferSkillRole(skill),
    flavorText: skill.flavorText || "",
    description: skill.description || "這個技能還沒有詳細說明。",
  };
}

function inferSkillRole(skill) {
  if ((skill.damage ?? 0) <= 0) {
    return "defense";
  }

  return "damage";
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

  if (action === "help" || action === "/help") {
    return handleHelp(gameState);
  }

  if (gameState.mode === "gameOver" || gameState.flags.gameOver || gameState.flags.gameWon) {
    if (action === "reset") {
      return createEventResult("reset", "遊戲即將重置。");
    }

    if (action === "status") {
      return handleStatus(gameState);
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
    case "help":
    case "/help":
      return handleHelp(gameState);

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

  return isBossRoom(room) && Boolean(monsterInfo);
}

function handleBossRetreat(gameState) {
  const room = getCurrentRoom(gameState);
  const monsterInfo = getRoomMonsterInfo(gameState, room);
  const retreatRoomId = findRetreatRoomId(gameState, room);

  if (!isBossRoom(room) || !monsterInfo) {
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

  const fromRoomId = room.id;
  gameState.player.currentRoom = retreatRoomId;
  gameState.player.previousRoomId = fromRoomId;
  gameState.mode = "explore";
  gameState.activeMonsterId = null;
  gameState.battle = createInitialBattleState();

  if (!gameState.player.visitedRooms.includes(retreatRoomId)) {
    gameState.player.visitedRooms.push(retreatRoomId);
  }

  addLog(gameState, `你暫時撤離了 ${room.name}`);

  return createEventResult(
    "boss_retreat",
    `你壓低腳步，趁 ${monsterInfo.name} 完全壓制出口前退回 ${gameData.rooms[retreatRoomId].name}。`
  );
}

function isBossRoom(room) {
  if (!room) return false;
  const monster = gameData.monsters?.[room.monster];

  return (
    room.kind === "boss" ||
    room.id === "boss_room" ||
    monster?.isBoss === true ||
    monster?.role === "boss" ||
    room.id === findBossRoomId()
  );
}

function findBossRoomId() {
  const requiredItemId = gameData.winCondition?.requiredItemId;
  const bossRoom = Object.values(gameData.rooms || {}).find((room) => room.kind === "boss") ||
    Object.values(gameData.rooms || {}).find((room) => room.monster && room.items?.includes(requiredItemId)) ||
    gameData.rooms?.boss_room;

  return bossRoom?.id || null;
}

function findRetreatRoomId(gameState, room) {
  if (gameState.player.previousRoomId && gameData.rooms[gameState.player.previousRoomId]) {
    return gameState.player.previousRoomId;
  }

  const exitRoomId = Object.values(room?.exits || {}).find((roomId) => gameData.rooms[roomId]);
  if (exitRoomId) {
    return exitRoomId;
  }

  return gameData.initialRoomId || getInitialRoomId();
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

    gameState.player.level += 1;
    gameState.player.statPoints = (gameState.player.statPoints || 0) + 2;
    gameState.player.nextExp = getExpToNextLevel(gameState.player.level);

    messages.push(
      [
        `你升到了 Lv. ${gameState.player.level}！`,
        "獲得 2 點屬性點。",
        "可在角色面板分配到 HP / MP / ATK / DEF。",
      ].join("，")
    );
    addLog(gameState, `你升到了 Lv. ${gameState.player.level}`);
  }

  gameState.player.nextExp = getExpToNextLevel(gameState.player.level);

  return messages;
}

function allocatePlayerStat(gameState, stat) {
  const statPoints = Number(gameState.player.statPoints) || 0;

  if (!["maxHp", "maxMp", "attack", "defense"].includes(stat)) {
    return {
      ok: false,
      message: "無效的能力值。",
    };
  }

  if (statPoints <= 0) {
    return {
      ok: false,
      message: "目前沒有可分配的屬性點。",
    };
  }

  const increments = {
    maxHp: 5,
    maxMp: 2,
    attack: 1,
    defense: 1,
  };
  const labels = {
    maxHp: "HP",
    maxMp: "MP",
    attack: "ATK",
    defense: "DEF",
  };
  const increment = increments[stat];

  gameState.player[stat] += increment;
  gameState.player.statPoints = statPoints - 1;

  if (stat === "maxHp") {
    gameState.player.hp += increment;
  }
  if (stat === "maxMp") {
    gameState.player.mp += increment;
  }

  clampPlayerResourcesToEffectiveMax(gameState);
  const message = `${labels[stat]} +${increment}，剩餘屬性點 ${gameState.player.statPoints}。`;
  addLog(gameState, message);

  return {
    ok: true,
    message,
  };
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

function handleHelp(gameState) {
  return createEventResult("help", formatAvailableCommands(gameState));
}

function formatAvailableCommands(gameState) {
  const commands = buildAvailableCommandDetails(gameState);

  if (typeof commands === "string") {
    return commands;
  }

  return [
    "目前可用指令：",
    ...commands.map((item) => `- ${item.command}：${item.description}`),
  ].join("\n");
}

function buildAvailableCommandDetails(gameState) {
  if (gameState.mode === "gameOver" || gameState.flags.gameOver || gameState.flags.gameWon) {
    return "探索已結束。可從 ESC 選單重新開始。";
  }

  if (gameState.mode === "battle") {
    const commands = [
      { command: "attack", description: "普通攻擊" },
      ...getPlayerSkillIds(gameState).map((skillId) => ({
        command: `skill ${skillId}`,
        description: `施放${gameData.skills[skillId].name}`,
      })),
    ];

    if (gameState.player.inventory.includes("small_potion")) {
      commands.push({ command: "use small_potion", description: "使用小型藥水" });
    }

    commands.push(
      { command: "escape", description: "嘗試脫離戰鬥" }
    );

    return commands;
  }

  const room = getCurrentRoom(gameState);
  const visibleItems = getAvailableRoomItemIds(gameState, room);
  const commands = [];

  for (const [direction, roomId] of Object.entries(room.exits || {})) {
    const targetRoom = gameData.rooms[roomId];
    const unresolvedChallenge = room.challenge && !isChallengeResolved(gameState, room) ? room.challenge : null;
    const isBlocked = unresolvedChallenge && challengeBlocksDirection(unresolvedChallenge, direction);
    commands.push({
      command: `move ${direction}`,
      description: isBlocked
        ? `被挑戰阻擋：${targetRoom?.name || roomId}`
        : `移動到${targetRoom?.name || roomId}`,
    });
  }

  for (const itemId of visibleItems) {
    commands.push({
      command: `take ${itemId}`,
      description: `取得${gameData.items[itemId]?.name || itemId}`,
    });
  }

  for (const itemId of getUsefulInventoryItemIds(gameState, room)) {
    commands.push({
      command: `use ${itemId}`,
      description: `使用${gameData.items[itemId]?.name || itemId}`,
    });
  }

  const monsterInfo = getActiveRoomMonsterInfo(gameState);
  if (monsterInfo) {
    commands.push({ command: "battle start", description: "開始戰鬥" });
  }

  if (isBossThreat(gameState)) {
    commands.push({ command: "retreat", description: "暫時撤回祭壇大廳" });
  }

  return commands;
}

function getUsefulInventoryItemIds(gameState, room = getCurrentRoom(gameState)) {
  return gameState.player.inventory.filter((itemId) => {
    const item = gameData.items[itemId];

    if (!item) {
      return false;
    }

    if (item.type === "consumable") {
      return true;
    }

    if (item.type === "equipment") {
      return true;
    }

    if (findChallengeUseTarget(gameState, room, item)) {
      return true;
    }

    if (item.type === "key") {
      return Boolean(findKeyUnlockTarget(gameState, room, item));
    }

    if (item.type === "quest") {
      return Boolean(item.usageHint);
    }

    return false;
  });
}

function handleLook(gameState) {
  const room = getCurrentRoom(gameState);
  const visibleItems = getAvailableRoomItemIds(gameState, room);

  const itemText =
    visibleItems.length > 0
      ? `你看到道具：${visibleItems.map((id) => gameData.items[id].name).join("、")}`
      : "這裡沒有可撿取的道具。";

  const monsterInfo = getRoomMonsterInfo(gameState, room);
  const monsterText = monsterInfo
    ? `你看到怪物：${monsterInfo.name}（HP ${monsterInfo.hp}/${monsterInfo.maxHp}）`
    : "這裡沒有怪物。";
  const challenge = room.challenge && !isChallengeResolved(gameState, room) ? room.challenge : null;
  const blockedDirections = getChallengeBlockedDirections(challenge);
  const challengeText = challenge
    ? `你注意到挑戰：${challenge.description}${blockedDirections.length ? ` 阻擋方向：${blockedDirections.join("、")}。` : ""}${challenge.solutionHint ? ` 提示：${challenge.solutionHint}` : ""}`
    : "這裡沒有尚未解開的挑戰。";

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

  if (challenge?.requiredItemId && gameState.player.inventory.includes(challenge.requiredItemId)) {
    actionHints.push(`use ${challenge.requiredItemId}`);
  }

  actionHints.push("status");
  actionHints.push("help");

  return createEventResult(
    "look",
    `${room.description}\n${itemText}\n${monsterText}\n${challengeText}\n可用建議：\n- ${actionHints.join("\n- ")}`
  );
}

function handleStatus(gameState) {
  const room = getCurrentRoom(gameState);
  const effectiveStats = getEffectivePlayerStats(gameState);
  const inventoryNames =
    gameState.player.inventory.length > 0
      ? gameState.player.inventory.map((id) => gameData.items[id].name).join("、")
      : "無";

  return createEventResult(
    "status",
    `角色狀態：Lv. ${gameState.player.level}，EXP ${gameState.player.exp}/${gameState.player.nextExp}，HP ${gameState.player.hp}/${effectiveStats.maxHp}，MP ${gameState.player.mp}/${effectiveStats.maxMp}，攻擊力 ${effectiveStats.attack}，防禦力 ${effectiveStats.defense}，目前位置：${room.name}，背包：${inventoryNames}`
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
      `你的 HP：${gameState.player.hp}/${getEffectivePlayerStats(gameState).maxHp}，MP：${gameState.player.mp}/${getEffectivePlayerStats(gameState).maxMp}`,
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

  const unresolvedChallenge = room.challenge && !isChallengeResolved(gameState, room) ? room.challenge : null;
  if (unresolvedChallenge && challengeBlocksDirection(unresolvedChallenge, direction)) {
    return createEventResult(
      "challenge_blocks_exit",
      `${unresolvedChallenge.description} ${unresolvedChallenge.solutionHint || "先解開這個挑戰再繼續前進。"}`
    );
  }

  gameState.player.previousRoomId = room.id;
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

  if (isRoomItemCollected(gameState, room.id, itemId)) {
    return createEventResult(
      "item_already_collected",
      `這裡已經沒有 ${gameData.items[itemId].name} 了。`
    );
  }

  if (gameState.player.inventory.includes(itemId)) {
    return createEventResult("item_already_taken", `你已經拿過 ${gameData.items[itemId].name}。`);
  }

  if (itemId === "ancient_core" && !gameState.flags.bossDefeated) {
    return createEventResult("core_protected", "古代核心仍被守護者保護，先擊敗它再來拿取。");
  }

  gameState.player.inventory.push(itemId);
  markRoomItemCollected(gameState, room.id, itemId);

  const requiredItemId = gameData.winCondition?.requiredItemId || "ancient_core";
  if (itemId === requiredItemId) {
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
    damage: getEffectivePlayerStats(gameState).attack,
    mpCost: 0,
  });
}

function handleExploreSkill(gameState, skillName) {
  if (!skillName) {
    return createEventResult(
      "skill_missing",
      `請指定技能名稱，例如 ${formatSkillExamples(gameState)}。`
    );
  }

  const skillId = findSkillIdByNameOrId(skillName);

  if (!skillId) {
    return createEventResult("skill_not_found", `找不到技能：${skillName}`);
  }

  if (!getPlayerSkillIds(gameState).includes(skillId)) {
    return createEventResult("skill_not_learned", `你尚未學會 ${gameData.skills[skillId].name}。`);
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
      `請指定技能名稱，例如 ${formatSkillExamples(gameState)}。`
    );
  }

  const skillId = findSkillIdByNameOrId(skillName);

  if (!skillId) {
    return createEventResult("skill_not_found", `找不到技能：${skillName}`);
  }

  if (!getPlayerSkillIds(gameState).includes(skillId)) {
    return createEventResult("skill_not_learned", `你尚未學會 ${gameData.skills[skillId].name}。`);
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

  if (isDefensiveSkill(skill)) {
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
  const equipmentStats = getEquipmentStats(gameState);
  const rawDamage =
    attackInfo.type === "skill"
      ? attackInfo.damage + equipmentStats.attack
      : attackInfo.damage;
  const finalDamage = Math.max(1, rawDamage - (monsterData.defense || 0));

  monsterState.hp -= finalDamage;

  let messageLines = [];

  messageLines.push(`你使用 ${attackInfo.name}，對 ${monsterData.name} 造成 ${finalDamage} 點傷害。`);

  if (monsterState.hp <= 0) {
    monsterState.hp = 0;
    monsterState.defeated = true;

    if (isWinConditionBoss(gameState, monsterId)) {
      gameState.flags.bossDefeated = true;
      messageLines.push(`${monsterData.name} 倒下了，關鍵物品周圍的威脅隨之消散。`);
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
  const effectiveStats = getEffectivePlayerStats(gameState);
  let damage = Math.max(1, monsterData.attack - effectiveStats.defense);

  if (gameState.player.isDefending) {
    damage = Math.max(1, Math.ceil(damage / 2));
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
  const challengeResult = handleUseChallengeItem(gameState, item);

  if (challengeResult) {
    return challengeResult;
  }

  if (item.type === "consumable" && item.effect && item.effect.hp) {
    const oldHp = gameState.player.hp;
    const effectiveStats = getEffectivePlayerStats(gameState);
    gameState.player.hp += item.effect.hp;

    if (gameState.player.hp > effectiveStats.maxHp) {
      gameState.player.hp = effectiveStats.maxHp;
    }

    const healed = gameState.player.hp - oldHp;

    removeItemFromInventory(gameState, itemId);
    addLog(gameState, `你使用了 ${item.name}`);
    const message = `你使用了 ${item.name}，恢復 ${healed} 點 HP。現在 HP：${gameState.player.hp}/${effectiveStats.maxHp}`;

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
    return equipItem(gameState, itemId);
  }

  if (item.type === "material") {
    const message = `目前環境中沒有適合使用 ${item.name} 的地方。`;
    addLog(gameState, `你嘗試使用 ${item.name}`);
    return createEventResult("use_material_no_target", message);
  }

  return createEventResult("use_no_effect", `${item.name} 沒有可用效果。`);
}

function handleUseChallengeItem(gameState, item) {
  const room = getCurrentRoom(gameState);
  const challengeTarget = findChallengeUseTarget(gameState, room, item);

  if (!challengeTarget) {
    const unresolvedChallenge = room.challenge && !isChallengeResolved(gameState, room) ? room.challenge : null;
    if (unresolvedChallenge?.requiredItemId && ["key", "material", "quest"].includes(item.type)) {
      const requiredItem = gameData.items[unresolvedChallenge.requiredItemId];
      return createEventResult(
        "challenge_wrong_item",
        `${item.name} 無法處理這個挑戰。你可能需要 ${requiredItem?.name || unresolvedChallenge.requiredItemId}。`
      );
    }
    return null;
  }

  const resolvedChallenges = getResolvedChallenges(gameState);
  const challengeId = getChallengeId(room);

  if (!resolvedChallenges.includes(challengeId)) {
    resolvedChallenges.push(challengeId);
  }

  for (const rewardItemId of challengeTarget.rewardItemIds || []) {
    if (gameData.items[rewardItemId] && !room.items.includes(rewardItemId)) {
      room.items.push(rewardItemId);
    }
  }

  applyChallengeUnlocks(room, challengeTarget);

  addLog(gameState, `你解開了 ${room.name} 的挑戰`);
  const rewardText = (challengeTarget.rewardItemIds || [])
    .filter((rewardItemId) => gameData.items[rewardItemId])
    .map((rewardItemId) => gameData.items[rewardItemId].name)
    .join("、");

  return createEventResult(
    "challenge_resolved",
    `你使用 ${item.name} 解開了眼前的挑戰。${challengeTarget.solutionHint || ""}${rewardText ? ` 新的獎勵出現了：${rewardText}。` : ""}`
  );
}

function applyChallengeUnlocks(room, challenge) {
  if (challenge.unlocksExit?.direction && challenge.unlocksExit?.roomId && gameData.rooms[challenge.unlocksExit.roomId]) {
    room.exits = room.exits || {};
    room.exits[challenge.unlocksExit.direction] = challenge.unlocksExit.roomId;
  }

  if (challenge.unlocksRoom && gameData.rooms[challenge.unlocksRoom]) {
    const direction = findFreeExitDirection(room);
    if (direction) {
      room.exits = room.exits || {};
      room.exits[direction] = challenge.unlocksRoom;
    }
  }
}

function findFreeExitDirection(room) {
  return ["north", "east", "south", "west"].find((direction) => !room.exits?.[direction]);
}

function getChallengeBlockedDirections(challenge) {
  if (!challenge) {
    return [];
  }

  if (Array.isArray(challenge.blockedExits)) {
    return challenge.blockedExits.filter(Boolean);
  }

  if (challenge.blocksExit) {
    return [challenge.blocksExit].filter(Boolean);
  }

  if (challenge.unlocksExit?.direction) {
    return [challenge.unlocksExit.direction];
  }

  return [];
}

function getChallengeUnlockDirections(challenge) {
  if (!challenge) {
    return [];
  }

  if (Array.isArray(challenge.unlocksExits)) {
    return challenge.unlocksExits.filter(Boolean);
  }

  if (challenge.unlocksExit?.direction) {
    return [challenge.unlocksExit.direction];
  }

  return [];
}

function challengeBlocksDirection(challenge, direction) {
  return getChallengeBlockedDirections(challenge).includes(direction);
}

function equipItem(gameState, itemId) {
  const item = gameData.items[itemId];
  const slot = item.slot;

  if (!["weapon", "armor", "accessory"].includes(slot)) {
    return createEventResult("equipment_missing_slot", `${item.name} 缺少有效裝備欄位，無法裝備。`);
  }

  if (!gameState.player.equipment) {
    gameState.player.equipment = { weapon: null, armor: null, accessory: null };
  }

  const previousItemId = gameState.player.equipment[slot];
  gameState.player.equipment[slot] = itemId;
  removeItemFromInventory(gameState, itemId);

  if (previousItemId && !gameState.player.inventory.includes(previousItemId)) {
    gameState.player.inventory.push(previousItemId);
  }

  clampPlayerResourcesToEffectiveMax(gameState);
  addLog(gameState, `你裝備了 ${item.name}`);

  const previousText = previousItemId ? `，換下 ${gameData.items[previousItemId]?.name || previousItemId}` : "";
  return createEventResult(
    "equip_item",
    `你裝備了 ${item.name}${previousText}。目前攻擊 ${getEffectivePlayerStats(gameState).attack}，防禦 ${getEffectivePlayerStats(gameState).defense}。`
  );
}

function clampPlayerResourcesToEffectiveMax(gameState) {
  const effectiveStats = getEffectivePlayerStats(gameState);
  gameState.player.hp = Math.min(gameState.player.hp, effectiveStats.maxHp);
  gameState.player.mp = Math.min(gameState.player.mp, effectiveStats.maxMp);
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

function findChallengeUseTarget(gameState, room, item) {
  if (!room.challenge || isChallengeResolved(gameState, room)) {
    return null;
  }

  if (room.challenge.requiredItemId && room.challenge.requiredItemId !== item.id) {
    return null;
  }

  return room.challenge;
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
  const winCondition = gameData.winCondition || {
    type: "return_with_item",
    requiredItemId: "ancient_core",
    returnRoomId: "entrance",
    requiredBossDefeated: true,
  };
  const hasRequiredItem =
    !winCondition.requiredItemId ||
    gameState.player.inventory.includes(winCondition.requiredItemId);
  const returnedToTarget =
    !winCondition.returnRoomId ||
    gameState.player.currentRoom === winCondition.returnRoomId;
  const bossRequirementMet =
    !winCondition.requiredBossDefeated || gameState.flags.bossDefeated;

  if (!gameState.flags.gameWon && hasRequiredItem && returnedToTarget && bossRequirementMet) {
    gameState.flags.gameWon = true;
    addLog(gameState, "你帶著關鍵物品回到了目標地點，探索完成。");
  }
}

function isWinConditionBoss(gameState, monsterId) {
  if (monsterId === "ruin_guardian") {
    return true;
  }

  const winCondition = gameData.winCondition;

  if (!winCondition?.requiredBossDefeated) {
    return false;
  }

  const currentRoom = getCurrentRoom(gameState);
  const requiredItemId = winCondition.requiredItemId;

  return currentRoom?.monster === monsterId && currentRoom?.items?.includes(requiredItemId);
}

function isDefensiveSkill(skill) {
  return (skill.role || inferSkillRole(skill)) === "defense" || (skill.damage ?? 0) <= 0;
}

function formatSkillExamples(gameState) {
  const skillIds = getPlayerSkillIds(gameState);

  if (skillIds.length === 0) {
    return "skill <skill_id>";
  }

  return skillIds.slice(0, 3).map((skillId) => `skill ${skillId}`).join("、");
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
  getRuntimeGameData,
  setRuntimeGameData,
  createInitialGameState,
  getPublicGameState,
  handleCommand,
  allocatePlayerStat,
};
