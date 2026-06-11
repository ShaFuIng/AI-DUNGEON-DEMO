function buildRuntimeAdventurePrompt(input = {}) {
  const modelGenre = input.genre || "奇幻遺跡";
  const characterPrompt = input.characterPrompt || "一位謹慎但勇敢的冒險者。";
  const adventurePrompt = input.adventurePrompt || "設計一段短篇地下城冒險。";
  const roomCount = Number(input.roomCount) || 5;
  const difficulty = Number(input.difficulty) || 4;

  return [
    "你是 RPG 文字冒險 Content Designer。請只輸出一個可直接執行的 JSON object。",
    "語言使用繁體中文；所有 id 使用 snake_case 英文，不要使用中文、dash 或空白。",
    "",
    "玩家設定：",
    characterPrompt,
    "",
    "冒險需求：",
    `類型：${modelGenre}`,
    `房間數：${roomCount}`,
    `難度：${difficulty}/10`,
    adventurePrompt,
    "",
    "JSON schema 必須符合：",
    "- root 欄位：initialRoomId, winCondition, player, rooms, items, monsters, skills",
    "- winCondition: { type: \"return_with_item\", requiredItemId, returnRoomId, requiredBossDefeated }",
    "- player: hp, maxHp, mp, maxMp, attack, defense, level, skills",
    "- rooms 是 object map，key 必須等於 room.id；房間數必須剛好等於指定房間數。",
    "- 每個 room: id, name, description, ascii, exits, items, monster",
    "- exits 只能使用 north/south/east/west，且每個出口只能指向存在的 room id。",
    "- exits 必須雙向一致，所有房間必須可從 initialRoomId 抵達。",
    "- room.items 只能引用 items 中存在的 id；room.monster 必須是 null 或引用 monsters 中存在的 id。",
    "- 至少 1 個普通怪物、1 個 Boss、1 個補血道具、1 個任務關鍵物品。",
    "- Boss 必須守著任務關鍵物品所在房間；winCondition.requiredItemId 必須是該任務物品。",
    "- items 每個物件必須有 id, name, description, type, usageHint；consumable 必須有 effect.hp。",
    "- monsters 每個物件必須有 id, name, maxHp, hp, attack, defense, expReward, drops, description。",
    "- skills 必須剛好 3 個，player.skills 必須引用這 3 個 skill id。",
    "- skills 每個物件必須有 id, name, mpCost, damage, description, role。",
    "- 3 個技能要包含：一個不耗或低耗的穩定傷害、一個較強攻擊、一個防禦或 utility。role 只能是 damage/defense/utility。",
    "",
    "平衡建議：",
    "- 難度越高，怪物 HP/attack 可提高，但仍要讓玩家有機會完成。",
    "- 避免把勝利物品放在初始房間。",
    "- 每個房間 description 要能支持 Map / Story UI 直接顯示。",
    "",
    "輸出格式：",
    "- 第一個字元必須是 {，最後一個字元必須是 }。",
    "- 不要 markdown code block、不要說明、不要註解。",
  ].join("\n");
}

module.exports = {
  buildRuntimeAdventurePrompt,
};
