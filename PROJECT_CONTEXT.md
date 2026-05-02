# AI-DUNGEON-DEMO 專案脈絡（最新）

## 文件目的
本文件提供給接手開發的 AI/工程師快速理解目前 `ai-dungeon-demo` 的程式架構、資料流與已知限制。

- 語言：繁體中文
- 格式：Markdown
- 編碼：UTF-8
- 更新日期：2026-05-02（Asia/Taipei）

## 專案定位
這是一個 `Node.js + Express` 的文字冒險 Demo：
1. 前端送出玩家指令。
2. 後端交給 `engine/gameEngine.js` 套用規則。
3. `AI/narrator.js` 依事件產生敘事。
4. 前端更新故事、角色狀態、房間與 log。

## 專案結構（重點）
```text
ai-dungeon-demo/
├─ AI/
│  └─ narrator.js
├─ data/
│  └─ gameData.js
├─ docs/
│  └─ GAME_DESIGN_AGENT.md
├─ engine/
│  └─ gameEngine.js
├─ outputs/
│  └─ generatedArea.json
├─ public/
│  ├─ app.js
│  ├─ index.html
│  └─ style.css
├─ schemas/
│  └─ generatedArea.schema.json
├─ tools/
│  ├─ sampleGeneratedArea.json
│  └─ validateArea.js
├─ .gitignore
├─ package.json
├─ PROJECT_CONTEXT.md
├─ README.md
└─ server.js
```

## 執行方式
1. `npm install`
2. `node server.js`
3. 開啟 `http://localhost:3000`

目前 `package.json` 只有 `test` script，尚未有 `start/dev` script。

## 後端與 API
檔案：`server.js`

- `GET /api/health`：健康檢查與 provider 資訊
- `GET /api/game-data`：完整遊戲資料
- `GET /api/state`：公開遊戲狀態
- `POST /api/command`：處理玩家指令並回傳 `{ eventResult, narration, state }`
- `POST /api/reset`：重置遊戲

狀態目前採單一記憶體 `gameState`（尚無 per-user 隔離）。

## 遊戲規則引擎
檔案：`engine/gameEngine.js`

- 核心函式：`createInitialGameState`, `getPublicGameState`, `handleCommand`
- 支援指令：`help`, `look`, `status`, `move`, `take`, `attack`, `skill`, `use`, `log`, `reset`
- 核心機制：移動、戰鬥、技能、道具使用、勝負條件、行動 log

## 資料模型
檔案：`data/gameData.js`

- `rooms`: 5（`entrance`, `hall`, `corridor`, `altar`, `boss_room`）
- `items`: 4（`torch`, `rusty_key`, `ancient_core`, `small_potion`）
- `monsters`: 2（`skeleton_guard`, `ruin_guardian`）
- `skills`: 3（`slash`, `fireball`, `guard`）

## AI Narrator
檔案：`AI/narrator.js`

依 `AI_PROVIDER` 分流：
- `mock`
- `ollama`（呼叫 `{OLLAMA_URL}/api/chat`）
- `gemini`（目前 fallback）

包含 prompt 建構、輸出清理、fallback 文案。

## 前端
檔案：`public/index.html`, `public/app.js`, `public/style.css`

- 載入：呼叫 `/api/state`
- 指令：呼叫 `/api/command`
- 顯示：HP/MP、房間 ASCII、背包、log、敘事

## Content Designer Agent（MVP Phase 1）
已就位檔案：
- `docs/GAME_DESIGN_AGENT.md`
- `schemas/generatedArea.schema.json`
- `tools/validateArea.js`
- `tools/sampleGeneratedArea.json`
- `outputs/generatedArea.json`

驗證指令：
- `node tools/validateArea.js outputs/generatedArea.json`

## 清理與編碼檢查狀態
- 文字檔編碼已檢查為 UTF-8 或 ASCII（UTF-8 相容）。
- `outputs/generatedArea.json`、`tools/sampleGeneratedArea.json` 已由 CP950/Big5 轉為 UTF-8。
- `public/app.js` 已清理未使用程式碼與修正前端中文亂碼訊息，不變更 API 與 UI 結構。

## 已知風險
1. 專案仍有部分歷史文字內容可能存在語意亂碼（非編碼錯誤）。
2. `gemini` provider 尚未實作實際呼叫。
3. 尚缺自動化測試保護規則變更。
