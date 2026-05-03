# Content Designer Agent MVP 進度與使用說明（Step 1～30）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 30 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～30）
- Step 1～29：已完成（契約、validator、providers、async Gemini、Human Review checklist、patch suggestion spec、patch suggestion 工具）。

### Step 30
- 完成內容：建立 patch suggestion Human Review 結果文件。
- 新增檔案：
  - `outputs/generatedArea.humanReview.md`
- 修改檔案：
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增內容：
  - 根據 Human Review Checklist 審查 `outputs/generatedArea.patchSuggestion.json`
  - 記錄 missing references / room id conflicts / runtime readiness
  - 給出 `Decision: NEEDS REVISION`
- 目的：
  - 在不修改 `data/gameData.js` 的前提下，先記錄 patch suggestion 是否適合進入 runtime 合併階段。

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
- Human Review 結果文件已建立：`outputs/generatedArea.humanReview.md`。

安全提醒：
- 即使 Gemini `--write --validate` PASS，也不代表可自動合併到 `data/gameData.js`。
- patch suggestion 與 human review 結果都不會自動套用，仍需人工決策。

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
1. Step 31：設計 runtime 合併策略與 rollback strategy。
2. Step 32：手動建立 `data/gameData.js` 實驗性 patch。
3. Step 33：測試 runtime 遊戲流程。
4. Step 34：評估 AJV / CI。
5. Step 35：整理完整專案報告。
