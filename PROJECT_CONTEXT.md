# AI-DUNGEON-DEMO 專案脈絡（Step 1～30）

## 專案定位
`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案）

## Content Designer Agent 現況（最新）
目前 provider 架構：
- `mock`：直接回傳 object
- `raw-mock`：回傳 raw JSON string，再經 parser
- `gemini`：async fetch 呼叫 Gemini API，回傳 raw text，再經 parse/validate

Gemini provider 第一版完整流程已跑通：
Gemini API → raw text → `parseProviderJsonOutput()` → write `outputs/generatedArea.json` → `validateArea.js` → PASS

## Patch suggestion 與 Human Review 現況
- `tools/createAreaPatchSuggestion.js` 已建立
- `outputs/generatedArea.patchSuggestion.json` 是建議檔
- `outputs/generatedArea.humanReview.md` 已建立
- 目前 patch suggestion review decision：`NEEDS REVISION`
- 下一步是設計 runtime 合併策略與 rollback，不是直接改 `data/gameData.js`

## 重要邊界
- Content Designer Agent 仍是 Development-time。
- 即使 Gemini `--write --validate` PASS，仍不能直接合併正式遊戲資料。
- patch suggestion 與 review 都不是自動合併許可，必須人工決策。

## 常用指令
```bash
npm start
npm run validate:area
npm run generate:area
npm test

node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
node tools/createAreaPatchSuggestion.js
```

## 後續建議
1. Step 31：設計 runtime 合併策略與 rollback strategy
2. Step 32：手動建立 `data/gameData.js` 實驗性 patch
3. Step 33：測試 runtime 遊戲流程
4. Step 34：評估 AJV / CI
5. Step 35：整理完整專案報告
