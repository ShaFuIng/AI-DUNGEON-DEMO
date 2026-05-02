# Content Designer Provider Contract

## 1. 文件目的
本文件定義 `Content Designer Agent` 與 LLM provider 之間的邊界與責任。
核心原則是：provider 只負責產生「內容草案」，不得直接修改 Runtime 遊戲規則或遊戲狀態。

## 2. Provider 的角色
`Content Designer Agent` 的 provider 可以是以下任一種：
- mock provider
- Gemini provider
- GPT provider
- Ollama provider

不論來源為何，provider 輸出都必須遵守 `generatedArea` contract，並通過 `tools/validateArea.js`。

## 3. Provider 可以做的事
- 根據主題產生 Area JSON 草案。
- 產生 `rooms` 內容與連通結構。
- 產生繁體中文敘事描述（如 `name`、`description`、`narrativeHook`）。
- 從允許清單中選用既有 `item` / `monster` id。
- 未來可擴充產生 `Phase 1.5` 的 `items` / `monsters` / `skills` / `traps` 草案。

## 4. Provider 禁止做的事
- 不得直接修改 `gameEngine.js`。
- 不得直接修改 `data/gameData.js`。
- 不得直接 commit / push。
- 不得輸出 API key / `.env` / 任何敏感資訊。
- 不得決定玩家 `HP` / `MP` / `inventory` / `position` / `monster HP`。
- 不得跳過 validator。
- 不得輸出 markdown code block。
- 不得在 JSON 前後加任何說明文字。

## 5. Input Contract
未來 provider function 可接收的輸入欄位（建議）：
- `theme`
- `difficulty`
- `roomCount`
- `allowedItems`
- `allowedMonsters`
- `styleNotes`
- `constraints`

範例 input object：
```json
{
  "theme": "冰封遺跡",
  "difficulty": 5,
  "roomCount": 4,
  "allowedItems": ["torch", "rusty_key", "small_potion", "ancient_core"],
  "allowedMonsters": ["skeleton_guard", "ruin_guardian"],
  "styleNotes": ["繁體中文描述", "偏冷冽神祕風格"],
  "constraints": {
    "idFormat": "snake_case",
    "exitDirections": ["north", "south", "east", "west"],
    "requireBidirectionalExits": true,
    "requireReachableFromFirstRoom": true
  }
}
```

## 6. Output Contract
provider 必須輸出「純 JSON object」，且符合 `generatedArea` schema / validator。

強制要求：
- 只能輸出 JSON。
- 不要使用 ```json code block。
- 不要輸出解釋文字。
- 不要加註解。
- root 必須包含：`id` / `name` / `theme` / `narrativeHook` / `difficulty` / `rooms`。
- 每個 room 必須包含：`id` / `name` / `description` / `exits` / `items` / `monster`。

簡化範例：
```json
{
  "id": "frozen_ruins",
  "name": "冰封遺跡",
  "theme": "寒霜與古代機關",
  "narrativeHook": "你踏進結霜長廊，遠處傳來金屬摩擦聲。",
  "difficulty": 5,
  "rooms": [
    {
      "id": "frozen_gate",
      "name": "冰封外門",
      "description": "石門覆冰，寒氣滲出。",
      "exits": { "north": "frost_hall" },
      "items": ["torch"],
      "monster": null
    },
    {
      "id": "frost_hall",
      "name": "霜痕長廊",
      "description": "牆上冰晶折光，腳步聲迴盪。",
      "exits": { "south": "frozen_gate" },
      "items": ["rusty_key"],
      "monster": "skeleton_guard"
    }
  ]
}
```

## 7. Validation Flow
1. provider 產生 raw output。
2. 系統先進行 JSON parse。
3. 將 parse 後 JSON 寫入 `outputs/generatedArea.json`。
4. 執行 `node tools/validateArea.js outputs/generatedArea.json`。
5. 只有 PASS 才能進入 Human Review。
6. 若 FAIL，保留錯誤訊息，不合併、不改 `data/gameData.js`。

## 8. Error Handling
- JSON parse failed：視為 provider output invalid。
- validator failed：視為 generatedArea invalid。
- provider timeout：保留 mock fallback 或回報錯誤。
- unknown item / monster：由 validator 擋下。
- extra fields：由 validator 擋下。

## 9. Prompt Template 草案
可供未來 LLM provider 使用的模板：

你是 Content Designer Agent。請根據輸入條件產生一份 `generatedArea` JSON。

要求：
- `name`、`narrativeHook`、`room.name`、`room.description` 使用繁體中文。
- 所有 `id`（含 root 與 room）必須是 `snake_case`。
- `exits` 只能使用 `north` / `south` / `east` / `west`。
- `exits` 必須雙向一致。
- 所有房間必須可由第一個房間到達。
- `items` 只能從 `allowedItems` 選擇。
- `monster` 只能是 `allowedMonsters` 之一或 `null`。
- root 必須包含：`id`、`name`、`theme`、`narrativeHook`、`difficulty`、`rooms`。
- room 必須包含：`id`、`name`、`description`、`exits`、`items`、`monster`。
- 只輸出 JSON，不要任何前後說明，不要 markdown code block。

## 10. 與現有架構的關係
- `Content Designer Agent` 是 Development-time 工具。
- `Narrator Agent` 是 Runtime narration。
- `Game Engine` 是唯一可以修改遊戲 `state` 的地方。
- provider output 不會直接進入遊戲，必須先經過 validator 與 Human Review。

## 11. 後續步驟
- Step 16：建立 provider interface。
- Step 17：加入 mock provider / raw JSON parse flow。
- Step 18：再考慮 Gemini / GPT / Ollama provider。
- Step 19：產生 patch 建議，但不直接改 `data/gameData.js`。
