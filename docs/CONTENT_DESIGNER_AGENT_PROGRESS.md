# Content Designer Agent MVP 進度與使用說明（Step 1～23.5）

## 1. 文件目的
本文件記錄 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 從 Step 1 到 Step 23.5 的開發歷程、操作方式、測試結果與後續方向，供人類開發者與 AI 協作接手。

## 2. 目前架構定位
- `Game Engine`（`engine/gameEngine.js`）：唯一可修改遊戲 state 的規則核心。
- `Narrator Agent`（`AI/narrator.js`）：Runtime 敘事生成。
- `Content Designer Agent`（`AI/contentDesigner.js` + providers）：Development-time 內容草案工具。

核心邊界：
- `Content Designer Agent` 不直接改 `gameEngine.js` / `data/gameData.js`。
- provider 輸出必須先經 `parseProviderJsonOutput()` 與 `tools/validateArea.js`，再進 `Human Review`。

## 3. 已完成步驟總覽（Step 1～23.5）
| Step | 完成內容 | 修改/新增檔案 | 新增功能 | 操作/測試 | 目的 |
|---|---|---|---|---|---|
| Step 1 | 建立 MVP 基本骨架 | `docs/` `schemas/` `tools/` `outputs/`、`docs/GAME_DESIGN_AGENT.md`、`schemas/generatedArea.schema.json`、`tools/validateArea.js`、`tools/sampleGeneratedArea.json`、`outputs/generatedArea.json` | 有可定義、產生、驗證的最小流程 | `node tools/validateArea.js outputs/generatedArea.json` | 建立最小可運作的內容設計骨架 |
| Step 2.5 | 專案清理與 UTF-8 / 繁體中文整理 | 多個既有檔案 | 消除編碼/亂碼風險 | 以 CLI/檔案檢視確認文本可讀 | 提升 JSON/Markdown/程式可維護性 |
| Step 3 | 完善規格文件 | `docs/GAME_DESIGN_AGENT.md` | 明確定位、邊界、禁止事項、流程 | 文件 review | 讓團隊對 Agent 職責有一致共識 |
| Step 4 | sample 改為冰封遺跡 | `tools/sampleGeneratedArea.json` | 固定合法範例 | `node tools/validateArea.js tools/sampleGeneratedArea.json` | 提供穩定示範資料 |
| Step 5 | schema 擴充為 Phase 1 + 1.5 | `schemas/generatedArea.schema.json` | 支援 `rooms` 與擴充欄位描述 | schema 檢視 + validator | 契約可擴充但維持核心要求 |
| Step 6 | 強化手寫 validator | `tools/validateArea.js` | 檢查 snake_case、exits、雙向、可達性、allowed IDs 等 | 多案例驗證 | 在導入 AJV 前先保護資料品質 |
| Step 7 | 建立 validator 測試案例 | `tools/validator-test-cases/*.json` | PASS/FAIL 測試資料齊備 | `node tools/validateArea.js <case>` | 驗證 validator 能攔截錯誤資料 |
| Step 8 | 整理 validator CLI | `tools/validateArea.js` | `--help` 與可操作錯誤訊息 | `node tools/validateArea.js --help` | 讓 validator 成為日常開發工具 |
| Step 9 | 同步目前輸出為冰封遺跡 | `outputs/generatedArea.json` | output 與 sample 對齊 | 驗證兩份 JSON 都 PASS | 降低教學與展示混亂 |
| Step 10 | 建立 mock 版 Content Designer CLI | `AI/contentDesigner.js` | `createMockGeneratedArea()` | `node AI/contentDesigner.js` | 先用 mock 產生合法 generatedArea |
| Step 11 | 支援寫入輸出檔 | `AI/contentDesigner.js` | `writeGeneratedArea()`、`getDefaultOutputPath()`、`--write` | `node AI/contentDesigner.js --write` | 建立產生後落地到檔案的流程 |
| Step 12 | 支援寫入後驗證 | `AI/contentDesigner.js` | `getProjectRoot()`、`validateGeneratedArea()`、`--write --validate` | `node AI/contentDesigner.js --write --validate` | 建立 generate → write → validate 基本管線 |
| Step 13 | 新增 npm scripts | `package.json` | `start` `validate:area` `generate:area` `test:validator` `test` | `npm run validate:area` `npm run generate:area` `npm test` | 縮短指令、提高測試穩定性 |
| Step 14 | 更新進度文件到 Step 13 | `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md` | 文件對齊程式現況 | 文件 review + 指令回歸 | 防止文件落後實作 |
| Step 15 | 建立 provider contract 文件 | `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md` | 定義 input/output、禁止事項、error handling、validation flow | 文件 review | 為 Gemini/GPT/Ollama 介接打底 |
| Step 16 | provider 化 mock 生成邏輯 | 新增 `AI/contentDesignerProviders/mockProvider.js`；修改 `AI/contentDesigner.js` | provider interface 初版 | `node AI/contentDesigner.js` | 讓 provider 可替換、主流程可維護 |
| Step 17 | 加入 `--provider`（先支援 mock） | `AI/contentDesigner.js` | `getArgValue()`、`resolveProvider()`、`generateAreaWithProvider()` | `node AI/contentDesigner.js --provider mock` | 建立多 provider 架構入口 |
| Step 18 | 加入 provider input object | `AI/contentDesigner.js` | `--theme` `--difficulty` `--room-count`、`parseIntegerArg()`、`buildProviderInput()` | `node AI/contentDesigner.js --provider mock --theme "沉沒圖書館" --difficulty 4 --room-count 3` | 讓 provider 可接收結構化輸入 |
| Step 19 | mock provider 使用 input | `AI/contentDesignerProviders/mockProvider.js` | `theme/difficulty/roomCount` 生效；difficulty 1~10；roomCount 2~4；動態 exits | 多組 CLI + validator | 模擬真 provider 的可配置行為 |
| Step 20 | 新增 raw JSON parser 工具 | 新增 `AI/contentDesignerUtils/parseProviderJsonOutput.js` | `parseProviderJsonOutput()`、`isPlainObject()`、CLI self-test | parser PASS/FAIL cases | 處理 LLM raw text 風險 |
| Step 21 | 新增 raw-mock flow | 新增 `AI/contentDesignerProviders/rawMockProvider.js`；修改 `AI/contentDesigner.js` | `--provider raw-mock`、`generateAreaFromRawProvider()` | `node AI/contentDesigner.js --provider raw-mock ...` | 模擬「raw text → parse → object」 |
| Step 22 | 新增 Gemini skeleton | 新增 `AI/contentDesignerProviders/geminiProvider.js`；修改 `AI/contentDesigner.js` | `--provider gemini` 可辨識，先環境檢查與明確報錯 | `node AI/contentDesigner.js --provider gemini` | 把 Gemini provider 接入架構 |
| Step 23 | 實作 Gemini API 呼叫 | 修改 `AI/contentDesignerProviders/geminiProvider.js`；新增 `.env.example` | 讀 `GEMINI_API_KEY`、建立 prompt、用內建 `fetch` 呼叫 API、回傳 raw text | `node AI/contentDesigner.js --provider gemini ...` | 讓真實 LLM provider 可產生草案 |
| Step 23.5 | Content Designer CLI 載入 `.env` | 修改 `AI/contentDesigner.js` | `dotenv.config({ path: ../.env })` | `node AI/contentDesigner.js --provider gemini ...` | 讓 CLI 可讀本機 key，且不需提交 `.env` |

## 4. 目前操作方式
### 核心 npm 指令
```bash
npm start
npm run validate:area
npm run generate:area
npm run test:validator
npm test
```

### Content Designer CLI
```bash
node AI/contentDesigner.js --help
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider raw-mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
```

## 5. 目前測試狀態
已確認 PASS：
- `npm test`
- `npm run generate:area`
- `node AI/contentDesigner.js --provider mock --write --validate`
- `node AI/contentDesigner.js --provider raw-mock --write --validate`

Gemini 目前狀態（開發里程碑記錄）：
- `node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4`
- 已確認 Gemini API call 可進入 provider 流程。
- 已確認 raw output 可進入 parse 流程，並以 `parseProviderJsonOutput()` 控制格式風險。
- 尚未確認 Gemini 輸出可穩定 validator PASS。
- 目前 Gemini 可能輸出額外欄位（例如 root.`roomCount`）。
- 目前 Gemini 可能不完全遵守 `roomCount`（例如要求 4 rooms 但實際產生 5 rooms）。

重要結論：
- Gemini API call 成功不等於 generatedArea 可直接合併。
- 必須通過 `parseProviderJsonOutput()` 與 `tools/validateArea.js`，並經 `Human Review`，才可考慮後續合併。

## 6. 目前相關檔案說明
- `AI/contentDesigner.js`：CLI 入口；provider 選擇、input 建立、raw parse flow、write/validate。
- `AI/contentDesignerProviders/mockProvider.js`：直接回傳 object。
- `AI/contentDesignerProviders/rawMockProvider.js`：回傳 raw JSON string，測 parser flow。
- `AI/contentDesignerProviders/geminiProvider.js`：呼叫 Gemini API，回傳 raw text。
- `AI/contentDesignerUtils/parseProviderJsonOutput.js`：raw text 安全 parse。
- `tools/validateArea.js`：契約與邏輯驗證。
- `schemas/generatedArea.schema.json`：資料契約（Phase 1 + 1.5）。
- `.env.example`：環境變數範例（僅 placeholder）。

## 7. 目前仍未做的事情
- 尚未導入 AJV 做完整 schema runtime 驗證。
- 尚未把 generatedArea 自動合併到 `data/gameData.js`。
- 尚未讓 Game Engine 直接讀取 generatedArea。
- 尚未建立 CI（GitHub Actions）自動驗證流程。
- 尚未完成正式 balance check。
- 尚未建立完整 Human Review checklist 自動化。

## 8. 下一步建議
1. 強化 Gemini prompt 與後處理，降低 extra fields / roomCount 漂移。
2. 增加 provider 輸出一致性檢查（例如 roomCount hard check）。
3. 評估導入 AJV，與 hand-written validator 形成雙層保護。
4. 設計 patch 建議格式，但維持「不直接改 `data/gameData.js`」。
5. 建立 CI：至少自動跑 `npm test` 與 `npm run generate:area`。

## 9. 安全邊界提醒
- `Content Designer Agent` 僅限 Development-time。
- 不直接修改 `gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit / push。
- 不在文件中存放 `.env` 真值或 API key。
