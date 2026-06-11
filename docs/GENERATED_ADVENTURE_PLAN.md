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
