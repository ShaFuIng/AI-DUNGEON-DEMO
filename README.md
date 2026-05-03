# AI-DUNGEON-DEMO

`AI-DUNGEON-DEMO` 是一個 `Node.js + Express` 的文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案工具）

## 快速開始
```bash
npm install
npm start
```
啟動後開啟：`http://localhost:3000`

## Content Designer 常用指令
### 驗證目前輸出
```bash
npm run validate:area
```

### 以 mock provider 產生並驗證
```bash
npm run generate:area
```

### validator 測試
```bash
npm run test:validator
npm test
```

## 手動使用不同 provider
```bash
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
```

說明：
- `mock`：直接回傳 generatedArea object。
- `raw-mock`：回傳 raw JSON string，測試 parser flow。
- `gemini`：呼叫 Gemini API 取得 raw text，之後交由 CLI parse/validate。

## 環境變數與 .env.example
請依 `.env.example` 建立本機 `.env`（勿提交 `.env`）：

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

注意：
- 不要把 `.env` commit 到 repo。
- 不要在文件或程式輸出中暴露 API key。

## Content Designer Agent 安全邊界
- Development-time only。
- 不直接修改 `engine/gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit / push。
- `generatedArea` 必須先 `validator PASS + Human Review`，才可考慮後續合併。

## 相關文件
- `PROJECT_CONTEXT.md`
- `docs/GAME_DESIGN_AGENT.md`
- `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
- `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md`
