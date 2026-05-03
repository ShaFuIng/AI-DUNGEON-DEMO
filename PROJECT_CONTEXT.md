# AI-DUNGEON-DEMO 專案脈絡（Step 1～34.5）

## 目前狀態
- `server.js`、`engine/gameEngine.js` 已透過 `loadGameData()` 載入資料
- `GAME_DATA_SOURCE=default|experimental` 可切換 runtime 資料來源
- `tools/createAreaPatchSuggestion.js` 可產生 `outputs/generatedArea.patchSuggestion.json`
- `tools/createExperimentalGameData.js` 已建立，可將 patch suggestion 自動轉成 `data/gameData.experimental.js`
- experimental gameData 會自動設定 `initialRoomId` 並補齊 ASCII placeholder

## 邊界
- 不會直接覆蓋 `data/gameData.js`
- experimental win condition 仍需後續測試與調整

## 下一步
1. Step 35：建立完整 Gemini → experimental runtime pipeline 指令與測試流程
2. Step 36：處理 experimental win condition
3. Step 37：runtime 遊戲流程測試
4. Step 38：整理完整專案報告
5. Step 39：評估 AJV / CI / 自動化回歸測試
