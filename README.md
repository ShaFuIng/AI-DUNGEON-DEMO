# AI-DUNGEON-DEMO

`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案流程）
- `Generated Adventure Mode`（Runtime 生成短篇冒險）
- `React UI`（Map / Character / StoryCommand / Floating Window 前端介面）

## 啟動遊戲
```bash
npm install
npm start
```

開發時建議使用兩個終端：

Terminal 1：
```bash
npm start
```
後端預設：`http://localhost:3000`

Terminal 2：
```bash
npm run client:dev
```
前端預設：`http://localhost:5173`

Vite proxy：`/api -> http://localhost:3000`，`/generated -> http://localhost:3000`

如果看到 `http proxy error: /api/state ECONNREFUSED`，代表後端沒有啟動，或 Vite proxy target 的 port 與 `server.js` 實際 port 不一致。

## 遊戲模式

### Default Demo Mode

前端 Start Screen 點選「使用預設 Demo」會載入 `data/gameData.js`，並呼叫 `/api/reset` 建立預設遊戲狀態。

### Generated Adventure Mode

前端 Start Screen 是三步式流程：

1. Adventure Inputs
2. Character Preview
3. Adventure / Map Preview

Preview flow：

```http
POST /api/character/preview
POST /api/adventure/preview
```

`/api/adventure/preview` 成功後會回傳並暫存同一份 runtime `state` / `gameData`。最後按「開始冒險」會直接使用 preview result 進入遊戲，不會再次呼叫 LLM，也不會再打：

```http
POST /api/adventure/generate
```

後端會在該次 request 使用 API key 呼叫 Gemini，驗證生成出的 runtime `gameData`，成功後回傳：

```json
{
  "state": "publicGameState",
  "gameData": "publicGameData",
  "generationSummary": "..."
}
```

生成失敗時會保留預設 Demo，不會覆蓋 `data/gameData.js`。

Runtime 流程會先 normalize Gemini 輸出，再交給 validator：

```txt
raw Gemini JSON -> parse -> normalizeRuntimeGameData -> balanceRuntimeAdventure -> validateRuntimeGameData
```

因此即使 Gemini 把 `items` / `monsters` / `skills` 產成 array，也會先轉成 engine 需要的 object map；若仍無法修正，才會回傳 422 與 validation details。

JSON parse 現在統一走 `AI/utils/parseGeneratedJson.js`。它會先抽出 JSON object，直接 `JSON.parse`，若遇到 Gemini 常見的非法跳脫字元（例如 `\_`、`\(`、`\龍`）會只把非法反斜線補成合法字面反斜線後再 parse；仍失敗時，server 會回傳短版 details，terminal 會顯示階段、parse error 與錯誤位置附近 context，不會印 API key。

`balanceRuntimeAdventure` 會補強可玩性：room.kind、item-based challenge、補血道具、Boss 前裝備、Boss 房勝利物品、普通怪 / Boss 數值平衡、mirrored exits，以及 unreachable room 修復。Runtime challenge 不再使用文字謎題；支援 `item_puzzle`、`locked_door`、`mechanism`、`trap`、`sealed_chest`，validator 會拒絕 `riddle` / `text_answer` / `answer_riddle` / `guess` 類型，並檢查 required item 是否存在且可在挑戰前取得。`use <equipment_id>` 已可裝備 weapon / armor / accessory，戰鬥會使用 effective attack / defense / maxHp / maxMp；`use <required_item_id>` 會解開目前房間的道具挑戰。

Boss retreat 已改為 runtime 判斷，不再只綁定 `boss_room` / `ruin_guardian`；generated adventure 會使用 `room.kind = "boss"` 與 `previousRoomId` 退回上一個房間。

## Content Designer 常用指令
```bash
npm run validate:area
npm run generate:area
npm run test:validator
npm test
```

## 手動 provider 測試
```bash
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
```

## Generated JSON parse sample
```bash
npm run test:parse-json
```

這個 script 會讀取 `AI/samples/badEscapedJson.sample.txt`，確認 `parseGeneratedJson` 能修復非法 JSON escape。

## Patch suggestion 指令
```bash
node tools/createAreaPatchSuggestion.js
```

說明：
- 讀取 `outputs/generatedArea.json`
- 產生 `outputs/generatedArea.patchSuggestion.json`
- 不會修改 `data/gameData.js`
- 產生後仍需 Human Review

## 產生 experimental gameData
```bash
node tools/createExperimentalGameData.js
```

說明：
- 讀取 `outputs/generatedArea.patchSuggestion.json`
- 產生或覆寫 `data/gameData.experimental.js`
- 不會修改 `data/gameData.js`

完整流程（PowerShell）：
```powershell
node AI/contentDesigner.js --provider gemini --theme "沉沒圖書館" --difficulty 4 --room-count 4 --write --validate
node tools/createAreaPatchSuggestion.js
node tools/createExperimentalGameData.js
$env:GAME_DATA_SOURCE="experimental"
npm start
```

Pipeline 測試文件：
- `docs/CONTENT_DESIGNER_PIPELINE_TEST.md`
- 目前 experimental win condition 尚未完整處理
- 目前測試重點是啟動、房間、移動、撿道具、戰鬥

## Experimental gameData 草案
- 檔案：`data/gameData.experimental.js`
- 目前可由 `GAME_DATA_SOURCE=experimental` 載入
- 不要直接覆蓋 `data/gameData.js`

## 切換遊戲資料來源
PowerShell：
```powershell
$env:GAME_DATA_SOURCE="default"
npm start
```

說明：
- `default` 使用 `data/gameData.js`
- `experimental` 使用 `data/gameData.experimental.js`
- 預設是 `default`
- `/api/health` 會顯示 `gameDataSource`
- `GAME_DATA_SOURCE` 會同時影響 `server` 與 `engine` 的 gameData 載入
- `engine` 會根據目前 gameData 自動決定起始房間
- `default` 預期起始為 `entrance`
- `experimental` 預期起始為 `frozen_gate`

## Human Review 結果
- 檔案：`outputs/generatedArea.humanReview.md`
- 目前 review decision：`NEEDS REVISION`
- 還不能直接合併到 `data/gameData.js`

## Runtime 合併策略
- 文件：`docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`
- 目前推薦先建立 experimental gameData，不直接覆蓋 `data/gameData.js`

## React UI 版面重構進度
- 文件：`docs/UI_LAYOUT_PROGRESS.md`
- 目前 UI 主版面維持 Map / Character / StoryCommand / Floating Window 架構。
- `BattleView` 已存在，EncounterModal 已存在，遇到未擊敗怪物時可從遭遇提示進入戰鬥畫面。
- 戰鬥 UI 目前可顯示玩家 / 敵人資訊、HP / MP、battle log、行動按鈕與戰鬥狀態。
- 戰鬥狀態已由後端 `gameEngine` 管理：`mode`、`activeMonsterId`、`activeMonster`、`battle.turn`、`battle.log`、`battle.status` 會隨 `/api/game/command` 回傳。
- EncounterModal 確認後會送出 `battle start` 指令進入 battle mode；前端 `BattleView` 依後端 `gameState.mode` 顯示，敗北的 `gameOver` 狀態也會保留戰鬥畫面並停用按鈕。
- 一般遭遇戰不可取消；玩家必須先進入戰鬥，若要脫離則在戰鬥中使用 `escape`。
- Boss 房間會顯示危險提示；按「暫時撤退」會透過 `/api/game/command` 呼叫後端 `retreat` 並退回安全房間，不會在 StoryCommandPanel 顯示成玩家輸入了 `retreat`。手動 `retreat` 仍保留作為備用指令。
- Boss 危險提示只會 suppress 當下那一次撤退；玩家離開 `boss_room` 後會清除 dismissed 狀態，下次重新進入 `boss_room` 會再次跳出危險提示。
- 指令列支援 `help` / `/help` 查看當前狀態的重要操作指令；終端機 help 不再列出 `status`、`help`、`/help`、`reset` 這類 ESC 選單可見的輔助指令。
- StoryCommandPanel 支援 Tab 自動補全與 ↑/↓ 歷史指令；補全候選會根據目前房間與背包動態更新。
- 房間道具已用 `flags.collectedItems` 記錄拾取狀態；藥水或鑰匙使用後不會在原房間重新出現，`/help` 與補全也不會列出已拾取的 `take` 指令。
- `status` / `help` / `/help` 會以系統資訊顯示，不再像一般探索指令一樣新增 `> command` 區塊。
- 指令輸入列只會在送出指令後自動取回 focus；開關 Floating Window 時不會搶焦點，E / B / S 可連續按第二次關閉裝備、背包、技能視窗。
- 戰鬥機制仍屬基礎版：已有 attack、skill slash、skill fireball、skill guard、use small_potion、escape；escape 目前是 60% 成功率的簡化機率制。
- Battle Log 已改為固定高度可滾動，不會隨訊息增加撐高 BattleView。
- 背包視窗支援 hover tooltip 顯示道具類型、描述、效果與用途提示；點擊道具會開啟小型「使用」action menu。
- `use item` 後端已支援 consumable 與 key 類道具的環境判斷；鑰匙開門流程已改為「在對應門前使用鑰匙 → 消耗鑰匙 → 記錄 unlocked door → 才能通過」，不再只是背包有鑰匙就能進入鎖門。
- 後端已加入基礎 EXP / Level Up 系統，怪物可設定 `expReward` 與固定 `drops`。
- Content Designer prompt / validator / schema 已要求 item description、usageHint、equipment stats、monster drops、expReward。
- Map layout 已調整為左側 Recent Log 區域 + 右側九宮格區域；Recent Log 加寬到約 18rem，仍維持最近 5 筆、舊到新排列、最新訊息從底部淡入，第 6 筆出現時最舊訊息會淡出上移。
- 近期優先完善完整回合制、敵人 AI、狀態效果、技能冷卻、戰鬥動畫，以及 Floating Window 拖曳與可讀性細節；主版面不做大幅重排。

## .env.example 用途
請依 `.env.example` 建立本機 `.env`：
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
COMFYUI_BASE_URL=http://127.0.0.1:8188
```

注意：
- 不要把 `.env` commit 到 repo。
- 不要把 API key 寫進文件或輸出。
- Runtime Generated Adventure 的 API key 只存在使用者瀏覽器 localStorage 與單次 request body；後端不記錄、不回傳、不寫入檔案。

## ComfyUI Integration Phase 4

第四階段已開始接 ComfyUI integration；目前完成健康檢查與 Step 2 角色立繪生成。

- 預設 ComfyUI URL：`http://127.0.0.1:8188`
- 可用 `.env` 的 `COMFYUI_BASE_URL` 覆蓋，例如 `COMFYUI_BASE_URL=http://127.0.0.1:8188`
- 新增 `GET /api/comfy/status`，後端會檢查 `${COMFYUI_BASE_URL}/system_stats`
- 新增 `POST /api/image/character`，會讀取 `AI/image/workflows/character_portrait_api.json`
- 角色立繪 API 會把 Step 2 的 `portraitPrompt.positive` / `portraitPrompt.negative` 填入 ComfyUI workflow，預設尺寸是 `512x768`
- workflow 會覆蓋 node id：`26:24` positive、`25:24` negative、`13` width/height、`3` seed、`9` filename prefix
- 後端會呼叫 ComfyUI `/prompt`，poll `/history/{promptId}`，再透過 `/view` 取回圖片並存到 `public/generated/comfy/`
- 成功時 API 回傳 `imageUrl`，例如 `/generated/comfy/character_portrait_xxx.png`
- Vite dev server 已 proxy `/generated -> http://localhost:3000`，所以 `http://localhost:5173/generated/comfy/<filename>` 可以讀到後端產出的圖片
- Step 2 生成的角色 metadata 會在開始冒險時套到前端 `gameState.player`，CharacterPanel 會顯示 generated character 的 name/title/species/class 與 portrait
- `/api/game/command` 回傳新 state 後，前端會重新套用 generated character metadata，避免 look / move 後立繪或名字消失
- ComfyUI 未啟動時仍不會影響文字 RPG 生成流程、Default Demo Mode 或 Generated Adventure Mode

## Content Designer Agent 安全邊界
- Development-time only。
- 不直接修改 `gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit / push。
- `generatedArea` 必須先 `parse + validator PASS + Human Review`。
- 即使 `--write --validate` PASS，也必須依 Human Review Checklist 審查後，才可進入 patch suggestion。

## 相關文件
- `PROJECT_CONTEXT.md`
- `docs/GAME_DESIGN_AGENT.md`
- `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
- `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md`
- `docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`
- `docs/CONTENT_DESIGNER_PATCH_SUGGESTION.md`
- `docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`
- `docs/UI_LAYOUT_PROGRESS.md`
- `docs/GENERATED_ADVENTURE_PLAN.md`
- `outputs/generatedArea.humanReview.md`
