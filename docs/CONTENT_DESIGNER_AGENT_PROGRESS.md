# Content Designer Agent MVP 進度與使用說明（Step 1～33.6）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 33.6 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～33.6）
- Step 1～33.5：已完成。

### Step 33.6
- 完成內容：讓 `gameEngine.js` 自動決定 initial room。
- 修改檔案：
  - `engine/gameEngine.js`
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增功能：
  - 新增 `getInitialRoomId()`
  - 若 `gameData.initialRoomId` 存在且有效，使用它
  - 否則若有 `entrance`，使用 `entrance`
  - 否則使用 `gameData.rooms` 的第一個 room id
  - `createInitialGameState()` 改用 dynamic initial room
- 目的：
  - 讓 default 與 experimental gameData 都能建立有效初始狀態。

## 4. 下一步建議
1. Step 34：使用 `GAME_DATA_SOURCE=experimental` 啟動 runtime 並測試遊戲流程。
2. Step 34.5：視測試結果處理 experimental win condition。
3. Step 35：整理完整專案報告。
4. Step 36：評估 AJV / CI / 自動化回歸測試。
