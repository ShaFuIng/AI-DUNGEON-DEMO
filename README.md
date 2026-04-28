# AI-DUNGEON-DEMO 專案總覽

## 1. 專案簡介
`AI-DUNGEON-DEMO` 是一個以 `Node.js + Express` 建立的互動式文字地城 demo。
- 玩家在 frontend（`public/`）輸入文字指令（例如 `look`、`move north`、`attack`）。
- backend（`server.js`）接收指令後，交給 `engine/gameEngine.js` 更新遊戲 state。
- `engine` 依據 `data/gameData.js` 的房間、怪物、道具、技能規則產生事件結果。
- `AI/narrator.js` 會把事件結果轉為敘事文字（預設可接 `Ollama`，也有 `mock`/fallback 行為）。
- frontend 收到 response 後更新畫面（故事文字、角色狀態、ASCII 房間、log）。

## 2. 專案資料夾結構
```text
AI-DUNGEON-DEMO/
├─ AI/                          # AI 旁白模組
│  └─ narrator.js               # prompt 建構、LLM 呼叫、回傳清理與 fallback
├─ data/                        # 靜態遊戲資料
│  └─ gameData.js               # 房間、道具、怪物、技能定義
├─ engine/                      # 遊戲規則引擎
│  └─ gameEngine.js             # 指令解析、戰鬥、移動、狀態更新
├─ public/                      # frontend 靜態檔案
│  ├─ index.html                # UI 版面
│  ├─ style.css                 # 視覺樣式
│  └─ app.js                    # 前端互動與 API 呼叫
├─ .env                         # 環境變數（敏感資訊來源）
├─ .gitignore                   # Git 忽略規則（含 .env / node_modules）
├─ package.json                 # 專案 metadata / dependencies / scripts
├─ package-lock.json            # npm lockfile（鎖定相依版本）
└─ server.js                    # Express server 與 API endpoint
```

## 3. 啟動方式
依目前 `package.json` 與 `server.js` 推測：
1. 安裝 dependencies：
```bash
npm install
```
2. 啟動 server：
- `package.json` 目前沒有 `start` script。
- 可直接用：
```bash
node server.js
```
3. 預設 port：
- `server.js` 內固定 `const PORT = 3000`。
4. 前端入口：
- 開啟 `http://localhost:3000/`（由 Express static 提供 `public/index.html`）。
5. 需要的環境變數（僅名稱，不含值）：
- `AI_PROVIDER`
- `OLLAMA_URL`
- `OLLAMA_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
6. LLM 依賴：
- 有 `Ollama` 呼叫邏輯（`/api/chat`）。
- `gemini` provider 目前未實作 API 呼叫，實際回退到 fallback 文字。

## 4. 後端 backend 架構
`server.js` 使用套件與模組：
- npm package：`express`、`dotenv`
- Node.js built-in：`path`
- local modules：`data/gameData`、`engine/gameEngine`、`AI narrator`

Middleware：
- `express.json()`：解析 JSON request body。
- `express.static(path.join(__dirname, "public"))`：提供 frontend 靜態檔案。

主要 API endpoints：
1. `GET /api/health`
- 用途：健康檢查
- response（JSON）：
```json
{ "ok": true, "message": "...", "aiProvider": "..." }
```

2. `GET /api/game-data`
- 用途：回傳完整遊戲資料（`gameData`）
- response：`gameData` 物件

3. `GET /api/state`
- 用途：回傳目前遊戲公開 state（`getPublicGameState`）
- response：公開版 state

4. `POST /api/command`
- 用途：處理玩家指令、更新 state、產生 AI 旁白
- request body：
```json
{ "command": "look" }
```
- 處理流程：
  - `handleCommand(gameState, command)`
  - 若事件型別為 `reset`，重建 state
  - `narrate(publicState, eventResult)` 產生旁白
- response：
```json
{
  "eventResult": { "type": "...", "message": "..." },
  "narration": "...",
  "state": { "player": {}, "flags": {}, "currentRoom": {}, "log": [] }
}
```

5. `POST /api/reset`
- 用途：重置遊戲
- response：重置後的公開 state

串接方式：
- `server.js` 保留單一全域 `gameState`。
- `engine` 決定規則與狀態變化。
- `AI narrator` 僅負責敘事生成，不決定規則。

## 5. 前端 frontend 架構
`public/` 主要檔案：
- `index.html`：終端機風格 UI，區塊包含 ASCII 圖、Story 輸出、指令輸入、Status、Log。
- `style.css`：綠色 CRT/terminal 風格，含 desktop + mobile 響應式排版。
- `app.js`：DOM 綁定、fetch API、UI 更新邏輯。

操作流程：
1. 頁面載入時 `loadGameState()` 呼叫 `GET /api/state`。
2. 使用者在輸入框送出指令（form submit）。
3. frontend 以 `POST /api/command` 傳 `{ command }`。
4. 收到 response 後：
- `updateUI(data.state)` 更新 HP/MP/房間/背包/ASCII/log
- 顯示 `data.narration`（若無則用 `eventResult.message`）

## 6. 遊戲資料 data 設計
`data/gameData.js` 主要由四大區塊組成：
- `rooms`
- `items`
- `monsters`
- `skills`

資料形狀（摘要）：
```json
{
  "rooms": {
    "entrance": {
      "id": "entrance",
      "name": "...",
      "description": "...",
      "ascii": "...",
      "exits": { "north": "hall" },
      "items": ["torch"],
      "monster": null
    }
  },
  "items": {
    "small_potion": {
      "id": "small_potion",
      "type": "consumable",
      "effect": { "hp": 10 }
    }
  },
  "monsters": {
    "skeleton_guard": {
      "id": "skeleton_guard",
      "maxHp": 16,
      "attack": 4,
      "description": "..."
    }
  },
  "skills": {
    "fireball": {
      "id": "fireball",
      "mpCost": 4,
      "damage": 14
    }
  }
}
```

內容特徵：
- 房間有出口關係（簡單地圖）。
- 道具含任務道具與 consumable（補血藥水）。
- 怪物有 HP/攻擊力，與房間綁定。
- 技能有 MP 消耗與傷害值，包含 `guard` 防禦技能。

## 7. 遊戲引擎 engine 邏輯
`engine/gameEngine.js` 核心責任：
- 建立初始狀態：`createInitialGameState()`
- 回傳公開狀態：`getPublicGameState()`
- 處理指令：`handleCommand()`

玩家行動與規則：
- 支援指令：`help`, `look`, `status`, `move`, `take`, `attack`, `skill`, `use`, `log`, `reset`
- `move`：檢查方向合法、是否被怪物阻擋、Boss 房是否需鑰匙
- `take`：檢查物品存在與是否可拿（`ancient_core` 需先擊敗 boss）
- `attack`/`skill`：造成怪物傷害，怪物反擊；`guard` 讓下一次受傷減半
- `use`：目前主要支援 consumable 補血

狀態更新重點：
- `player`：HP/MP/背包/房間/是否防禦
- `flags`：`hasAncientCore`、`bossDefeated`、`gameWon`、`gameOver`
- `monsters`：每隻怪的當前 HP、defeated
- `log`：保留最近 30 筆

規則與 AI 邊界：
- 純規則（可重現、可測試）在 `engine`。
- AI 只接收結果做「敘事改寫」，不負責規則判定。

## 8. AI 旁白 narrator 邏輯
`AI/narrator.js` 負責：
- 根據 `eventResult + gameState` 組 prompt
- 依 `AI_PROVIDER` 決定使用 `mock`、`ollama` 或 fallback
- 清理 LLM 輸出（移除 `<think>`、code block、不想要的開頭）

LLM 呼叫方式：
- `ollamaNarrator()` 以 HTTP `POST {OLLAMA_URL}/api/chat`
- body 包含 `model`、`messages`（system + user）、`temperature`、`num_predict` 等
- `stream: false`、`think: false`

prompt 設計：
- `getStylePrompt()`：system 規範（語氣、長度、避免格式等）
- `buildNarrationPrompt()`：注入玩家 HP/MP、當前房間、道具、怪物、事件摘要

失敗處理：
- API 錯誤或回傳空字串時，使用 `fallbackNarration(eventResult)`
- `gemini` provider 目前沒有實際 remote call，直接 fallback

## 9. 主要資料流
1. 玩家在 frontend 輸入/送出指令。
2. frontend `POST /api/command` 傳送 request。
3. backend `server.js` 呼叫 `engine.handleCommand()`。
4. `engine` 讀取 `data/gameData.js` 並更新遊戲 state。
5. backend 取得 `eventResult + publicState`。
6. backend 呼叫 `AI narrator` 生成敘事。
7. backend 回傳 response（`eventResult`, `narration`, `state`）。
8. frontend 更新故事面板、角色狀態、房間 ASCII、log。

## 10. 目前功能狀態
已完成：
- 可啟動 Express server 並提供 frontend 頁面。
- 完整基本指令循環（探索、移動、戰鬥、拿道具、用道具、重置）。
- 房間/怪物/技能/道具資料化。
- 可串接 Ollama 生成旁白，並有 fallback。

半完成或未接齊：
- `gemini` provider 僅有環境變數與分支，無實際 API call。
- `package.json` 無 `start/dev` script，啟動體驗不完整。

可能出錯與風險：
- 路徑大小寫：`server.js` 用 `./ai/narrator`，資料夾為 `AI/`，在 Linux/CI 可能載入失敗。
- 全域單一 `gameState`：多使用者會共用同一局遊戲。
- 多個檔案有字串編碼/亂碼現象，會影響遊戲文字品質與可維護性。
- API 錯誤處理較薄（`/api/command` 未對 narrate timeout/retry/錯誤分類）。

## 11. 給其他 AI 的接手建議
接手順序建議：
1. `server.js`（看 endpoint 與流程編排）
2. `engine/gameEngine.js`（看規則核心）
3. `data/gameData.js`（看內容資料）
4. `AI/narrator.js`（看 prompt 與 AI 串接）
5. `public/app.js`（看前端如何呼叫 API）

修改指引：
- 改遊戲資料：`data/gameData.js`
- 改 AI 旁白風格/prompt：`AI/narrator.js`
- 改 UI：`public/index.html`, `public/style.css`, `public/app.js`
- 改 API 或流程：先調 `server.js`，再同步 `public/app.js` 的 request/response 處理

注意事項：
- `.env` 僅提供變數名稱與設定，不可把值寫進版本控制或文件。
- 不要直接改 `package-lock.json`（除非有重新安裝或升級套件的需求）。
- `engine` 是規則來源，避免把規則分散到 frontend 或 narrator。

## 12. 後續開發方向建議
1. 增加 `npm` scripts（`start`、`dev`）與 `README.md`。
2. 修正路徑大小寫與檔案編碼，確保跨平台可執行。
3. 導入 session/user-based state，避免玩家互相干擾。
4. 完整實作 `gemini` provider（或移除未完成分支）。
5. 改善錯誤處理（LLM timeout、network error、非 2xx response）。
6. 擴充地圖、職業、背包與道具效果、存檔系統。
7. 補自動化測試（至少先覆蓋 `engine` 指令流程）。
8. 新增 `AGENTS.md` 或開發協作文件，降低 AI/人類接手成本。
