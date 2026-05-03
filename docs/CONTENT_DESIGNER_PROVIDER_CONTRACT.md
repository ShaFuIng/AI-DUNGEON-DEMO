# Content Designer Provider Contract

## 1. 文件目的
定義 `Content Designer Agent` 與 provider 的輸入/輸出契約與安全邊界。

## 2. Provider 類型（目前）
- `mock`：直接回傳 object
- `raw-mock`：回傳 raw JSON string
- `gemini`：async fetch 呼叫 Gemini API，回傳 raw text

## 3. Provider 輸出要求
- 最終必須能被 parse 成 JSON object
- 必須符合 generatedArea contract
- 不得輸出 markdown code block
- 不得輸出前後解釋

## 4. Validation Flow
1. provider 產生輸出（object 或 raw text）
2. raw text 先經 `parseProviderJsonOutput()`
3. 寫入 `outputs/generatedArea.json`
4. 執行 `tools/validateArea.js`
5. PASS 才能進 Human Review
6. FAIL 則不合併、不修改 `data/gameData.js`

## 5. Gemini 目前狀態
- 已完成 async provider flow（Step 25）
- 已達成一次完整流程 PASS：
  Gemini API → raw text → parse → write → validate PASS

## 6. 仍需注意
- LLM 可能輸出額外欄位
- LLM 可能不完全遵守 roomCount
- API 成功不等於 validator 成功
- 即使 `--write --validate` PASS，仍需 Human Review
- 不得直接合併到 `data/gameData.js`

## 7. 安全邊界
- 不輸出 API key 或 `.env` 真值
- 不直接改 `gameEngine.js` / `data/gameData.js`
- 不自動 commit / push
