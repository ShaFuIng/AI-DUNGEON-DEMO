# Content Designer Agent MVP 進度與使用說明（Step 1～31）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 31 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～31）
- Step 1～30：已完成（契約、validator、providers、async Gemini、Human Review checklist、patch suggestion spec、patch suggestion 工具、human review result）。

### Step 31
- 完成內容：建立 runtime merge strategy 與 rollback strategy 文件。
- 新增檔案：
  - `docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`
- 修改檔案：
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增內容：
  - 比較 Strategy A / B / C
  - 推薦 Strategy C：建立 experimental gameData
  - 定義 runtime 切換策略
  - 定義 rollback strategy
  - 定義 runtime 測試清單
- 目的：
  - 在修改 `data/gameData.js` 前，先規劃安全合併與回滾方式。

## 4. 目前測試狀態
已確認 PASS：
- `npm test`
- `npm run generate:area`
- `node AI/contentDesigner.js --provider mock --write --validate`
- `node AI/contentDesigner.js --provider raw-mock --write --validate`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate`
- `node tools/createAreaPatchSuggestion.js`

重要里程碑：
- Gemini provider 第一版完整流程已跑通：
  Gemini API → raw text → parseProviderJsonOutput() → write outputs/generatedArea.json → validateArea.js → PASS
- Patch suggestion 工具已可輸出 `outputs/generatedArea.patchSuggestion.json`。
- Human Review 結果文件已建立：`outputs/generatedArea.humanReview.md`（Decision: NEEDS REVISION）。

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
1. Step 32：建立 `data/gameData.experimental.js` 草案。
2. Step 33：設計 `GAME_DATA_SOURCE` 切換機制。
3. Step 34：測試 runtime 遊戲流程。
4. Step 35：整理完整專案報告。
5. Step 36：評估 AJV / CI / 自動化回歸測試。
