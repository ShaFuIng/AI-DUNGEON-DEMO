# AI-DUNGEON-DEMO

`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案流程）
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

Vite proxy：`/api -> http://localhost:3000`

如果看到 `http proxy error: /api/state ECONNREFUSED`，代表後端沒有啟動，或 Vite proxy target 的 port 與 `server.js` 實際 port 不一致。

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
- 指令列支援 `help` / `/help` 查看當前狀態可用指令，並支援 Tab 自動補全與 ↑/↓ 歷史指令。
- 房間道具已用 `flags.collectedItems` 記錄拾取狀態；藥水或鑰匙使用後不會在原房間重新出現，`/help` 與補全也不會列出已拾取的 `take` 指令。
- `status` / `help` / `/help` 會以系統資訊顯示，不再像一般探索指令一樣新增 `> command` 區塊。
- 指令輸入列在送出、loading 結束、視窗開關後會自動取回 focus；E / B / S 可切換裝備、背包、技能視窗。
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
```

注意：
- 不要把 `.env` commit 到 repo。
- 不要把 API key 寫進文件或輸出。

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
- `outputs/generatedArea.humanReview.md`
