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

## 目前 Gemini 里程碑
Gemini provider 第一版完整流程已跑通：
Gemini API → raw text → `parseProviderJsonOutput()` → write `outputs/generatedArea.json` → `validateArea.js` → PASS

即使通過 `--write --validate`，仍需 Human Review，不能直接合併正式遊戲資料。
