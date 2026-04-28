const gameData = require("../data/gameData");

function createInitialGameState() {
  return {
    player: {
      hp: 30,
      maxHp: 30,
      mp: 10,
      maxMp: 10,
      attack: 6,
      inventory: [],
      currentRoom: "entrance",
      visitedRooms: ["entrance"],
      isDefending: false,
    },

    flags: {
      hasAncientCore: false,
      bossDefeated: false,
      gameWon: false,
      gameOver: false,
    },

    monsters: createMonsterState(),

    log: ["遊戲開始：你站在古代地下遺跡入口。"],
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

  return {
    player: {
      hp: gameState.player.hp,
      maxHp: gameState.player.maxHp,
      mp: gameState.player.mp,
      maxMp: gameState.player.maxMp,
      attack: gameState.player.attack,
      inventory: gameState.player.inventory.map((itemId) => {
        return gameData.items[itemId].name;
      }),
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

    log: gameState.log,
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
    description: monsterData.description,
  };
}

function handleCommand(gameState, rawCommand) {
  const command = rawCommand.trim().toLowerCase();
  const parts = command.split(/\s+/);
  const action = parts[0];
  const target = parts.slice(1).join(" ");

  if (command === "") {
    return createEventResult("empty", "請輸入指令。");
  }

  if (gameState.flags.gameOver || gameState.flags.gameWon) {
    if (action === "reset") {
      return createEventResult("reset", "遊戲已重新開始。");
    }

    return createEventResult("game_ended", "遊戲已結束，請輸入 reset 重新開始。");
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

    case "attack":
      return handleAttack(gameState);

    case "skill":
      return handleSkill(gameState, target);

    case "use":
      return handleUseItem(gameState, target);

    case "log":
      return handleLog(gameState);

    case "reset":
      return createEventResult("reset", "遊戲已重新開始。");

    default:
      return createEventResult(
        "unknown_command",
        "未知指令。請輸入 help 查看可用指令。"
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

function handleHelp() {
  return createEventResult(
    "help",
    [
      "可用指令：",
      "- help：顯示指令",
      "- look：查看目前房間",
      "- status：查看狀態",
      "- move north / south / east / west：移動",
      "- take item：撿道具，例如 take torch",
      "- attack：普通攻擊",
      "- skill slash：使用斬擊",
      "- skill fireball：使用火球術",
      "- skill guard：使用防禦姿態",
      "- use small_potion：使用小藥水",
      "- log：顯示冒險日誌",
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
      ? `你看到：${visibleItems.map((id) => gameData.items[id].name).join("、")}。`
      : "這裡沒有可以撿起的道具。";

  const monsterInfo = getRoomMonsterInfo(gameState, room);
  const monsterText = monsterInfo
    ? `這裡有敵人：${monsterInfo.name}，HP ${monsterInfo.hp}/${monsterInfo.maxHp}。`
    : "這裡目前沒有敵人。";

  const actionHints = [];

  for (const itemId of visibleItems) {
    actionHints.push(`take ${itemId}`);
  }

  for (const direction in room.exits) {
    actionHints.push(`move ${direction}`);
  }

  if (monsterInfo) {
    actionHints.push("attack");
    actionHints.push("skill slash");
    actionHints.push("skill fireball");
    actionHints.push("skill guard");
  }

  if (gameState.player.inventory.includes("small_potion")) {
    actionHints.push("use small_potion");
  }

  actionHints.push("status");
  actionHints.push("help");

  return createEventResult(
    "look",
    `${room.description}\n${itemText}\n${monsterText}\n可用行動：\n- ${actionHints.join("\n- ")}`
  );
}

function handleStatus(gameState) {
  const room = getCurrentRoom(gameState);
  const inventoryNames =
    gameState.player.inventory.length > 0
      ? gameState.player.inventory.map((id) => gameData.items[id].name).join("、")
      : "空";

  return createEventResult(
    "status",
    `目前狀態：HP ${gameState.player.hp}/${gameState.player.maxHp}，MP ${gameState.player.mp}/${gameState.player.maxMp}，攻擊力 ${gameState.player.attack}，位置：${room.name}，背包：${inventoryNames}。`
  );
}

function handleMove(gameState, direction) {
  const room = getCurrentRoom(gameState);

  if (!direction) {
    return createEventResult(
      "move_missing_direction",
      "請輸入方向，例如：move north。"
    );
  }

  if (!room.exits[direction]) {
    return createEventResult(
      "invalid_move",
      `你不能往 ${direction} 走。可用方向：${Object.keys(room.exits).join("、")}。`
    );
  }

  const monsterInfo = getRoomMonsterInfo(gameState, room);
  if (monsterInfo) {
    return createEventResult(
      "blocked_by_monster",
      `你不能無視 ${monsterInfo.name} 離開，必須先處理這個敵人。`
    );
  }

  const nextRoomId = room.exits[direction];

  if (nextRoomId === "boss_room" && !gameState.player.inventory.includes("rusty_key")) {
    return createEventResult(
      "locked_door",
      "通往守護者房間的石門被鎖住了，也許需要某把鑰匙。"
    );
  }

  gameState.player.currentRoom = nextRoomId;

  if (!gameState.player.visitedRooms.includes(nextRoomId)) {
    gameState.player.visitedRooms.push(nextRoomId);
  }

  const nextRoom = getCurrentRoom(gameState);
  addLog(gameState, `玩家移動到：${nextRoom.name}`);

  checkWinCondition(gameState);

  if (gameState.flags.gameWon) {
    return createEventResult(
      "game_won",
      "你帶著古代核心回到了遺跡入口。石門外的陽光照在核心上，藍色光芒逐漸穩定下來。任務完成，你成功逃離了地下遺跡！"
    );
  }

  return handleLook(gameState);
}

function handleTake(gameState, targetName) {
  const room = getCurrentRoom(gameState);

  if (!targetName) {
    return createEventResult("take_missing_item", "請輸入要撿起的道具，例如：take torch。");
  }

  const itemId = findItemIdByNameOrId(targetName);

  if (!itemId) {
    return createEventResult("item_not_found", `沒有找到道具：${targetName}。`);
  }

  if (!room.items.includes(itemId)) {
    return createEventResult(
      "item_not_in_room",
      `${gameData.items[itemId].name} 不在這個房間。`
    );
  }

  if (gameState.player.inventory.includes(itemId)) {
    return createEventResult(
      "item_already_taken",
      `你已經拿過 ${gameData.items[itemId].name}。`
    );
  }

  if (itemId === "ancient_core" && !gameState.flags.bossDefeated) {
    return createEventResult(
      "core_protected",
      "古代核心被守護者的力量保護著，必須先打敗守護者。"
    );
  }

  gameState.player.inventory.push(itemId);

  if (itemId === "ancient_core") {
    gameState.flags.hasAncientCore = true;
  }

  addLog(gameState, `玩家取得道具：${gameData.items[itemId].name}`);

  return createEventResult(
    "take",
    `你取得了 ${gameData.items[itemId].name}。${gameData.items[itemId].description}`
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

function handleSkill(gameState, skillName) {
  if (!skillName) {
    return createEventResult(
      "skill_missing",
      "請輸入技能名稱，例如：skill slash、skill fireball、skill guard。"
    );
  }

  const skillId = findSkillIdByNameOrId(skillName);

  if (!skillId) {
    return createEventResult("skill_not_found", `沒有這個技能：${skillName}。`);
  }

  const skill = gameData.skills[skillId];

  if (gameState.player.mp < skill.mpCost) {
    return createEventResult(
      "not_enough_mp",
      `MP 不足。${skill.name} 需要 ${skill.mpCost} MP。`
    );
  }

  gameState.player.mp -= skill.mpCost;

  if (skillId === "guard") {
    gameState.player.isDefending = true;
    addLog(gameState, "玩家使用防禦姿態。");

    return createEventResult(
      "guard",
      `你使用了 ${skill.name}，消耗 ${skill.mpCost} MP。下一次受到的傷害會降低。`
    );
  }

  return performPlayerAttack(gameState, {
    type: "skill",
    name: skill.name,
    damage: skill.damage,
    mpCost: skill.mpCost,
  });
}

function performPlayerAttack(gameState, attackInfo) {
  const room = getCurrentRoom(gameState);
  const monsterInfo = getRoomMonsterInfo(gameState, room);

  if (!monsterInfo) {
    return createEventResult(
      "no_monster",
      "這裡沒有敵人可以攻擊。"
    );
  }

  const monsterId = monsterInfo.id;
  const monsterData = gameData.monsters[monsterId];
  const monsterState = gameState.monsters[monsterId];

  monsterState.hp -= attackInfo.damage;

  let messageLines = [];

  messageLines.push(
    `你使用 ${attackInfo.name}，對 ${monsterData.name} 造成 ${attackInfo.damage} 點傷害。`
  );

  if (monsterState.hp <= 0) {
    monsterState.hp = 0;
    monsterState.defeated = true;

    if (monsterId === "ruin_guardian") {
      gameState.flags.bossDefeated = true;
      messageLines.push("遺跡守護者的核心光芒逐漸熄滅，守護古代核心的力量消失了。");
    } else {
      messageLines.push(`${monsterData.name} 被你擊敗了。`);
    }

    addLog(gameState, `玩家擊敗：${monsterData.name}`);

    messageLines.push("你可以輸入 look 查看目前房間。");

    return createEventResult("monster_defeated", messageLines.join("\n"));
  }

  messageLines.push(
    `${monsterData.name} 剩餘 HP：${monsterState.hp}/${monsterData.maxHp}。`
  );

  const monsterAttackResult = performMonsterCounterAttack(gameState, monsterData);
  messageLines.push(monsterAttackResult);

  checkGameOver(gameState);

  if (gameState.flags.gameOver) {
    messageLines.push("你的 HP 歸零，探險失敗。請輸入 reset 重新開始。");
  }

  addLog(gameState, `玩家攻擊 ${monsterData.name}`);

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

  return `${monsterData.name} 反擊，對你造成 ${damage} 點傷害。`;
}

function handleUseItem(gameState, targetName) {
  if (!targetName) {
    return createEventResult(
      "use_missing_item",
      "請輸入要使用的道具，例如：use small_potion。"
    );
  }

  const itemId = findItemIdByNameOrId(targetName);

  if (!itemId) {
    return createEventResult("use_item_not_found", `沒有這個道具：${targetName}。`);
  }

  if (!gameState.player.inventory.includes(itemId)) {
    return createEventResult(
      "use_item_not_owned",
      `你的背包裡沒有 ${gameData.items[itemId].name}。`
    );
  }

  const item = gameData.items[itemId];

  if (item.type !== "consumable") {
    return createEventResult(
      "use_not_consumable",
      `${item.name} 不能直接使用。`
    );
  }

  if (item.effect && item.effect.hp) {
    const oldHp = gameState.player.hp;
    gameState.player.hp += item.effect.hp;

    if (gameState.player.hp > gameState.player.maxHp) {
      gameState.player.hp = gameState.player.maxHp;
    }

    const healed = gameState.player.hp - oldHp;

    removeItemFromInventory(gameState, itemId);
    addLog(gameState, `玩家使用道具：${item.name}`);

    return createEventResult(
      "use_item",
      `你使用了 ${item.name}，恢復 ${healed} 點 HP。目前 HP：${gameState.player.hp}/${gameState.player.maxHp}。`
    );
  }

  return createEventResult(
    "use_no_effect",
    `${item.name} 目前沒有可用效果。`
  );
}

function removeItemFromInventory(gameState, itemId) {
  const index = gameState.player.inventory.indexOf(itemId);

  if (index !== -1) {
    gameState.player.inventory.splice(index, 1);
  }
}

function checkGameOver(gameState) {
  if (gameState.player.hp <= 0) {
    gameState.flags.gameOver = true;
  }
}

function checkWinCondition(gameState) {
  if (
    gameState.flags.hasAncientCore &&
    gameState.flags.bossDefeated &&
    gameState.player.currentRoom === "entrance"
  ) {
    gameState.flags.gameWon = true;
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
  createInitialGameState,
  getPublicGameState,
  handleCommand,
};