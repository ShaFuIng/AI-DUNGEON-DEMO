# AI-DUNGEON-DEMO 專案脈絡（最新）

## 文件目的
本文件提供接手開發者快速掌握 `AI-DUNGEON-DEMO` 的目前架構、資料流、測試方式與 Content Designer Agent 最新進度（Step 1～23.5）。

## 專案定位
`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo：
1. 前端送出玩家指令。
2. `engine/gameEngine.js` 套用規則更新狀態。
3. `AI/narrator.js` 生成敘事。
4. 前端更新故事、狀態與 log。

## 目前主要模組
```text
ai-dungeon-demo/
├─ AI/
│  ├─ narrator.js
│  ├─ contentDesigner.js
│  ├─ contentDesignerProviders/
│  │  ├─ mockProvider.js
│  │  ├─ rawMockProvider.js
│  │  └─ geminiProvider.js
│  └─ contentDesignerUtils/
│     └─ parseProviderJsonOutput.js
├─ data/gameData.js
├─ engine/gameEngine.js
├─ docs/
│  ├─ GAME_DESIGN_AGENT.md
│  ├─ CONTENT_DESIGNER_AGENT_PROGRESS.md
│  └─ CONTENT_DESIGNER_PROVIDER_CONTRACT.md
├─ schemas/generatedArea.schema.json
├─ tools/
│  ├─ validateArea.js
│  ├─ sampleGeneratedArea.json
│  └─ validator-test-cases/*.json
├─ outputs/generatedArea.json
├─ package.json
├─ .env.example
└─ server.js
```

## 執行與測試（最新）
### 啟動
```bash
npm install
npm start
```

### Content Designer 常用指令
```bash
npm run validate:area
npm run generate:area
npm run test:validator
npm test
```

### 手動 provider 測試
```bash
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
```

## package.json scripts（目前有效）
- `start`: 啟動 Express server
- `validate:area`: 驗證 `outputs/generatedArea.json`
- `generate:area`: 產生並驗證 generatedArea
- `test:validator`: 跑三個預期 PASS 的 validator 測試
- `test`: 指向 `test:validator`

## Content Designer Agent 現況
目前已不是僅有 MVP 檔案骨架，而是具備 provider 架構：
- `mock` provider：直接產生 object
- `raw-mock` provider：產生 raw JSON string，走 parser flow
- `gemini` provider：呼叫 Gemini API，回傳 raw text，再交由 CLI parse/write/validate

`AI/contentDesigner.js` 目前支援：
- `--provider mock|raw-mock|gemini`
- `--theme`、`--difficulty`、`--room-count`
- `--write`、`--validate`

## Gemini provider 最新狀態
- 已實作 API call。
- provider 回傳 raw text，不直接 parse / write / validate。
- parse 與 validation 由 `AI/contentDesigner.js` + `tools/validateArea.js` 負責。
- API call 成功不等於可合併資料：仍需 parse PASS、validator PASS、Human Review。
- LLM 輸出可能有額外欄位或不完全遵守 `roomCount`，需持續強化 prompt/檢查。

## 安全與邊界
- Content Designer Agent 僅限 Development-time。
- 不直接修改 `gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit/push。
- `.env` 不進版控；僅使用 `.env.example` 提供變數名稱與 placeholder。

## 主要風險與後續
1. Gemini 輸出穩定性仍需提升（格式與約束遵循）。
2. 尚未導入 AJV runtime schema validation。
3. 尚未建立 CI 自動化驗證。
4. 尚未完成 balance check 與正式 Human Review workflow。
