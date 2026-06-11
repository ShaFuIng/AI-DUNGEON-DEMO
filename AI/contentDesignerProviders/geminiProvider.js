function buildPrompt(input = {}) {
  const theme = input.theme || '冰封遺跡';
  const difficulty = input.difficulty || 5;
  const roomCount = input.roomCount || 4;

  return [
    '你是 Content Designer Agent。',
    '請根據 input 產生 generatedArea JSON。',
    '',
    '輸入條件：',
    `- theme: ${theme}`,
    `- difficulty: ${difficulty}`,
    `- roomCount: ${roomCount}`,
    '',
    '根層（root object）規則：',
    '- root 必須包含以下欄位：id, name, theme, narrativeHook, difficulty, rooms。',
    '- root 可以包含 items、monsters、skills、traps。',
    '- 禁止輸出任何其他 root 欄位。',
    '- 不要輸出 roomCount。',
    '- 不要輸出 metadata。',
    '- 不要輸出 notes。',
    '- 不要輸出 comments。',
    '- 不要輸出 explanation。',
    '',
    'rooms 規則：',
    `- rooms 必須是 array，且 rooms.length 必須剛好等於 ${roomCount}。`,
    '- rooms.length 不可以少，也不可以多。',
    '- 所有房間必須可從 rooms[0] 抵達。',
    '',
    '每個 room object 規則：',
    '- 每個 room 必須且只能包含以下 6 個欄位：id, name, description, exits, items, monster。',
    '- 禁止輸出其他 room 欄位。',
    '- 不要輸出 difficulty。',
    '- 不要輸出 tags。',
    '- 不要輸出 hidden。',
    '- 不要輸出 metadata。',
    '- 不要輸出 notes。',
    '',
    'exits 規則：',
    '- exits 只能使用 north / south / east / west。',
    '- exits 只能指向 rooms array 中存在的 room.id。',
    '- exits 不得指向不存在房間。',
    '- exits 必須雙向一致。',
    '',
    'items 規則：',
    '- room.items 必須是 array。',
    '- room.items 可以引用 root.items 中定義的 item id，也可以引用既有基礎 item：torch, rusty_key, small_potion, ancient_core。',
    '- 每個 room 的 items 不要重複。',
    '- 若輸出 root.items，每個 item 必須包含：id, name, type, description, usageHint。',
    '- item.type 只能是 key / consumable / equipment / quest / material。',
    '- consumable item 可以包含 effect，例如 { "hp": 10 }。',
    '- key / quest item 可以包含 unlocks，例如 ["boss_room"]。',
    '- 道具 description 必須讓玩家理解用途，不可空泛。',
    '',
    'equipment 規則：',
    '- 裝備也放在 root.items，且 type 必須是 equipment。',
    '- equipment 必須包含 slot: weapon / armor / accessory。',
    '- equipment 必須包含 stats，例如 { "attack": 2 } 或 { "defense": 1, "maxHp": 5 }。',
    '- equipment 必須包含 usageHint，說明適合何時使用或裝備。',
    '',
    'monster 規則：',
    '- room.monster 必須是 null、既有基礎 monster id，或 root.monsters 中定義的 monster id。',
    '- 若輸出 root.monsters，每個 monster 必須包含：id, name, hp, maxHp, attack, defense, expReward, drops, description。',
    '- drops 使用 item id array，例如 ["small_potion"]，代表固定掉落。',
    '- 怪物擊敗後應提供合理 expReward 和 drops。',
    '',
    '遊戲流程規則：',
    '- 重要門、寶箱、機關，必須對應 key item 或 quest item。',
    '- 裝備要能透過 stats 影響角色數值。',
    '- 怪物擊敗後要有 expReward 和 drops。',
    '',
    'id 規則：',
    '- 所有 id 必須是 snake_case。',
    '- 不要使用中文 id。',
    '- 不要使用 dash。',
    '- 不要使用空白。',
    '',
    '文字內容規則：',
    '- name / description 使用繁體中文。',
    '',
    '輸出格式規則（嚴格）：',
    '- 最終輸出必須是單一 JSON object。',
    '- 第一個字元必須是 {。',
    '- 最後一個字元必須是 }。',
    '- 不要 markdown code block。',
    '- 不要輸出 ```json。',
    '- 不要任何前後說明文字。',
    '- 不要註解。',
    '',
    '輸出前自我檢查（不要輸出檢查過程）：',
    '- root 是否只使用允許欄位。',
    `- rooms.length 是否剛好等於 ${roomCount}。`,
    '- 每個 room 是否只有 6 個允許欄位。',
    '- exits 是否只指向存在房間。',
    '- exits 是否雙向一致。',
    '- room.items / room.monster 是否都能對應到 root 或基礎 gameData。',
    '',
    '只輸出最終 JSON。'
  ].join('\n');
}

async function generateRawArea(input = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for gemini provider.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const prompt = buildPrompt(input);

  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available in this Node.js runtime.');
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) +
    ':generateContent?key=' +
    encodeURIComponent(apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Gemini API request failed: ' + response.status + ' ' + errorText);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string') {
    throw new Error('Gemini API response did not include text output.');
  }

  return text.trim();
}

module.exports = {
  generateRawArea
};
