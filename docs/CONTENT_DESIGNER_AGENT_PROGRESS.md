# Content Designer Agent MVP 進度與使用說明（Step 1～34.5）

## Step 34.5
- 新增 `tools/createExperimentalGameData.js`
- 可讀取 `outputs/generatedArea.patchSuggestion.json` 並產生 `data/gameData.experimental.js`
- 會檢查 `missingReferences` 與 `roomIdConflicts`
- 自動補 `ascii` placeholder
- 自動設定 `initialRoomId`（roomsToAdd 第一個 room）

## 目的
讓 Gemini 生成結果可經 patch suggestion 自動轉為 runtime experimental gameData，降低手動整理成本。

## 下一步建議
1. Step 35：建立完整 Gemini → experimental runtime pipeline 指令與測試流程
2. Step 36：處理 experimental win condition
3. Step 37：runtime 遊戲流程測試
4. Step 38：整理完整專案報告
5. Step 39：評估 AJV / CI / 自動化回歸測試
