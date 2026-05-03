# AI-DUNGEON-DEMO

`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案流程）

## 啟動遊戲
```bash
npm install
npm start
```

## Content Designer 常用指令
```bash
npm run validate:area
npm run generate:area
npm run test:validator
npm test
```

## 手動 provider 測試
```bash
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
```

## Patch suggestion 指令
```bash
node tools/createAreaPatchSuggestion.js
```

說明：
- 讀取 `outputs/generatedArea.json`
- 產生 `outputs/generatedArea.patchSuggestion.json`
- 不會修改 `data/gameData.js`
- 產生後仍需 Human Review

## Human Review 結果
- 檔案：`outputs/generatedArea.humanReview.md`
- 目前 review decision：`NEEDS REVISION`
- 還不能直接合併到 `data/gameData.js`

## Runtime 合併策略
- 文件：`docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`
- 目前推薦先建立 experimental gameData，不直接覆蓋 `data/gameData.js`

## .env.example 用途
請依 `.env.example` 建立本機 `.env`：
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

注意：
- 不要把 `.env` commit 到 repo。
- 不要把 API key 寫進文件或輸出。

## Content Designer Agent 安全邊界
- Development-time only。
- 不直接修改 `gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit / push。
- `generatedArea` 必須先 `parse + validator PASS + Human Review`。
- 即使 `--write --validate` PASS，也必須依 Human Review Checklist 審查後，才可進入 patch suggestion。

## 相關文件
- `PROJECT_CONTEXT.md`
- `docs/GAME_DESIGN_AGENT.md`
- `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
- `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md`
- `docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`
- `docs/CONTENT_DESIGNER_PATCH_SUGGESTION.md`
- `docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`
- `outputs/generatedArea.humanReview.md`
