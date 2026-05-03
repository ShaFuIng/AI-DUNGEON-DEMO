# AI-DUNGEON-DEMO 專案脈絡（Step 1～35）

## 目前狀態
- 已有固定流程可從 Gemini 生成到 experimental runtime：
  1. `generatedArea`
  2. `patchSuggestion`
  3. `experimentalGameData`
  4. `GAME_DATA_SOURCE=experimental` runtime 測試
- Step 35 pipeline test 文件已建立：`docs/CONTENT_DESIGNER_PIPELINE_TEST.md`
- default `data/gameData.js` 仍未被覆蓋

## 下一步
1. Step 36：處理 experimental win condition
2. Step 37：執行並記錄完整 runtime 測試結果
3. Step 38：整理完整專案報告
4. Step 39：評估 AJV / CI / 自動化回歸測試
