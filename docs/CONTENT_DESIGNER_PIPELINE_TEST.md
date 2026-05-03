# Content Designer Pipeline Test

## 1. 文件目的
本文件用來記錄完整流程：Gemini provider 生成 generatedArea → validator → patch suggestion → experimental gameData → runtime 測試。

重點：
- 這是 pipeline 測試，不是正式合併。
- 不修改 `data/gameData.js`。
- 不代表 AI 內容已正式進入 default runtime。
- experimental runtime 仍需人工測試。

## 2. Pipeline Overview
Gemini provider
→ `outputs/generatedArea.json`
→ `tools/validateArea.js`
→ `outputs/generatedArea.patchSuggestion.json`
→ `tools/createExperimentalGameData.js`
→ `data/gameData.experimental.js`
→ `GAME_DATA_SOURCE=experimental`
→ `npm start`
→ browser runtime test

## 3. Full Pipeline Commands
```powershell
node AI/contentDesigner.js --provider gemini --theme "沉沒圖書館" --difficulty 4 --room-count 4 --write --validate
node tools/createAreaPatchSuggestion.js
node tools/createExperimentalGameData.js
$env:GAME_DATA_SOURCE="experimental"
npm start
```

補充：
- 測完後可用 `Remove-Item Env:GAME_DATA_SOURCE` 清除環境變數。
- 若不想花 API token，可用 mock provider：
```powershell
node AI/contentDesigner.js --provider mock --theme "沉沒圖書館" --difficulty 4 --room-count 4 --write --validate
```

## 4. Expected Generated Files
流程後應產生或更新：
- `outputs/generatedArea.json`
- `outputs/generatedArea.patchSuggestion.json`
- `data/gameData.experimental.js`

不會修改：
- `data/gameData.js`
- `engine/gameEngine.js`
- `server.js`

## 5. Runtime Health Check
啟動後開啟：
- `http://localhost:3000`

檢查：
- `/api/health` 應回傳 `gameDataSource: "experimental"`
- `/api/state` 應顯示 experimental initial room
- `/api/game-data` 應回傳 experimental rooms

可用瀏覽器或 PowerShell 測：
```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/state
```

## 6. Manual Runtime Command Test
若使用 Gemini 生成不同主題，請依 `/api/state` 或 `look` 的建議指令調整道具與路徑。

| Step | Command | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | look | 顯示目前房間描述、可用 exits、可見道具/怪物 |  |  |
| 2 | status | 顯示 HP/MP/背包/目前房間 |  |  |
| 3 | take torch（或第一房道具） | 成功加入背包 |  |  |
| 4 | move north | 成功移動或顯示阻擋原因 |  |  |
| 5 | look | 顯示新房間內容 |  |  |
| 6 | attack 或 skill fireball（遇怪時） | 戰鬥訊息正常 |  |  |
| 7 | move east / west / north（依 exits） | 移動結果與地圖一致 |  |  |
| 8 | take small_potion（若存在） | 道具可拾取 |  |  |
| 9 | log | 顯示近期行動紀錄 |  |  |
| 10 | reset | 遊戲重置成功 |  |  |

## 7. Current Known Limitation
- experimental win condition 尚未完整處理。
- `checkWinCondition` 仍可能偏向 default 地圖設計。
- AI 生成地圖若沒有回到 default entrance，可能無法觸發勝利。
- Step 36 會處理 experimental win condition。
- 目前測試重點是「能啟動、能看房間、能移動、能撿道具、能戰鬥」。

## 8. Pass Criteria
Step 35 PASS 條件：
- Gemini 或 mock 可產生 generatedArea 並 validate PASS。
- `createAreaPatchSuggestion.js` PASS。
- `createExperimentalGameData.js` PASS。
- `GAME_DATA_SOURCE=experimental` 時 server 可啟動。
- `/api/health` 顯示 experimental。
- `/api/state` 顯示 experimental initial room。
- 至少能完成 look / move / take / attack 或 skill 的核心指令。
- 不要求完整 win condition PASS。

## 9. Fail / Debug Notes
常見問題：
- `GEMINI_API_KEY` 缺失。
- Gemini 輸出不通過 validator。
- patch suggestion 有 missingReferences。
- `createExperimentalGameData.js` 因 roomIdConflicts 拒絕產生。
- `GAME_DATA_SOURCE` 沒清掉導致 default 測試混亂。
- server 啟動後仍看到 default：確認 PowerShell 環境變數與 server 是否重啟。
- 遊戲狀態不對：確認 `engine/gameEngine.js` 是否已使用 `loadGameData()`。

## 10. Safety Notes
- 不 commit `.env`。
- 不暴露 API key。
- 不直接改 `data/gameData.js`。
- experimental runtime 僅供測試。
- 測試後確認 `git diff`，只保留預期產物。

## 11. Test Result Template
## Test Run: YYYY-MM-DD

Theme:
Difficulty:
Room Count:
Provider:

GeneratedArea validation:
Patch suggestion:
Experimental gameData generation:
Server source:
Health check:
State check:

Manual command results:
| Command | Result | Notes |
|---|---|---|
| look |  |  |
| status |  |  |
| move north |  |  |
| attack |  |  |
| reset |  |  |

Overall Result:
Known Issues:
Next Actions:
