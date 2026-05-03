# Content Designer Agent MVP 進度與使用說明（Step 1～27）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 27 的開發歷程、操作方式、測試狀態與後續方向。

## 2. 架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案流程。

核心邊界：
- 不直接修改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`。
- 即使通過驗證，仍需 Human Review 才可考慮後續合併。

## 3. 已完成步驟總覽（Step 1～27）

### Step 1
- 完成內容：建立 Content Designer Agent MVP 基本資料夾與檔案。
- 檔案：`docs/`、`schemas/`、`tools/`、`outputs/`、`docs/GAME_DESIGN_AGENT.md`、`schemas/generatedArea.schema.json`、`tools/validateArea.js`、`tools/sampleGeneratedArea.json`、`outputs/generatedArea.json`。
- 目的：建立 generatedArea 可被定義、產生與驗證的最小骨架。

### Step 2.5
- 完成內容：專案清理與 UTF-8 / 繁體中文整理。
- 目的：避免 Big5/CP950/亂碼影響 JSON、Markdown 與程式維護。

### Step 3
- 完成內容：完善 `docs/GAME_DESIGN_AGENT.md`。
- 目的：定義定位、邊界、禁止事項與流程。

### Step 4
- 完成內容：`tools/sampleGeneratedArea.json` 改為冰封遺跡範例。
- 目的：提供固定且可通過 validator 的合法樣本。

### Step 5
- 完成內容：完善 `schemas/generatedArea.schema.json`（Phase 1 + Phase 1.5）。
- 目的：支援 rooms 核心契約並預留擴充。

### Step 6
- 完成內容：強化 `tools/validateArea.js`（hand-written validator）。
- 目的：在未導入 AJV 前先保護資料與地圖邏輯。

### Step 7
- 完成內容：建立 validator 測試案例。
- 檔案：`validArea.json`、`duplicateRoomId.json`、`invalidExitDirection.json`、`unknownExitTarget.json`、`invalidItemId.json`、`unreachableRoom.json`。
- 目的：確保合法資料會 PASS、錯誤資料會 FAIL。

### Step 8
- 完成內容：整理 `validateArea.js` CLI、`--help` 與錯誤訊息。
- 目的：讓 validator 成為可操作開發工具。

### Step 9
- 完成內容：同步 `outputs/generatedArea.json` 為冰封遺跡範例。
- 目的：讓目前輸出與 sample 一致。

### Step 10
- 完成內容：新增 `AI/contentDesigner.js` mock implementation 與 `createMockGeneratedArea()`。
- 目的：先用 mock 產生合法 generatedArea JSON。

### Step 11
- 完成內容：支援 `--write`。
- 新增：`writeGeneratedArea()`、`getDefaultOutputPath()`。
- 操作：`node AI/contentDesigner.js --write`。
- 目的：可寫入 `outputs/generatedArea.json`。

### Step 12
- 完成內容：支援 `--write --validate`。
- 新增：`getProjectRoot()`、`validateGeneratedArea()`。
- 操作：`node AI/contentDesigner.js --write --validate`。
- 目的：建立 generate → write → validate 基本流程。

### Step 13
- 完成內容：新增 `package.json` scripts。
- scripts：`start`、`validate:area`、`generate:area`、`test:validator`、`test`。
- 目的：縮短教學與本機測試指令。

### Step 14
- 完成內容：更新本進度文件至 Step 13。
- 目的：文件與實作對齊。

### Step 15
- 完成內容：新增 `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md`。
- 目的：定義 provider input/output、禁止事項、錯誤處理與 validation flow。

### Step 16
- 完成內容：建立 provider interface 與 mock provider。
- 新增：`AI/contentDesignerProviders/mockProvider.js`。
- 修改：`AI/contentDesigner.js`。
- 目的：把 mock 生成邏輯 provider 化，方便替換。

### Step 17
- 完成內容：加入 `--provider mock` 選擇介面。
- 新增：`getArgValue()`、`resolveProvider()`、`generateAreaWithProvider()`。
- 目的：建立多 provider 架構入口。

### Step 18
- 完成內容：CLI 支援 provider input object。
- 參數：`--theme`、`--difficulty`、`--room-count`。
- 新增：`parseIntegerArg()`、`buildProviderInput()`。
- 目的：讓 provider 接收結構化輸入。

### Step 19
- 完成內容：`mockProvider` 使用 `input.theme / input.difficulty / input.roomCount`。
- 限制：difficulty 1～10；roomCount 2～4。
- 目的：模擬真 provider 的輸入驅動行為。

### Step 20
- 完成內容：新增 raw JSON parser。
- 檔案：`AI/contentDesignerUtils/parseProviderJsonOutput.js`。
- 功能：拒絕空輸出、拒絕 markdown fence、要求單一 object、JSON.parse、plain object 檢查。
- 目的：處理 LLM raw text 風險。

### Step 21
- 完成內容：新增 raw-mock provider flow。
- 檔案：`AI/contentDesignerProviders/rawMockProvider.js`。
- 修改：`AI/contentDesigner.js`，支援 `--provider raw-mock` 與 `generateAreaFromRawProvider()`。
- 目的：模擬 API raw string → parser → object。

### Step 22
- 完成內容：新增 Gemini provider skeleton。
- 檔案：`AI/contentDesignerProviders/geminiProvider.js`。
- 修改：`AI/contentDesigner.js` 支援 `--provider gemini`。
- 目的：先接入 provider 架構，不呼叫 API。

### Step 23
- 完成內容：實作 Gemini API call。
- 修改：`AI/contentDesignerProviders/geminiProvider.js`。
- 新增：`.env.example`。
- 功能：讀 `GEMINI_API_KEY`、建立 prompt、用 Node 內建 fetch 呼叫 API、回傳 raw text。
- 目的：讓 Gemini 可產生 generatedArea 草案。

### Step 23.5
- 完成內容：`AI/contentDesigner.js` 載入 `.env`。
- 功能：`dotenv.config()` 指向專案根目錄 `.env`。
- 目的：讓 CLI 可讀 `GEMINI_API_KEY`。

### Step 24.5
- 完成內容：強化 Gemini prompt，降低 extra fields 與 roomCount 漂移。
- 修改檔案：`AI/contentDesignerProviders/geminiProvider.js`。
- 新增功能：
  - root 只能有 `id/name/theme/narrativeHook/difficulty/rooms`
  - 禁止 `roomCount/metadata/notes/comments/explanation`
  - `rooms.length` 必須剛好等於指定 `roomCount`
  - room 只能有 `id/name/description/exits/items/monster`
  - 強化 exits/items/monster/id 規則
- 目的：提升 Gemini 輸出符合 contract 的機率。

### Step 24.6
- 完成內容：Gemini request 使用 `responseMimeType: "application/json"`。
- 修改檔案：`AI/contentDesignerProviders/geminiProvider.js`。
- 新增功能：
  - `generationConfig.responseMimeType = "application/json"`
  - `temperature` 調整為 `0.2`
- 目的：降低 markdown code fence 輸出機率。

### Step 24.7
- 完成內容：強化 Gemini API error diagnostics。
- 修改檔案：`AI/contentDesignerProviders/geminiProvider.js`。
- 新增功能：
  - 更清楚回報 worker/API 錯誤
  - 保持不輸出 API key
- 目的：定位 `spawnSync EPERM` 問題。

### Step 25
- 完成內容：移除 Gemini provider 的 `spawnSync` worker，改 async provider flow。
- 修改檔案：
  - `AI/contentDesigner.js`
  - `AI/contentDesignerProviders/geminiProvider.js`
- 新增功能：
  - `geminiProvider.js` 使用 async fetch
  - `contentDesigner.js` 支援 async provider
  - `generateAreaWithProvider()` async
  - `generateAreaFromRawProvider()` async
  - CLI 使用 async `main()`
  - `createMockGeneratedArea()` 保持同步
- 目的：避免 Windows/nvm4w 下 `spawnSync node.exe EPERM`，讓 Gemini 可直接 API → parse → write → validate。

### Step 27
- 完成內容：建立 Content Designer Human Review checklist。
- 新增檔案：
  - `docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`
- 修改檔案：
  - `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- 新增功能：
  - 定義 generatedArea 通過 validator 後的人類審查標準
  - 區分 PASS / NEEDS REVISION / REJECT
  - 明確要求合併前仍需 Human Review
- 目的：
  - 避免 AI 生成內容只因 validator PASS 就被誤認為可直接合併
  - 建立進入 patch suggestion 前的人工品質閘門

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
1. Step 28：設計 generatedArea → patch suggestion 格式，但不直接改 `data/gameData.js`。
2. Step 29：評估 AJV 與 hand-written validator 並行。
3. Step 30：建立 GitHub Actions / CI，至少跑 `npm test`。
4. Step 31：規劃 `gameData.js` 合併策略與回滾策略。
