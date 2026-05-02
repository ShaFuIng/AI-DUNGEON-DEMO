# Content Designer Agent MVP 進度與使用說明

## 1. 文件目的
本文件用於記錄 `AI-DUNGEON-DEMO` 中 `Content Designer Agent` 的 MVP 進度、使用方式、手動測試流程與後續開發方向，讓人類開發者、Codex 或其他 AI 可以快速接手。

## 2. 目前架構定位
目前專案採三層架構：
- `Game Engine`：`engine/gameEngine.js`，負責遊戲規則與 `state` 變更。
- `Narrator Agent`：`AI/narrator.js`，負責將 `eventResult` 改寫為敘事旁白。
- `Content Designer Agent`：`Development-time` 工具，負責產生與驗證內容草案，不在 `Runtime` 直接控制遊戲。

邊界重點：
- `Content Designer Agent` 不應直接修改 HP、MP、背包、位置、怪物血量或勝負條件。

## 3. 已完成步驟總覽
| 步驟 | 主要成果 | 相關檔案 | 狀態 |
|---|---|---|---|
| Step 1 | 建立 Content Designer Agent MVP 基本檔案與資料夾 | `docs/`、`schemas/`、`tools/`、`outputs/` | Completed |
| Step 2.5 | 專案清理與 UTF-8 / 繁體中文整理 | 多個既有檔案（依實作歷程） | Completed |
| Step 3 | 完善 `docs/GAME_DESIGN_AGENT.md` | `docs/GAME_DESIGN_AGENT.md` | Completed |
| Step 4 | 完善 `tools/sampleGeneratedArea.json`，改為冰封遺跡範例 | `tools/sampleGeneratedArea.json` | Completed |
| Step 5 | 完善 `schemas/generatedArea.schema.json`，加入 `Phase 1.5` 格式 | `schemas/generatedArea.schema.json` | Completed |
| Step 6 | 完善 `tools/validateArea.js`，補強 hand-written validator 邏輯 | `tools/validateArea.js` | Completed |
| Step 7 | 建立 validator 手動測試案例 | `tools/validator-test-cases/*.json` | Completed |
| Step 8 | 整理 validator CLI 使用方式、`--help` 與錯誤訊息 | `tools/validateArea.js` | Completed |
| Step 9 | 同步 `outputs/generatedArea.json` 為冰封遺跡範例 | `outputs/generatedArea.json` | Completed |
| Step 10 | 建立 `AI/contentDesigner.js` mock implementation | `AI/contentDesigner.js` | Completed |
| Step 11 | `AI/contentDesigner.js` 支援 `--write` 寫入 `outputs/generatedArea.json` | `AI/contentDesigner.js` | Completed |
| Step 12 | `AI/contentDesigner.js` 支援 `--write --validate` 寫入後自動驗證 | `AI/contentDesigner.js` | Completed |
| Step 13 | 新增 `package.json` npm scripts（generate / validate / test） | `package.json` | Completed |

## 4. 目前相關檔案說明
- `docs/GAME_DESIGN_AGENT.md`：`Content Designer Agent` 規格、邊界、流程與分階段規劃。
- `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`：本文件，記錄 MVP 進度與實務使用方式。
- `AI/contentDesigner.js`：`Content Designer Agent` mock implementation，負責產生 `generatedArea` JSON，支援輸出、寫入與驗證。
- `schemas/generatedArea.schema.json`：`generatedArea` 的 `JSON Schema`（`Phase 1` + `Phase 1.5` 擴充描述）。
- `tools/validateArea.js`：`Validator` CLI，採 hand-written validation，負責結構與邏輯檢查。
- `tools/sampleGeneratedArea.json`：合法範例資料（冰封遺跡主題）。
- `outputs/generatedArea.json`：目前產出的草案資料，用於驗證與人工審查。
- `package.json`：提供 `start`、`validate:area`、`generate:area`、`test:validator`、`test` scripts。
- `tools/validator-test-cases/validArea.json`：預期 PASS 的合法測試案例。
- `tools/validator-test-cases/duplicateRoomId.json`：測試重複 room id，預期 FAIL。
- `tools/validator-test-cases/invalidExitDirection.json`：測試非法 exit direction，預期 FAIL。
- `tools/validator-test-cases/unknownExitTarget.json`：測試 exit 指向不存在房間，預期 FAIL。
- `tools/validator-test-cases/invalidItemId.json`：測試未知 item 引用，預期 FAIL。
- `tools/validator-test-cases/unreachableRoom.json`：測試不可達房間，預期 FAIL。

## 5. generatedArea 目前資料格式
目前同時支援 `Phase 1` 與 `Phase 1.5`：

`Phase 1` 必要 root 欄位：
- `id`
- `name`
- `theme`
- `narrativeHook`
- `difficulty`
- `rooms`

`Phase 1.5` optional root 欄位：
- `items`
- `monsters`
- `skills`
- `traps`

說明：
- `rooms` 目前仍為必要欄位。
- `items` / `monsters` / `skills` / `traps` 為 `Phase 1.5` 的可選擴充欄位。

## 6. Validator / CLI 使用方式
```bash
node tools/validateArea.js
node tools/validateArea.js outputs/generatedArea.json
node tools/validateArea.js tools/sampleGeneratedArea.json
node tools/validateArea.js tools/validator-test-cases/validArea.json
node tools/validateArea.js --help

npm run validate:area
npm run generate:area
npm run test:validator
npm test
```

說明：
- 若未指定路徑，`validateArea` 預設驗證 `outputs/generatedArea.json`。
- `npm run generate:area` 會執行 `node AI/contentDesigner.js --write --validate`。

Exit code：
- `0`：validation passed
- `1`：validation failed or file error

## 7. Validator 目前會檢查什麼
`tools/validateArea.js` 目前支援（hand-written validator）：
- root 必要欄位
- 多餘欄位 `additionalProperties`（root / room / item / monster / skill / trap）
- `id` 是否 `snake_case`
- `difficulty` 是否 1 到 10
- `rooms` 是否非空 `array`
- room id 是否重複
- `exits` 方向是否合法
- `exits` target 是否存在
- `exits` 是否雙向一致
- 所有 rooms 是否可由起點到達（reachability）
- room `items` 是否重複
- allowed item / monster id 檢查
- root.`items` 格式檢查
- root.`monsters` 格式檢查
- root.`skills` 格式檢查
- root.`traps` 格式檢查
- room.`traps` 引用檢查

注意：
- 目前未使用 AJV，尚未做完整 `JSON Schema` 自動驗證流程。

## 8. 手動測試指令
```bash
node AI/contentDesigner.js
node AI/contentDesigner.js --help
node AI/contentDesigner.js --write
node AI/contentDesigner.js --write --validate

node tools/validateArea.js tools/sampleGeneratedArea.json
node tools/validateArea.js outputs/generatedArea.json
node tools/validateArea.js tools/validator-test-cases/validArea.json
node tools/validateArea.js tools/validator-test-cases/duplicateRoomId.json
node tools/validateArea.js tools/validator-test-cases/invalidExitDirection.json
node tools/validateArea.js tools/validator-test-cases/unknownExitTarget.json
node tools/validateArea.js tools/validator-test-cases/invalidItemId.json
node tools/validateArea.js tools/validator-test-cases/unreachableRoom.json
```

| 檔案 | 預期結果 |
|---|---|
| `tools/sampleGeneratedArea.json` | PASS |
| `outputs/generatedArea.json` | PASS |
| `tools/validator-test-cases/validArea.json` | PASS |
| `tools/validator-test-cases/duplicateRoomId.json` | FAIL |
| `tools/validator-test-cases/invalidExitDirection.json` | FAIL |
| `tools/validator-test-cases/unknownExitTarget.json` | FAIL |
| `tools/validator-test-cases/invalidItemId.json` | FAIL |
| `tools/validator-test-cases/unreachableRoom.json` | FAIL |

補充：
- expected FAIL 是正常結果，代表 `Validator` 成功攔截不合法資料。

## 9. Git 檢查方式
```bash
git status
git diff --stat
git diff -- docs/CONTENT_DESIGNER_AGENT_PROGRESS.md
```

## 10. 目前仍未做的事情
- 尚未接 Gemini provider
- 尚未把 `generatedArea` 自動合併到 `data/gameData.js`
- 尚未讓 `Game Engine` 直接讀取 `generatedArea`
- 尚未加入 AJV
- 尚未加入 GitHub Actions / CI
- 尚未做正式 balance check

## 11. 下一步建議
1. Step 15：建立更完整的 Content Designer Agent prompt / provider 邊界。
2. Step 16：設計 provider 介面，但先保留 mock provider。
3. Step 17：考慮接 Gemini / GPT / Ollama，但輸出仍必須先經 JSON parse 與 validator。
4. Step 18：產生 patch 建議，但不直接改 `data/gameData.js`。
5. 未來：AJV、CI、balance check、Human Review workflow。

## 12. 安全邊界提醒
- `Content Designer Agent` 是 `Development-time` 工具。
- 不在 `Runtime` 決定遊戲機制。
- 不直接修改 `gameEngine.js`。
- 不直接修改 `data/gameData.js`。
- 不自動 commit。
- 不自動 push。
- 不把 `.env` 或 API key 寫入文件。
