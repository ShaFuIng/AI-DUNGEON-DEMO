# AI-DUNGEON-DEMO 專案脈絡（Step 1～25）

## 專案定位
`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案）

## Content Designer Agent 現況（最新）
目前已不是 MVP 骨架，而是完整 provider 架構：
- `mock`：直接回傳 object
- `raw-mock`：回傳 raw JSON string，再經 parser
- `gemini`：使用 async fetch 呼叫 Gemini API，回傳 raw text，再經 parse/validate

關鍵里程碑（Step 25）：
- 移除 Gemini provider 的 `spawnSync` worker
- 改為 async provider flow
- `AI/contentDesigner.js` 支援 async `generateAreaWithProvider()` / `generateAreaFromRawProvider()`
- CLI 改為 async `main()`
- `createMockGeneratedArea()` 維持同步

## 目前已驗證通過
- `npm test` PASS
- `npm run generate:area` PASS
- `node AI/contentDesigner.js --provider mock --write --validate` PASS
- `node AI/contentDesigner.js --provider raw-mock --write --validate` PASS
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4` PASS
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate` PASS

Gemini provider 第一版完整流程已跑通：
Gemini API → raw text → `parseProviderJsonOutput()` → write `outputs/generatedArea.json` → `validateArea.js` → PASS

## 重要邊界
- Content Designer Agent 仍是 Development-time。
- 即使 Gemini `--write --validate` PASS，仍不能直接合併正式遊戲資料。
- 必須經 Human Review，且不得直接修改 `data/gameData.js`。

## 常用指令
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

## 後續建議
1. Step 27：建立 Human Review checklist。
2. Step 28：設計 generatedArea → patch suggestion 格式（不直接改 `data/gameData.js`）。
3. Step 29：評估 AJV 與 hand-written validator 並行。
4. Step 30：建立 CI（至少跑 `npm test`）。
