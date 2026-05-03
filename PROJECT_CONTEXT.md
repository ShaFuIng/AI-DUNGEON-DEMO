# AI-DUNGEON-DEMO 專案脈絡（Step 1～33.6）

## 專案定位
`AI-DUNGEON-DEMO` 是 `Node.js + Express` 文字冒險 Demo，包含：
- `Game Engine`（規則與 state）
- `Narrator Agent`（Runtime 敘事）
- `Content Designer Agent`（Development-time 內容草案）

## Content Designer Agent 現況（最新）
目前 provider 架構：
- `mock`：直接回傳 object
- `raw-mock`：回傳 raw JSON string，再經 parser
- `gemini`：async fetch 呼叫 Gemini API，回傳 raw text，再經 parse/validate

## Runtime 狀態（Step 33.6）
- `data/loadGameData.js` 已建立
- `server.js` 與 `engine/gameEngine.js` 都透過 `loadGameData()` 載入資料
- `GAME_DATA_SOURCE=default` 載入 `data/gameData.js`
- `GAME_DATA_SOURCE=experimental` 載入 `data/gameData.experimental.js`
- `gameEngine.js` 已支援 dynamic initial room
- `GAME_DATA_SOURCE=experimental` 時初始房間應為 `frozen_gate`
- win condition 仍可能需要後續測試與調整（目前仍檢查 `entrance`）

## 後續建議
1. Step 34：使用 `GAME_DATA_SOURCE=experimental` 啟動 runtime 並測試遊戲流程
2. Step 34.5：視測試結果處理 experimental win condition
3. Step 35：整理完整專案報告
4. Step 36：評估 AJV / CI / 自動化回歸測試
