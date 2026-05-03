# GAME_DESIGN_AGENT.md

## 1. 文件目的
本文件為 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 開發規格，定義 Agent 定位、邊界、資料契約與開發流程。

## 2. 目前三層架構
- `Game Engine`：`engine/gameEngine.js`，唯一可改 state 的規則核心。
- `Narrator Agent`：`AI/narrator.js`，Runtime 敘事生成。
- `Content Designer Agent`：Development-time 工具，產生內容草案並驗證。

## 3. Content Designer Agent 定位
可做：
- 產生 `generatedArea` 草案
- 驗證與輸出建議
- 提供 Human Review 前置資料

不可做：
- 直接修改 `gameEngine.js`
- 直接修改 `data/gameData.js`
- 改 Runtime state
- 跳過 validator
- 自動 commit / push

## 4. Provider 目前狀態
- `mock`：直接產生 object。
- `raw-mock`：產生 raw JSON string，測 parser flow。
- `gemini`：呼叫 Gemini API 回 raw text，再經 parse + validator。

目前限制：
- LLM 可能輸出額外欄位。
- LLM 可能不完全遵守 `roomCount`。
- API call 成功不代表 validator 成功。
- 結果不得直接合併到 `data/gameData.js`。

## 5. Phase 1 generatedArea 契約（摘要）
root 必要欄位：
- `id`
- `name`
- `theme`
- `narrativeHook`
- `difficulty`
- `rooms`

room 必要欄位：
- `id`
- `name`
- `description`
- `exits`
- `items`
- `monster`

## 6. Validation 與合併流程
1. provider 產生草案（object 或 raw text）。
2. 若為 raw text，先經 parser。
3. 寫入 `outputs/generatedArea.json`。
4. 執行 `tools/validateArea.js`。
5. PASS 後進 Human Review。
6. Human Review 通過才可討論後續合併。

## 7. 安全邊界
- Development-time only。
- 不直接改規則核心與正式資料。
- 不輸出 API key 或 `.env` 真值。

## 8. 後續方向
1. 強化 prompt 與 provider 輸出一致性。
2. 導入 AJV（可與手寫 validator 並行）。
3. 建立 patch 建議流程（不自動套用）。
4. 建立 CI 與 Human Review checklist。
