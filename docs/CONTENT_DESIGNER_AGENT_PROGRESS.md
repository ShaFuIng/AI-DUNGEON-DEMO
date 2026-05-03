# Content Designer Agent MVP 進度與使用說明（Step 1～28）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 28 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～28）
- Step 1～25：已完成（建立契約、validator、mock/raw-mock/gemini provider、async Gemini flow）。
- Step 27：已建立 Human Review checklist（`docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`）。
- Step 28：已建立 generatedArea → patch suggestion 規格（`docs/CONTENT_DESIGNER_PATCH_SUGGESTION.md`）。

### Step 28
- 完成內容：建立 generatedArea → patch suggestion 規格文件。
- 新增檔案：
  - `docs/CONTENT_DESIGNER_PATCH_SUGGESTION.md`
- 修改檔案：
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增功能：
  - 定義 patch suggestion 的定位與中介格式
  - 明確區分 draft 與 runtime 正式資料
  - 明確要求 Human Review 後才可考慮後續實作
- 目的：
  - 建立 generatedArea 與 `data/gameData.js` 間的可審查中介層
  - 避免直接覆蓋正式遊戲資料

## 4. 目前測試狀態
已確認 PASS：
- `npm test`
- `npm run generate:area`
- `node AI/contentDesigner.js --provider mock --write --validate`
- `node AI/contentDesigner.js --provider raw-mock --write --validate`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4`
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate`

重要里程碑：
- Gemini provider 第一版完整流程已跑通：
  Gemini API → raw text → parseProviderJsonOutput() → write outputs/generatedArea.json → validateArea.js → PASS

安全提醒：
- 即使 Gemini `--write --validate` PASS，也不代表可自動合併到 `data/gameData.js`。
- 仍需 Human Review。

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
```

## 6. 下一步建議
1. Step 29：評估 AJV 與 hand-written validator 並行。
2. Step 30：建立 GitHub Actions / CI，至少跑 `npm test`。
3. Step 31：規劃 `gameData.js` 合併策略與回滾策略。
4. Step 32：定義 patch suggestion 到人工實作的標準作業流程。
