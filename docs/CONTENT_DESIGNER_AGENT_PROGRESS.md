# Content Designer Agent MVP 進度與使用說明（Step 1～33）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 33 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～33）
- Step 1～32：已完成（契約、validator、providers、async Gemini、Human Review、patch suggestion、runtime merge strategy、experimental gameData）。

### Step 33
- 完成內容：加入 `GAME_DATA_SOURCE` 切換機制。
- 新增檔案：
  - `data/loadGameData.js`
- 修改檔案：
  - `server.js`
  - `.env.example`
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增功能：
  - `GAME_DATA_SOURCE=default` 載入 `data/gameData.js`
  - `GAME_DATA_SOURCE=experimental` 載入 `data/gameData.experimental.js`
  - `/api/health` 回傳 `gameDataSource`
- 目的：
  - 讓 runtime 可以安全切換 default / experimental 遊戲資料，而不覆蓋原本 `data/gameData.js`。

## 4. 目前測試狀態
已確認 PASS：
- `npm test`
- `npm run generate:area`
- `node AI/contentDesigner.js --provider mock --write --validate`
- `node AI/contentDesigner.js --provider raw-mock --write --validate`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate`
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
1. Step 34：使用 `GAME_DATA_SOURCE=experimental` 啟動 runtime 並測試遊戲流程。
2. Step 35：整理完整專案報告。
3. Step 36：評估 AJV / CI / 自動化回歸測試。
4. Step 37：考慮將 patch suggestion 與 experimental gameData 產生流程自動化。
