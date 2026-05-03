# AI-DUNGEON-DEMO 專案脈絡（Step 1～29）

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

## Patch suggestion 現況（Step 29）
- `tools/createAreaPatchSuggestion.js` 已建立
- `outputs/generatedArea.patchSuggestion.json` 是建議檔
- patch suggestion 不會自動套用
- `data/gameData.js` 仍需人工決定是否修改

## Human Review 狀態
- Human Review checklist：`docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`
- `validator PASS` 後仍需人工審查
- patch suggestion 僅是下一階段輸入，不直接合併 runtime 資料

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
1. Step 30：人工審查 `outputs/generatedArea.patchSuggestion.json`
2. Step 31：手動合併到 `data/gameData.js` 的實驗分支
3. Step 32：測試 runtime 遊戲流程
4. Step 33：設計 rollback strategy
5. Step 34：評估 CI / AJV
