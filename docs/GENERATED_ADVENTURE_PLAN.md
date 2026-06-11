# Generated Adventure Plan

## 目標

讓玩家可以在瀏覽器輸入 Gemini API key、選擇模型、設定角色與冒險 prompt，並在 runtime 生成一份可直接遊玩的 `gameData`。預設 Demo 仍保留，不覆蓋 `data/gameData.js`。

## Runtime API

`POST /api/adventure/generate`

Request body:

```json
{
  "apiKey": "...",
  "model": "gemini-2.5-flash-lite",
  "genre": "奇幻遺跡",
  "characterPrompt": "角色設定",
  "adventurePrompt": "冒險設定",
  "roomCount": 5,
  "difficulty": 4
}
```

Response body:

```json
{
  "state": "publicGameState",
  "gameData": "publicGameData",
  "generationSummary": "..."
}
```

## 安全邊界

- API key 只由前端存入使用者瀏覽器的 `localStorage`。
- 後端只在該次 request 使用 `apiKey` 呼叫 Gemini。
- 後端不記錄、不回傳、不寫入 API key。
- 生成失敗或 validator 失敗時，server 會回到預設 Demo。
- `data/gameData.js` 不會被 runtime 生成流程修改。
- 422 response 會保留 `details`；server terminal 會列出 raw / normalized summary 與 validation errors，但不會輸出 API key。

## GameData Schema

Runtime generated `gameData` 使用與 engine 相容的 object map 格式：

- `initialRoomId`
- `winCondition`
- `player`
- `rooms`
- `items`
- `monsters`
- `skills`

`winCondition` 目前支援：

```json
{
  "type": "return_with_item",
  "requiredItemId": "ancient_core",
  "returnRoomId": "entrance",
  "requiredBossDefeated": true
}
```

## Validator 重點

- `initialRoomId` 必須存在。
- 所有房間必須可從起點抵達。
- exits 只能使用 `north/south/east/west`，且必須雙向一致。
- room item / monster references 必須存在。
- player skills 必須引用既有 skills。
- 至少要有補血 consumable、quest item、monster encounter。
- 若勝利條件要求 Boss defeat，任務物品所在房間必須有 monster 守護。

## Normalizer

Gemini 有時會把 `items`、`monsters`、`skills` 輸出成 array。Runtime 流程會先執行：

```txt
raw Gemini JSON -> parse -> normalizeRuntimeGameData -> validateRuntimeGameData
```

`normalizeRuntimeGameData` 會處理常見偏差：

- `items` / `monsters` / `skills` array 轉成 object map。
- object map 的 key 會對齊 inner `id`。
- 缺少 `id` 時，從 `name` 產生 safe snake_case id。
- `player.skills` 會轉成既有 skill id array。
- `room.items` 與 `room.monster` 會從 name/object reference 轉成 id reference。
- consumable 缺少 `effect.hp` 時會補上 healing effect。
- `winCondition.requiredItemId` 會對齊既有 quest item。
- 若勝利條件要求 Boss defeated，quest item 所在房間必須有 monster 守護。

validator 不會因此被放鬆；normalizer 修正後仍必須完整通過 validator。

## Adventure Design Pass

Normalizer 後會執行 deterministic design pass：

```txt
raw Gemini JSON
-> normalizeRuntimeGameData
-> balanceRuntimeAdventure
-> validateRuntimeGameData
-> runtime gameData
```

`balanceRuntimeAdventure` 會補強 RPG 可玩性：

- 每個 room 都會有 `kind`，例如 `start`、`combat`、`puzzle`、`treasure`、`rest`、`key`、`boss`、`lore`。
- 每個 room 至少要有 gameplay function：道具、怪物、challenge、start/rest/lore/boss。
- 至少補齊 1 個 healing consumable。
- 難度較高時補齊額外補給。
- 至少補齊 1 個 equipment item，並放在 Boss 前可取得的位置。
- 至少補齊 1 個 puzzle/riddle/locked_door challenge。
- Boss room 會持有 quest item，且 requiredBossDefeated 固定為 true。
- 普通怪與 Boss 數值會依玩家 stats、skills、equipment 做 deterministic balance。

## Equipment Runtime

`engine/gameEngine.js` 已支援 `equipment`：

```json
{
  "weapon": null,
  "armor": null,
  "accessory": null
}
```

equipment item 必須包含：

```json
{
  "type": "equipment",
  "slot": "weapon",
  "stats": { "attack": 2 }
}
```

支援 stats：

- `attack`
- `defense`
- `maxHp`
- `maxMp`

`use <equipment_id>` 會裝備道具，替換同 slot 舊裝備，並將舊裝備放回背包。公開 state 會回傳 base stats 與 effective stats，UI 預設使用 effective stats。

## Challenge Runtime

room 可包含：

```json
{
  "challenge": {
    "type": "puzzle",
    "description": "...",
    "requiredItemId": "ancient_symbol",
    "solutionHint": "...",
    "rewardItemIds": []
  }
}
```

Runtime 支援：

- `look` 顯示 challenge description 與 hint。
- `use requiredItemId` 會 resolve challenge。
- `locked_door` challenge 未解開前會阻擋移動。
- `gameState.flags.resolvedChallenges` 會記錄已解開的 room challenge。

## UI 流程

1. 進入 `AdventureSetup`。
2. 玩家選擇「使用預設 Demo」或「生成新冒險」。
3. Demo 模式會呼叫 `/api/reset` 並指定 `mode: "default"`。
4. Generated 模式會呼叫 `/api/adventure/generate`。
5. 成功後前端用 response 的 `state` / `gameData` 直接進入主遊戲畫面。

## 目前限制

- Runtime gameData 目前仍是單一 server session scope，不是多玩家 session。
- Gemini 生成品質仍仰賴 prompt 與 validator；失敗時應調整 prompt 或回到 Demo。
- 鎖門規則仍主要服務預設 Demo，generated adventure 先用房間怪物與勝利條件控制流程。

## Samples

- `AI/samples/runtimeAdventure.valid.json`
- `AI/samples/runtimeAdventure.arrayInput.json`
