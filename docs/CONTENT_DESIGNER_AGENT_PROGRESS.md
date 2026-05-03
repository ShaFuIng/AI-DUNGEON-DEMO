# Content Designer Agent MVP 進度與使用說明（Step 1～29）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 29 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～29）
- Step 1～28：已完成（契約、validator、providers、async Gemini、Human Review checklist、patch suggestion spec）。

### Step 29
- 完成內容：建立 `tools/createAreaPatchSuggestion.js`。
- 新增檔案：
  - `tools/createAreaPatchSuggestion.js`
  - `outputs/generatedArea.patchSuggestion.json`（由工具產生）
- 修改檔案：
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增功能：
  - 讀取 `outputs/generatedArea.json`
  - 轉換 rooms array 為 `roomsToAdd` object map
  - 收集 items / monsters / skills references
  - 檢查 missing references
  - 檢查 room id conflicts
  - 輸出 patch suggestion JSON
- 目的：
  - 在不直接修改 `data/gameData.js` 的前提下，產生可供 Human Review 的合併建議。

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

安全提醒：
- 即使 Gemini `--write --validate` PASS，也不代表可自動合併到 `data/gameData.js`。
- patch suggestion 也不會自動套用，仍需 Human Review。

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
1. Step 30：人工審查 `outputs/generatedArea.patchSuggestion.json`。
2. Step 31：手動合併到 `data/gameData.js` 的實驗分支。
3. Step 32：測試 runtime 遊戲流程。
4. Step 33：設計 rollback strategy。
5. Step 34：評估 CI / AJV。
