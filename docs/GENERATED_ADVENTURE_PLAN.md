# Generated Adventure Plan

## 目標

讓玩家可以在瀏覽器輸入 Gemini API key、選擇模型、設定角色與冒險 prompt，並在 runtime 生成一份可直接遊玩的 `gameData`。預設 Demo 仍保留，不覆蓋 `data/gameData.js`。

## Runtime APIs

`POST /api/character/preview`

產生角色預覽，不會修改 server runtime session。

Request body:

```json
{
  "apiKey": "...",
  "model": "gemini-2.5-flash-lite",
  "genre": "奇幻遺跡",
  "characterPrompt": "角色設定",
  "difficulty": 4
}
```

Response body:

```json
{
  "character": {
    "id": "character_id",
    "name": "...",
    "summary": "...",
    "background": "...",
    "attributes": { "maxHp": 30, "maxMp": 12, "attack": 6, "defense": 2 },
    "skills": [],
    "equipment": [],
    "traits": [],
    "appearance": "...",
    "imagePrompt": "..."
  }
}
```

`POST /api/adventure/preview`

使用 confirmed character 與 adventure prompt 產生冒險預覽，不會修改 server runtime session。

Response 會包含：

- `state`
- `gameData`
- `generationSummary`
- `preview`

`POST /api/adventure/generate`

最後開始遊戲時呼叫，會把 generated `gameData` 寫入目前 server runtime session。

Request body:

```json
{
  "apiKey": "...",
  "model": "gemini-2.5-flash-lite",
  "genre": "奇幻遺跡",
  "characterPrompt": "角色設定",
  "adventurePrompt": "冒險設定",
  "roomCount": 5,
  "difficulty": 4,
  "confirmedCharacter": "optional character preview object"
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
- 至少補齊 1 個 item-based challenge，型別限 `item_puzzle` / `locked_door` / `mechanism` / `trap` / `sealed_chest`。
- Boss room 會持有 quest item，且 requiredBossDefeated 固定為 true。
- 普通怪與 Boss 數值會依玩家 stats、skills、equipment 做 deterministic balance。
- exits 會補上 mirror，例如 `east` 對 `west`、`north` 對 `south`。
- unreachable rooms 會被接回 `initialRoomId` 可抵達的房間圖，再重新補 mirror。

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
    "type": "item_puzzle",
    "description": "...",
    "requiredItemId": "ancient_symbol",
    "solutionHint": "use ancient_symbol",
    "rewardItemIds": [],
    "unlocksExit": null,
    "unlocksRoom": null
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
2. Step 1：輸入 API key、模型、風格、房間數、難度、角色 prompt、冒險 prompt。
3. Step 2：呼叫 `/api/character/preview`，顯示角色名稱、背景、attributes、skills、equipment、appearance、imagePrompt。
4. Step 3：呼叫 `/api/adventure/preview`，顯示 room list、kind、monster、items、challenge、Boss、win condition、equipment、consumables。
5. `/api/adventure/preview` 成功後，server 會持有同一份 runtime `state` / `gameData`，以便後續 `/api/game/command` 使用。
6. 按「開始冒險」會直接使用 Step 3 preview response 的 `state` / `gameData` 進入遊戲，不再重新呼叫 LLM 或 `/api/adventure/generate`。
7. Demo 模式仍會呼叫 `/api/reset` 並指定 `mode: "default"`。

## Boss Retreat

Boss 判斷不再只依賴 `boss_room` / `ruin_guardian`：

- `room.kind === "boss"`
- `monster.isBoss === true`
- `monster.role === "boss"`
- fallback：預設 Demo 的 `boss_room`

`retreat` 會優先退回 `gameState.player.previousRoomId`，沒有 previous room 時才使用 Boss room 任一可用 exit，最後 fallback 到 `initialRoomId`。Retreat 不會標記 Boss defeated，也不會移除 Boss。

## 目前限制

- Runtime gameData 目前仍是單一 server session scope，不是多玩家 session。
- Gemini 生成品質仍仰賴 prompt 與 validator；失敗時應調整 prompt 或回到 Demo。
- 鎖門規則仍主要服務預設 Demo，generated adventure 先用房間怪物與勝利條件控制流程。

## Samples

- `AI/samples/runtimeAdventure.valid.json`
- `AI/samples/runtimeAdventure.arrayInput.json`
## Item-Based Challenge Update

Runtime generated adventures now use item-based challenges only.

Allowed challenge types:
- `item_puzzle`
- `locked_door`
- `mechanism`
- `trap`
- `sealed_chest`

Forbidden challenge types:
- `riddle`
- `answer_riddle`
- `text_answer`
- `guess`

Every challenge must have `requiredItemId`, and that item must exist in `gameData.items`. The balancer tries to place missing required items before the challenge; the validator rejects outputs where the item has no source or is only available behind its own challenge.

Runtime behavior:
- `look` shows challenge description and `solutionHint`.
- `help` suggests `use requiredItemId` when the player has the required item.
- `use requiredItemId` resolves the challenge and records `gameState.flags.resolvedChallenges`.
- Blocking challenge types prevent movement until resolved.

`buildAdventurePreview(gameData)` returns `itemChains` so Step 3 can show how an item source leads to a challenge and optional reward.

The runtime JSON parser is centralized in `AI/utils/parseGeneratedJson.js`; invalid Gemini escapes are sanitized only after the first `JSON.parse` fails.

## ComfyUI Integration Phase 4

第四階段開始接 ComfyUI integration。目前已完成健康檢查與 Step 2 角色立繪生成。

- `COMFYUI_BASE_URL` 可在 `.env` 設定。
- 未設定時預設 `http://127.0.0.1:8188`。
- 後端新增 `GET /api/comfy/status`。
- API 會檢查 `${COMFYUI_BASE_URL}/system_stats`。
- ComfyUI 已啟動時回 `ok: true`、`message: "ComfyUI connected"`、`baseUrl` 與 `system`。
- ComfyUI 未啟動時仍回 HTTP 200 + `ok: false`、`message: "ComfyUI is not reachable"`。
- 後端新增 `POST /api/image/character`，request body 支援 `positive`、`negative`、`width`、`height`、`seed`、`filenamePrefix`。
- `positive` 必填；`negative`、`width`、`height`、`seed`、`filenamePrefix` 可省略。
- workflow 檔案是 `AI/image/workflows/character_portrait_api.json`。
- workflow node 對應：`26:24` positive、`25:24` negative、`13` width/height、`3` seed、`9` filename prefix。
- 後端會呼叫 ComfyUI `/prompt`、poll `/history/{promptId}` 最多 60 秒，然後從 SaveImage output 取得圖片。
- 圖片會透過 ComfyUI `/view` 下載到 `public/generated/comfy/`，前端使用 `/generated/comfy/<filename>` 顯示。
- Vite dev server proxy 新增 `/generated -> http://localhost:3000`，開發模式可直接載入後端產出的圖片。
- Step 2 的 `characterPreview.generatedPortrait` 會在開始冒險時傳給 App。
- App 會將 generated character metadata 合併到 `gameState.player`：`name`、`title`、`species`、`className`、`portraitUrl`、`portrait`、`appearance`。
- 每次 `/api/game/command` 回傳新 state 後，App 會重新套用 generated character metadata，避免主畫面角色資訊被後端 public state 覆蓋。
- ComfyUI 未啟動或產圖失敗不會影響角色預覽、冒險預覽、開始冒險或文字 RPG command flow。
