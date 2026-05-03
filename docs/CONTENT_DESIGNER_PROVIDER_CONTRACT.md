# Content Designer Provider Contract

## 1. 文件目的
本文件定義 `Content Designer Agent` 與 LLM provider 之間的邊界。
provider 只負責產生「內容草案」，不得直接修改 Runtime 規則或正式遊戲資料。

## 2. Provider 角色
可接的 provider 型態：
- mock provider
- raw-mock provider
- Gemini provider
-（未來）GPT provider
-（未來）Ollama provider

目前狀態：
- `mock`：直接回傳 object
- `raw-mock`：回傳 raw JSON string
- `gemini`：呼叫 Gemini API，回傳 raw text

## 3. Provider 可以做的事
- 根據主題與約束產生 `generatedArea` 草案
- 產生 `rooms` 與敘事描述
- 選用允許的 item / monster id
- 未來可擴充 `items` / `monsters` / `skills` / `traps`

## 4. Provider 禁止做的事
- 不得直接修改 `gameEngine.js`
- 不得直接修改 `data/gameData.js`
- 不得直接 commit / push
- 不得輸出 API key / `.env` 真值
- 不得決定玩家 HP/MP/inventory/position/monster HP
- 不得跳過 validator
- 不得輸出 markdown code block
- 不得在 JSON 前後加說明文字

## 5. Input Contract（建議）
- `theme`
- `difficulty`
- `roomCount`
- `allowedItems`
- `allowedMonsters`
- `styleNotes`
- `constraints`

## 6. Output Contract
provider 只可輸出 JSON object（或 raw provider 輸出可 parse 為 JSON object 的純文字）。

必要條件：
- root 必含：`id`, `name`, `theme`, `narrativeHook`, `difficulty`, `rooms`
- room 必含：`id`, `name`, `description`, `exits`, `items`, `monster`
- 不可含 markdown code fences
- 不可含前後解釋

## 7. Validation Flow
1. provider 產生輸出（object 或 raw text）
2. raw text 先做 JSON parse（`parseProviderJsonOutput`）
3. 寫入 `outputs/generatedArea.json`
4. 執行 `tools/validateArea.js`
5. PASS 才能進 Human Review
6. FAIL 則保留錯誤訊息，不合併、不改 `data/gameData.js`

## 8. Error Handling
- parse failed：provider output invalid
- validator failed：generatedArea invalid
- provider timeout / API error：回報錯誤或改用 mock
- unknown item / monster：validator 擋下
- extra fields：validator 擋下

## 9. Prompt Template 重點
- 繁體中文 `name/description`
- `id` 使用 snake_case
- `exits` 只允許 north/south/east/west
- exits 雙向一致
- 房間可從第一間可達
- 僅允許指定 items/monsters
- 只輸出 JSON

## 10. 與現有架構關係
- Content Designer 是 Development-time 工具
- Narrator 是 Runtime 敘事
- Game Engine 是唯一改 state 的地方
- provider output 必須先 parse + validator + Human Review

## 11. 當前 Gemini 限制
- LLM 可能輸出額外欄位（例如 root.`roomCount`）
- LLM 可能不完全遵守 `roomCount`
- API call 成功不代表 validator 成功
- 不得直接合併到 `data/gameData.js`

## 12. 後續步驟
1. 強化 prompt 與約束策略
2. 增加後處理或更嚴格檢查
3. 規劃多 provider 一致性測試
4. 建立 patch 建議，但不直接改 `data/gameData.js`
