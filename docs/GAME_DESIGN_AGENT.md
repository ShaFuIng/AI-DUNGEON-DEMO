# GAME_DESIGN_AGENT.md

## 1. 文件目的
定義 `Content Designer Agent` 的定位、邊界、資料契約與開發流程。

## 2. 三層架構
- `Game Engine`：`engine/gameEngine.js`（唯一可改 state）
- `Narrator Agent`：`AI/narrator.js`（Runtime 敘事）
- `Content Designer Agent`：Development-time 草案產生與驗證

## 3. Provider 現況
- `mock`：直接產生 object
- `raw-mock`：產生 raw JSON string，測 parser flow
- `gemini`：async fetch 呼叫 Gemini API，回 raw text，再經 parse/validate

## 4. Gemini 目前限制
- LLM 仍可能輸出額外欄位
- LLM 仍可能不完全遵守 roomCount
- API 成功不代表 validator 成功
- 即使 `--write --validate` PASS，仍不得直接改 `data/gameData.js`

## 5. 驗證與合併流程
1. provider 產生輸出（object 或 raw text）
2. raw text 先經 parser
3. 寫入 `outputs/generatedArea.json`
4. 執行 `tools/validateArea.js`
5. PASS 後進 Human Review
6. Human Review 後才可討論後續合併建議

## 6. 安全邊界
- Development-time only
- 不直接修改 `gameEngine.js`
- 不直接修改 `data/gameData.js`
- 不自動 commit / push
- 不輸出 API key 或 `.env` 真值

## 7. 下一步
1. Step 27：Human Review checklist
2. Step 28：generatedArea → patch suggestion 格式
3. Step 29：AJV + hand-written validator 並行評估
4. Step 30：CI（至少跑 `npm test`）
