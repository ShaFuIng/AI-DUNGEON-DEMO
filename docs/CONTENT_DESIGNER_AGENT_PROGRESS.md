# Content Designer Agent MVP 進度與使用說明（Step 1～33.5）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 33.5 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～33.5）
- Step 1～33：已完成（契約、validator、providers、async Gemini、Human Review、patch suggestion、runtime merge strategy、experimental gameData、GAME_DATA_SOURCE 切換）。

### Step 33.5
- 完成內容：讓 `engine/gameEngine.js` 使用 `loadGameData()`。
- 修改檔案：
  - `engine/gameEngine.js`
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增內容：
  - `server.js` 與 `engine/gameEngine.js` 現在都會透過 `loadGameData()` 取得資料來源
  - `GAME_DATA_SOURCE` 才能真正影響 `/api/state` 與指令流程
  - 目前可能仍有 initial room 寫死為 `entrance` 的問題，需要下一步處理
- 目的：
  - 讓 runtime engine 進入可切換 gameData source 的狀態。

## 4. 目前測試狀態
已確認 PASS：
- `npm test`
- `npm run generate:area`
- `node tools/createAreaPatchSuggestion.js`

## 5. 操作方式（摘要）
```bash
npm start
npm run validate:area
npm run generate:area
npm test

node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate

node tools/createAreaPatchSuggestion.js
```

## 6. 下一步建議
1. Step 33.6：處理 experimental initial room / 起始房間設定。
2. Step 34：使用 `GAME_DATA_SOURCE=experimental` 啟動 runtime 並測試遊戲流程。
3. Step 35：整理完整專案報告。
4. Step 36：評估 AJV / CI / 自動化回歸測試。
