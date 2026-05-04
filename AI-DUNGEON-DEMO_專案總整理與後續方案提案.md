# AI-DUNGEON-DEMO 專案總整理與後續方案提案

> 版本用途：給明天討論用  
> 讀者假設：完全不懂 Node.js、Express、API、前後端、GitHub 協作的人也能先看懂大方向  
> 專案定位：一個 **Web-based AI Text Adventure Game Demo（網頁式 AI 文字冒險遊戲 Demo）**  
> Repo：`ShaFuIng/AI-DUNGEON-DEMO`  
> 目前進度：Content Designer Agent MVP 已完成到 **Step 35**，下一步原本是 Step 36：處理 experimental win condition

---

## 0. 先用一句話說明這個專案

這個專案是一個用 **Node.js + Express + HTML/CSS/JavaScript** 做出來的 AI 文字地城遊戲 Demo。

玩家可以在網頁上輸入指令，例如：

```text
look
move north
take torch
attack
skill fireball
use small_potion
```

後端的 **Game Engine（遊戲引擎邏輯）** 會根據指令更新遊戲狀態，然後 **Narrator Agent（旁白智能體）** 會把結果改寫成比較有故事感的繁體中文敘事。

另外目前專案還新增了 **Content Designer Agent（內容設計智能體）**，可以透過 Gemini 之類的 LLM 生成新地圖，再經過驗證、轉換、人工審查，最後放進 experimental runtime 測試。

---

## 1. 給完全初學者的基礎概念

### 1.1 Node.js 是什麼？

**Node.js** 是讓 JavaScript 可以跑在電腦或伺服器上的環境。

一般人常以為 JavaScript 只能跑在瀏覽器裡，例如網頁按鈕、動畫、互動效果。但有了 Node.js 之後，JavaScript 也可以拿來寫：

- 後端伺服器（backend server）
- API
- 檔案處理工具
- 自動化腳本
- 開發工具

在這個專案裡，Node.js 負責：

- 啟動遊戲伺服器
- 接收玩家指令
- 回傳遊戲狀態
- 執行 Content Designer 工具
- 讀寫 `outputs/generatedArea.json`
- 呼叫 Gemini API 或 Ollama API

---

### 1.2 npm 是什麼？

**npm（Node Package Manager）** 是 Node.js 的套件管理工具。

它有兩個主要用途：

#### 第一，安裝套件

例如本專案使用：

- `express`：建立 Web server
- `dotenv`：讀取 `.env` 環境變數

安裝指令：

```bash
npm install
```

這個指令會根據 `package.json` 裡面列出的 dependencies 安裝需要的套件。

#### 第二，執行 scripts

`package.json` 裡面可以定義常用指令，例如：

```json
"scripts": {
  "start": "node server.js",
  "validate:area": "node tools/validateArea.js outputs/generatedArea.json",
  "generate:area": "node AI/contentDesigner.js --write --validate",
  "test:validator": "node tools/validateArea.js tools/sampleGeneratedArea.json && node tools/validateArea.js outputs/generatedArea.json && node tools/validateArea.js tools/validator-test-cases/validArea.json",
  "test": "npm run test:validator"
}
```

所以使用者可以打：

```bash
npm start
```

它實際上等於：

```bash
node server.js
```

---

### 1.3 Express 是什麼？

**Express** 是 Node.js 裡常用的 Web framework（網頁伺服器框架）。

它可以幫我們建立 API，例如：

```js
app.get("/api/state", (req, res) => {
  res.json(getPublicGameState(gameState));
});
```

意思是：

當瀏覽器或前端呼叫：

```text
GET /api/state
```

後端就回傳目前遊戲狀態。

在本專案裡，Express 負責：

- 提供靜態網頁 `public/index.html`
- 提供 API 給前端呼叫
- 接收玩家輸入的 command
- 回傳 narration 和 state

---

### 1.4 前端與後端是什麼？

這個專案是典型的前後端分工：

#### 前端 frontend

位置：

```text
public/
```

負責：

- 顯示畫面
- 顯示角色狀態
- 顯示 ASCII 或未來的互動式地圖
- 顯示故事文字
- 讓玩家輸入指令
- 用 `fetch()` 呼叫後端 API

目前主要檔案：

```text
public/index.html
public/style.css
public/app.js
```

#### 後端 backend

位置：

```text
server.js
engine/
AI/
data/
tools/
```

負責：

- 啟動伺服器
- 維護遊戲狀態
- 處理玩家指令
- 呼叫 AI 旁白
- 生成或驗證 AI 地圖資料

---

### 1.5 API 是什麼？

**API（Application Programming Interface）** 可以先理解成「前端和後端溝通的接口」。

例如前端想知道現在玩家在哪個房間，就呼叫：

```text
GET /api/state
```

後端回傳 JSON：

```json
{
  "player": {
    "hp": 30,
    "mp": 10,
    "currentRoom": "指揮中心"
  }
}
```

前端再把這些資料顯示在畫面上。

---

### 1.6 JSON 是什麼？

**JSON（JavaScript Object Notation）** 是一種資料格式。

例如一個房間資料可以長這樣：

```json
{
  "id": "command_center",
  "name": "指揮中心",
  "description": "這是太空站的指揮中心。",
  "exits": {
    "east": "engine_room"
  },
  "items": ["rusty_key"],
  "monster": null
}
```

AI 生成地圖時，就是生成類似這種 JSON。

---

## 2. 專案目前整體架構

目前專案可以分成三大層：

```text
AI-DUNGEON-DEMO
│
├─ Game Engine
│  └─ 負責真正遊戲規則、玩家狀態、戰鬥、移動、勝敗條件
│
├─ Narrator Agent
│  └─ 負責把遊戲事件改寫成繁體中文旁白
│
└─ Content Designer Agent
   └─ 負責在開發階段用 AI 生成地圖內容
```

---

## 3. 三層架構詳細說明

---

### 3.1 第一層：Game Engine

主要檔案：

```text
engine/gameEngine.js
```

Game Engine 是「遊戲規則核心」。

它負責：

- 建立初始遊戲狀態
- 判斷玩家目前在哪個房間
- 處理玩家指令
- 移動
- 撿道具
- 使用道具
- 普通攻擊
- 技能攻擊
- 怪物反擊
- 檢查玩家死亡
- 檢查遊戲勝利
- 輸出 public state 給前端

目前支援的指令：

```text
help
look
status
move north / south / east / west
take item
attack
skill slash
skill fireball
skill guard
use small_potion
log
reset
```

目前 Game Engine 會透過：

```js
const { loadGameData } = require("../data/loadGameData");
const gameData = loadGameData();
```

依照環境變數 `GAME_DATA_SOURCE` 載入不同遊戲資料。

---

### 3.2 第二層：Narrator Agent

主要檔案：

```text
AI/narrator.js
```

Narrator Agent 是「旁白系統」。

它不負責修改遊戲狀態，只負責把 Game Engine 的結果改寫成敘事。

例如 Game Engine 原本可能產生：

```text
你拿到了 火把。一支可照明的火把，能在黑暗中提供基本視野。
```

Narrator Agent 可以改寫成：

```text
你彎下腰拾起火把，乾燥的木柄上還殘留著舊日燃燒的焦痕。
在這片幽暗的遺跡裡，這一點光或許能讓你多活一會兒。
```

目前支援 provider：

```text
AI_PROVIDER=mock
AI_PROVIDER=ollama
AI_PROVIDER=gemini
```

目前 `mock` 是最穩定的本地假旁白。

`ollama` 會呼叫本機 Ollama API：

```text
http://localhost:11434/api/chat
```

`gemini` 目前在 narrator 裡還是 fallback，並沒有像 Content Designer 那樣完整串接 Gemini runtime narration。

---

### 3.3 第三層：Content Designer Agent

主要檔案：

```text
AI/contentDesigner.js
AI/contentDesignerProviders/
AI/contentDesignerUtils/
schemas/generatedArea.schema.json
tools/validateArea.js
tools/createAreaPatchSuggestion.js
tools/createExperimentalGameData.js
outputs/
docs/
```

Content Designer Agent 是「開發階段內容生成工具」。

它不是玩家遊戲中每一步都會呼叫的 runtime agent，而是開發者用來生成新地圖的工具。

簡單流程：

```text
輸入主題 theme
        ↓
Gemini / mock 生成 generatedArea JSON
        ↓
validateArea.js 驗證格式
        ↓
createAreaPatchSuggestion.js 產生 patch suggestion
        ↓
人工審查
        ↓
createExperimentalGameData.js 產生 gameData.experimental.js
        ↓
GAME_DATA_SOURCE=experimental 進入遊戲測試
```

---

## 4. 專案資料夾與檔案功能總表

---

## 4.1 根目錄

### `README.md`

專案對外說明文件。

包含：

- 專案簡介
- 啟動方式
- Content Designer 常用指令
- Gemini provider 測試指令
- patch suggestion 指令
- experimental gameData 產生方式
- `GAME_DATA_SOURCE` 切換方式
- `.env.example` 用途
- Content Designer 安全邊界
- 相關文件列表

這是其他人第一次打開 repo 時應該先看的文件。

---

### `PROJECT_CONTEXT.md`

專案目前脈絡摘要。

目前內容重點：

- 已完成 Gemini → generatedArea → patchSuggestion → experimentalGameData → runtime 測試流程
- Step 35 pipeline test 文件已建立
- default `data/gameData.js` 沒有被覆蓋
- 下一步是 Step 36：experimental win condition

這份文件適合拿給 AI 或協作者快速理解目前進度。

---

### `server.js`

後端主程式。

執行：

```bash
npm start
```

實際就是執行：

```bash
node server.js
```

它負責：

- 載入 `.env`
- 啟動 Express server
- 提供 `public/` 前端檔案
- 建立 `gameState`
- 提供 API：
  - `GET /api/health`
  - `GET /api/game-data`
  - `GET /api/state`
  - `POST /api/command`
  - `POST /api/reset`
- 呼叫 `engine/gameEngine.js`
- 呼叫 `AI/narrator.js`

---

### `package.json`

Node.js 專案設定檔。

包含：

- 專案名稱
- npm scripts
- dependencies

目前 dependencies：

```json
"dependencies": {
  "dotenv": "^17.4.2",
  "express": "^5.2.1"
}
```

目前 scripts：

```json
"start": "node server.js",
"validate:area": "node tools/validateArea.js outputs/generatedArea.json",
"generate:area": "node AI/contentDesigner.js --write --validate",
"test:validator": "node tools/validateArea.js tools/sampleGeneratedArea.json && node tools/validateArea.js outputs/generatedArea.json && node tools/validateArea.js tools/validator-test-cases/validArea.json",
"test": "npm run test:validator"
```

---

### `package-lock.json`

npm 自動產生的鎖定檔。

用途：

- 鎖定套件版本
- 確保不同電腦安裝出來的依賴版本一致

通常不手動修改。

---

### `.env.example`

環境變數範本。

目前內容概念：

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
GAME_DATA_SOURCE=default
# GAME_DATA_SOURCE=experimental
```

使用者應該複製成 `.env`：

```bash
cp .env.example .env
```

Windows PowerShell 可以手動建立 `.env`。

注意：

```text
.env 不應該 commit 到 GitHub
.env 內可能有 API key
```

---

## 4.2 `public/`：前端畫面

```text
public/
├─ index.html
├─ style.css
└─ app.js
```

這個資料夾是前端 UI。

Express 會透過：

```js
app.use(express.static(path.join(__dirname, "public")));
```

讓瀏覽器可以看到這些檔案。

---

### `public/index.html`

網頁結構。

目前有四個主要區塊：

```text
1. 遺跡場景 ASCII View
2. 敘事輸出 Story
3. 角色狀態 Status
4. 行動紀錄 Log
```

還有指令輸入框：

```html
<form id="commandForm" class="command-form">
  <input id="commandInput" type="text" placeholder="輸入指令，例如 look" />
  <button type="submit">送出</button>
</form>
```

---

### `public/style.css`

前端樣式。

目前風格是：

```text
黑底
綠字
terminal / hacker / retro 風格
CSS grid 兩欄排版
```

目前主要樣式：

- `.game-layout`
- `.game-header`
- `.game-panel`
- `.ascii-panel`
- `.story-panel`
- `.status-panel`
- `.log-panel`
- `.command-form`

未來如果要做成熟 RPG UI，這個檔案會是大改重點。

---

### `public/app.js`

前端互動邏輯。

目前負責：

- 抓 HTML 元素
- 載入遊戲狀態
- 顯示 HP / MP / 房間 / 背包
- 顯示 ASCII
- 顯示 story
- 顯示 log
- 送出玩家指令
- 呼叫 `/api/state`
- 呼叫 `/api/command`

核心流程：

```js
async function sendCommand(command) {
  const response = await fetch("/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  });

  const data = await response.json();

  updateUI(data.state);
  addStoryLine(data.narration || data.eventResult.message);
}
```

未來如果要做互動地圖、角色卡、技能 hover、背包 hover，會主要改這裡。

---

## 4.3 `engine/`：遊戲規則核心

```text
engine/
└─ gameEngine.js
```

### `engine/gameEngine.js`

負責所有遊戲規則。

重要 function：

#### `getInitialRoomId()`

決定遊戲起始房間。

優先順序：

```text
1. 如果 gameData.initialRoomId 存在，而且 rooms 裡有該房間，就用它
2. 如果有 entrance，就用 entrance
3. 否則使用 rooms 裡的第一個 room id
```

這讓 experimental 地圖可以不用有 `entrance`。

---

#### `createInitialGameState()`

建立初始遊戲狀態。

包含：

```js
player: {
  hp,
  maxHp,
  mp,
  maxMp,
  attack,
  inventory,
  currentRoom,
  visitedRooms,
  isDefending
}

flags: {
  hasAncientCore,
  bossDefeated,
  gameWon,
  gameOver
}

monsters: ...

log: [...]
```

---

#### `getPublicGameState(gameState)`

把完整 state 轉成前端可以看的 public state。

這個很重要，因為前端不應該直接讀取所有後端內部資料，而是透過 public state 顯示畫面。

目前會回傳：

- player
- flags
- currentRoom
- log

---

#### `handleCommand(gameState, rawCommand)`

玩家輸入指令後的總入口。

例如：

```text
look
move north
attack
take torch
```

都會先進入這裡，然後分派到不同 handler。

---

#### `handleLook(gameState)`

查看目前房間。

會顯示：

- 房間描述
- 可見道具
- 怪物資訊
- 建議行動

---

#### `handleMove(gameState, direction)`

移動房間。

會檢查：

- 方向是否存在
- 是否被怪物擋住
- 通往 boss_room 是否需要 rusty_key
- 更新 currentRoom
- 更新 visitedRooms
- 檢查 win condition

---

#### `handleTake(gameState, targetName)`

撿道具。

會檢查：

- 道具是否存在
- 道具是否在目前房間
- 是否已經撿過
- 如果是 ancient_core，必須先擊敗 boss

---

#### `handleAttack(gameState)`

普通攻擊。

---

#### `handleSkill(gameState, skillName)`

技能攻擊或防禦。

目前技能：

```text
slash
fireball
guard
```

---

#### `performPlayerAttack(gameState, attackInfo)`

實際處理玩家對怪物造成傷害、怪物死亡、怪物反擊。

目前如果擊敗 `ruin_guardian`，會設定：

```js
gameState.flags.bossDefeated = true;
```

---

#### `checkWinCondition(gameState)`

目前勝利條件。

目前邏輯仍偏向 default 地圖：

```js
if (
  gameState.flags.hasAncientCore &&
  gameState.flags.bossDefeated &&
  gameState.player.currentRoom === "entrance"
) {
  gameState.flags.gameWon = true;
}
```

這就是 Step 36 要處理的問題。

因為 experimental 地圖可能沒有 `entrance`。

---

## 4.4 `data/`：遊戲資料

```text
data/
├─ gameData.js
├─ gameData.experimental.js
├─ gameData.experimental.js 草案由工具產生
└─ loadGameData.js
```

---

### `data/gameData.js`

default 遊戲資料。

包含：

```text
rooms
items
monsters
skills
```

目前 default 地圖是古代遺跡：

```text
entrance
hall
corridor
altar
boss_room
```

目前道具：

```text
torch
rusty_key
ancient_core
small_potion
```

目前怪物：

```text
skeleton_guard
ruin_guardian
```

目前技能：

```text
slash
fireball
guard
```

這是正式 default runtime 使用的資料，不建議讓 AI 直接覆蓋。

---

### `data/gameData.experimental.js`

experimental 遊戲資料。

用途：

- 測試 AI 生成的新地圖
- 不污染 default `gameData.js`
- 可以透過 `GAME_DATA_SOURCE=experimental` 載入

目前 experimental 地圖是太空站風格，例如：

```text
command_center
engine_room
habitation_module
ai_core_chamber
```

並且有：

```js
initialRoomId: "command_center"
```

---

### `data/loadGameData.js`

資料來源切換器。

根據：

```env
GAME_DATA_SOURCE=default
```

或：

```env
GAME_DATA_SOURCE=experimental
```

決定載入哪個 gameData。

目前支援：

```text
default
experimental
```

如果輸入其他值，會丟出錯誤。

---

## 4.5 `AI/`：AI 相關功能

```text
AI/
├─ narrator.js
├─ contentDesigner.js
├─ contentDesignerProviders/
└─ contentDesignerUtils/
```

---

### `AI/narrator.js`

Runtime 旁白系統。

負責根據：

- public game state
- eventResult

產生自然語言敘事。

目前 provider：

```text
mock
ollama
gemini fallback
```

#### mock narrator

不呼叫外部 API，直接用預設模板回覆。

優點：

- 穩定
- 不花錢
- 不需要 API key
- 適合營隊現場 demo

#### ollama narrator

呼叫本機 Ollama。

預設：

```text
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
```

呼叫 API：

```text
POST http://localhost:11434/api/chat
```

#### gemini narrator

目前 narrator 裡的 gemini 還不是完整 Gemini runtime flow，而是 fallback narration。

---

### `AI/contentDesigner.js`

Content Designer Agent 的 CLI 入口。

它可以從 command line 執行：

```bash
node AI/contentDesigner.js --provider mock --write --validate
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
```

負責：

- 解析指令參數
- 選擇 provider
- 生成 area
- 寫入 `outputs/generatedArea.json`
- 呼叫 validator

支援參數：

```text
--provider <mock | raw-mock | gemini>
--theme <text>
--difficulty <1-10>
--room-count <number>
--write
--validate
--help
```

---

## 4.6 `AI/contentDesignerProviders/`

```text
AI/contentDesignerProviders/
├─ mockProvider.js
├─ rawMockProvider.js
└─ geminiProvider.js
```

這裡放不同內容生成 provider。

---

### `mockProvider.js`

本地假資料 provider。

不呼叫 API。

用途：

- 測試流程
- 不花 token
- 穩定產生符合格式的 generatedArea

---

### `rawMockProvider.js`

模擬 LLM 直接輸出 raw text。

用途：

- 測試 parseProviderJsonOutput
- 模擬 AI 輸出可能帶有文字包裝的情況

---

### `geminiProvider.js`

真的呼叫 Gemini API 的 provider。

需要 `.env` 裡有：

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

它會建立 prompt，要求 Gemini 產生 generatedArea JSON。

目前有設定：

```js
responseMimeType: "application/json"
```

這可以增加 Gemini 回傳合法 JSON 的穩定性。

---

## 4.7 `AI/contentDesignerUtils/`

```text
AI/contentDesignerUtils/
└─ parseProviderJsonOutput.js
```

用來解析 provider 回傳的文字。

因為 LLM 有時候可能回傳：

```text
```json
{ ... }
```
```

或前後加說明文字。

這個工具的目的就是盡量把真正的 JSON object 抽出來解析。

---

## 4.8 `schemas/`：生成資料格式規格

```text
schemas/
└─ generatedArea.schema.json
```

這是 generatedArea 的 schema（資料格式規格）。

用途：

- 定義 AI 生成地圖應該長什麼樣
- 給 validator 參考
- 給未來 AJV JSON Schema validation 使用

目前 `tools/validateArea.js` 有讀取 schema，但主要驗證仍是手寫 validator，不是完整 AJV。

---

## 4.9 `tools/`：開發工具

```text
tools/
├─ validateArea.js
├─ createAreaPatchSuggestion.js
├─ createExperimentalGameData.js
├─ sampleGeneratedArea.json
└─ validator-test-cases/
```

---

### `tools/validateArea.js`

驗證 generatedArea 是否符合規格。

檢查重點：

- root 欄位是否允許
- 必要欄位是否存在
- room id 是否 snake_case
- room 是否可抵達
- exits 是否只使用 north/south/east/west
- exits 是否指向存在房間
- exits 是否雙向一致
- items 是否存在
- monsters 是否存在
- 是否有 duplicate room id
- 是否有 invalid item id
- 是否有 unknown exit target

執行：

```bash
node tools/validateArea.js outputs/generatedArea.json
```

或：

```bash
npm run validate:area
```

---

### `tools/createAreaPatchSuggestion.js`

把：

```text
outputs/generatedArea.json
```

轉成：

```text
outputs/generatedArea.patchSuggestion.json
```

它不會直接修改 `data/gameData.js`。

用途：

- 產生建議合併內容
- 檢查 missing references
- 檢查 room id conflicts
- 標示 requiresHumanReview
- 提醒直接合併可能有風險

執行：

```bash
node tools/createAreaPatchSuggestion.js
```

---

### `tools/createExperimentalGameData.js`

把：

```text
outputs/generatedArea.patchSuggestion.json
```

轉成：

```text
data/gameData.experimental.js
```

用途：

- 建立 experimental runtime 測試用 gameData
- 不覆蓋 default `data/gameData.js`
- 自動補 ASCII placeholder
- 自動設定 `initialRoomId`
- 沿用 base gameData 的 items / monsters / skills

執行：

```bash
node tools/createExperimentalGameData.js
```

---

### `tools/sampleGeneratedArea.json`

範例 generatedArea。

用途：

- 測試 validator
- 給人看合法格式長什麼樣
- 給 AI 或學生當範本

---

### `tools/validator-test-cases/`

validator 測試資料。

常見檔案：

```text
validArea.json
duplicateRoomId.json
invalidExitDirection.json
unknownExitTarget.json
invalidItemId.json
unreachableRoom.json
```

用途：

- 測試 validator 是否能抓到錯誤
- 未來可擴充成自動測試

---

## 4.10 `outputs/`：AI 生成流程輸出

```text
outputs/
├─ generatedArea.json
├─ generatedArea.patchSuggestion.json
└─ generatedArea.humanReview.md
```

---

### `outputs/generatedArea.json`

Content Designer Agent 生成的地圖區域資料。

可能由：

```bash
node AI/contentDesigner.js --provider gemini --write --validate
```

產生。

這是 AI 生成內容的第一站。

---

### `outputs/generatedArea.patchSuggestion.json`

由：

```bash
node tools/createAreaPatchSuggestion.js
```

產生。

這是「建議合併到 gameData 的草稿」，不是直接套用。

---

### `outputs/generatedArea.humanReview.md`

人工審查紀錄。

目前 review decision 是：

```text
NEEDS REVISION
```

代表目前還不能直接合併到 default `data/gameData.js`。

---

## 4.11 `docs/`：文件資料夾

```text
docs/
├─ CONTENT_DESIGNER_AGENT_PROGRESS.md
├─ GAME_DESIGN_AGENT.md
├─ CONTENT_DESIGNER_PROVIDER_CONTRACT.md
├─ CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md
├─ CONTENT_DESIGNER_PATCH_SUGGESTION.md
├─ CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md
└─ CONTENT_DESIGNER_PIPELINE_TEST.md
```

---

### `docs/CONTENT_DESIGNER_AGENT_PROGRESS.md`

記錄目前 Step 1～35 進度。

目前明確寫出下一步：

```text
Step 36：處理 experimental win condition
Step 37：執行並記錄完整 runtime 測試結果
Step 38：整理完整專案報告
Step 39：評估 AJV / CI / 自動化回歸測試
```

---

### `docs/GAME_DESIGN_AGENT.md`

Content Designer / Game Design Agent 的設計規格文件。

用途：

- 說明 AI 生成內容時應遵守的規則
- 讓 AI 不亂改 engine
- 讓生成內容符合遊戲資料結構

---

### `docs/CONTENT_DESIGNER_PROVIDER_CONTRACT.md`

Provider contract（提供者契約）。

用途：

- 定義不同 provider 應該實作什麼 function
- 例如 `generateArea()` 或 `generateRawArea()`
- 讓 mock / raw-mock / gemini 都能接到同一套流程

---

### `docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`

人工審查清單。

用途：

- validator PASS 不代表可以直接合併
- 人還是要檢查敘事、平衡性、地圖合理性、是否有 runtime 風險

---

### `docs/CONTENT_DESIGNER_PATCH_SUGGESTION.md`

patch suggestion 的資料格式說明。

用途：

- 說明 `generatedArea.patchSuggestion.json` 的格式
- 說明為什麼只產生建議、不直接改 `gameData.js`

---

### `docs/CONTENT_DESIGNER_RUNTIME_MERGE_STRATEGY.md`

runtime 合併策略。

目前推薦策略：

```text
Strategy C：experimental gameData
```

也就是不要直接覆蓋 `data/gameData.js`，而是建立：

```text
data/gameData.experimental.js
```

再用：

```env
GAME_DATA_SOURCE=experimental
```

切換測試。

---

### `docs/CONTENT_DESIGNER_PIPELINE_TEST.md`

Step 35 pipeline 測試文件。

記錄完整流程：

```powershell
node AI/contentDesigner.js --provider gemini --theme "沉沒圖書館" --difficulty 4 --room-count 4 --write --validate
node tools/createAreaPatchSuggestion.js
node tools/createExperimentalGameData.js
$env:GAME_DATA_SOURCE="experimental"
npm start
```

並說明：

- `/api/health` 應顯示 `gameDataSource: "experimental"`
- `/api/state` 應顯示 experimental initial room
- 目前測試重點是 look / move / take / attack / skill
- 不要求 win condition PASS
- experimental win condition 尚未完整處理

---

## 5. 目前 npm 指令總整理

---

### 5.1 安裝套件

```bash
npm install
```

用途：

- 安裝 `express`
- 安裝 `dotenv`
- 根據 `package.json` 和 `package-lock.json` 還原專案依賴

---

### 5.2 啟動遊戲

```bash
npm start
```

等於：

```bash
node server.js
```

啟動後開啟：

```text
http://localhost:3000
```

---

### 5.3 驗證 generatedArea

```bash
npm run validate:area
```

等於：

```bash
node tools/validateArea.js outputs/generatedArea.json
```

用途：

- 檢查 `outputs/generatedArea.json` 是否符合 Content Designer contract

---

### 5.4 生成地圖

```bash
npm run generate:area
```

等於：

```bash
node AI/contentDesigner.js --write --validate
```

注意：

目前這個 script 沒指定 provider，所以預設是 `mock`。

---

### 5.5 測試 validator

```bash
npm run test:validator
```

會執行多個 validator 測試。

---

### 5.6 npm test

```bash
npm test
```

等於：

```bash
npm run test:validator
```

---

## 6. 常用 node 指令總整理

---

### 6.1 Content Designer：mock provider

```bash
node AI/contentDesigner.js --provider mock --write --validate
```

用途：

- 用 mock 生成地圖
- 寫入 `outputs/generatedArea.json`
- 驗證格式

---

### 6.2 Content Designer：raw-mock provider

```bash
node AI/contentDesigner.js --provider raw-mock --write --validate
```

用途：

- 模擬 LLM raw text 輸出
- 測試 parseProviderJsonOutput

---

### 6.3 Content Designer：Gemini provider，只輸出不寫檔

```bash
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4
```

用途：

- 呼叫 Gemini 生成地圖
- 只印在 terminal
- 不寫入檔案

---

### 6.4 Content Designer：Gemini provider，寫檔並驗證

```bash
node AI/contentDesigner.js --provider gemini --theme "冰封遺跡" --difficulty 5 --room-count 4 --write --validate
```

用途：

- 呼叫 Gemini
- 產生 `outputs/generatedArea.json`
- 執行 validator

---

### 6.5 產生 patch suggestion

```bash
node tools/createAreaPatchSuggestion.js
```

用途：

- 讀取 `outputs/generatedArea.json`
- 產生 `outputs/generatedArea.patchSuggestion.json`
- 不修改 `data/gameData.js`

---

### 6.6 產生 experimental gameData

```bash
node tools/createExperimentalGameData.js
```

用途：

- 讀取 `outputs/generatedArea.patchSuggestion.json`
- 產生 `data/gameData.experimental.js`
- 不修改 `data/gameData.js`

---

### 6.7 手動驗證指定檔案

```bash
node tools/validateArea.js tools/sampleGeneratedArea.json
```

或：

```bash
node tools/validateArea.js tools/validator-test-cases/validArea.json
```

---

## 7. 環境變數設定

---

## 7.1 `.env`

本機要建立 `.env`，內容類似：

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
GAME_DATA_SOURCE=default
AI_PROVIDER=mock
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
```

注意：

```text
.env 不要 push 到 GitHub
不要把 API key 貼進 README
不要在課程投影片展示真實 API key
```

---

## 7.2 `GAME_DATA_SOURCE`

控制遊戲資料來源。

### default

```powershell
$env:GAME_DATA_SOURCE="default"
npm start
```

使用：

```text
data/gameData.js
```

### experimental

```powershell
$env:GAME_DATA_SOURCE="experimental"
npm start
```

使用：

```text
data/gameData.experimental.js
```

測完可以清掉：

```powershell
Remove-Item Env:GAME_DATA_SOURCE
```

---

## 7.3 `AI_PROVIDER`

控制 Narrator Agent 使用哪個 provider。

### mock

```powershell
$env:AI_PROVIDER="mock"
npm start
```

最穩定，不需要 API。

### ollama

```powershell
$env:AI_PROVIDER="ollama"
$env:OLLAMA_MODEL="qwen3:4b"
npm start
```

需要本機 Ollama 已啟動。

### gemini

目前 narrator 的 gemini 還不是完整 runtime Gemini narration，主要 Gemini 完整串接是在 Content Designer Agent。

---

## 8. API 呼叫方式整理

---

## 8.1 `GET /api/health`

用途：

檢查 server 是否活著，以及目前使用哪個 provider / gameDataSource。

瀏覽器打開：

```text
http://localhost:3000/api/health
```

可能回傳：

```json
{
  "ok": true,
  "message": "AI Dungeon Demo server is running!",
  "aiProvider": "mock",
  "gameDataSource": "experimental"
}
```

PowerShell：

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

---

## 8.2 `GET /api/game-data`

用途：

取得目前載入的完整 gameData。

瀏覽器：

```text
http://localhost:3000/api/game-data
```

PowerShell：

```powershell
Invoke-RestMethod http://localhost:3000/api/game-data
```

---

## 8.3 `GET /api/state`

用途：

取得目前遊戲公開狀態。

瀏覽器：

```text
http://localhost:3000/api/state
```

PowerShell：

```powershell
Invoke-RestMethod http://localhost:3000/api/state
```

前端 `public/app.js` 目前會在進入頁面時自動呼叫它。

---

## 8.4 `POST /api/command`

用途：

送出玩家指令。

前端目前用：

```js
fetch("/api/command", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ command }),
});
```

PowerShell 範例：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/command `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"command":"look"}'
```

送出移動：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/command `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"command":"move north"}'
```

送出攻擊：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/command `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"command":"attack"}'
```

---

## 8.5 `POST /api/reset`

用途：

重置遊戲。

PowerShell：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/reset `
  -Method Post
```

---

## 9. Content Designer 完整 pipeline

---

### 9.1 使用 Gemini 生成地圖

```powershell
node AI/contentDesigner.js --provider gemini --theme "沉沒圖書館" --difficulty 4 --room-count 4 --write --validate
```

產生：

```text
outputs/generatedArea.json
```

---

### 9.2 產生 patch suggestion

```powershell
node tools/createAreaPatchSuggestion.js
```

產生：

```text
outputs/generatedArea.patchSuggestion.json
```

---

### 9.3 產生 experimental gameData

```powershell
node tools/createExperimentalGameData.js
```

產生或覆寫：

```text
data/gameData.experimental.js
```

---

### 9.4 切換 experimental runtime

```powershell
$env:GAME_DATA_SOURCE="experimental"
npm start
```

開啟：

```text
http://localhost:3000
```

檢查：

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/state
```

---

## 10. 目前已知限制與問題

---

## 10.1 experimental win condition 尚未處理

目前 `checkWinCondition` 寫死：

```js
gameState.player.currentRoom === "entrance"
```

所以 experimental 地圖如果沒有 `entrance`，可能無法勝利。

這是 Step 36 原本要處理的問題。

---

## 10.2 技能組目前固定

目前技能放在：

```text
data/gameData.js
```

固定有：

```text
slash
fireball
guard
```

玩家沒有角色職業，也沒有不同技能組。

如果未來要讓學生設計角色，應該新增：

```text
classes / jobs
player profile
skills by class
custom character
```

---

## 10.3 UI 目前還是 terminal 風格

目前 UI 是：

- ASCII View
- Status
- Story
- Log
- 指令輸入框

風格很適合早期 demo，但如果要接近正式作品，應該改成：

- 角色卡
- 角色立繪 / 大頭像
- 技能欄
- 背包 hover UI
- 地圖互動 UI
- 房間節點圖
- 按鈕式操作
- 保留文字敘事

---

## 10.4 AI 生成地圖目前仍偏向 room graph

AI 目前生成的是：

```text
rooms + exits + items + monster
```

它不是 tile map，也不是完整 2D 地圖。

所以未來適合做：

```text
房間節點式互動地圖
```

不適合一開始就做成即時 2D 角色走路地圖。

---

## 11. 明天討論重點：未來兩個方案

你目前想討論的核心是：

> 這個專案未來要繼續維持 HTML/CSS/JS，還是升級成 React / Vue / Svelte 這類前端框架？

我建議可以整理成兩個方案。

---

# 方案 A：維持 HTML + CSS + JavaScript，升級成互動式 Web Game UI

---

## A-1. 方案定位

這個方案是：

```text
不換技術棧
不導入 React
繼續使用目前 public/index.html + style.css + app.js
但把畫面重新設計成更像遊戲 UI
```

也就是：

```text
Terminal UI
    ↓
Interactive Web Game UI
```

---

## A-2. 可以做到什麼？

可以做到：

- 角色狀態欄改成角色卡
- 加入角色頭像 / GIF
- 背包 hover 顯示小視窗
- 技能 hover 顯示技能說明
- 地圖欄位改成上下左右房間節點
- 點擊房間方向自動送出 `move north`
- 點擊技能按鈕自動送出 `skill fireball`
- 點擊道具按鈕自動送出 `take torch`
- 保留文字輸入框
- 保留 Story 敘事區
- 保留 Log 紀錄區

---

## A-3. 優點

### 對營隊最友善

學生不需要學 React。

只要知道：

```text
HTML 負責結構
CSS 負責樣式
JavaScript 負責互動
```

就能理解基本概念。

---

### 改動成本低

目前專案已經是這個架構。

只需要改：

```text
public/index.html
public/style.css
public/app.js
```

後端可以先不大改。

---

### 適合教基礎

可以教：

- DOM
- event listener
- fetch API
- JSON
- API request / response
- 簡單前後端互動

---

### GitHub 協作比較容易

學生可以分組改不同檔案：

```text
A 組：改角色卡 HTML/CSS
B 組：改技能資料 JSON
C 組：改地圖主題 prompt
D 組：改 story 文字風格
```

---

## A-4. 缺點

### UI 越複雜會越難維護

如果未來有很多狀態：

- 背包
- 技能
- 裝備
- 角色職業
- 地圖節點
- 任務
- 狀態效果
- 彈窗
- tooltip

原生 JS 會開始變亂。

---

### component 概念不明顯

像角色卡、背包欄、技能欄這些東西，在 React 裡可以拆成 component。

但原生 JS 需要自己管理 DOM 更新，長期比較麻煩。

---

## A-5. 適合情境

方案 A 適合：

```text
營隊時間短
學生基礎弱
重點是體驗 AI + GitHub + 前後端概念
專案不打算變太大型
希望保持簡單穩定
```

---

## A-6. 方案 A 的建議升級順序

### A Step 1：重做狀態欄

把目前純文字：

```text
HP: 30/30
MP: 10/10
房間: 指揮中心
背包: 無
```

改成：

```text
角色頭像
職業
HP bar
MP bar
背包按鈕
技能按鈕
```

---

### A Step 2：背包 hover UI

滑鼠移到背包時顯示：

```text
火把
生鏽鑰匙
小型藥水
```

---

### A Step 3：技能 hover UI

滑鼠移到技能時顯示：

```text
火球術
消耗 MP: 4
傷害: 14
描述: 消耗 MP 施放火球造成高傷害。
```

---

### A Step 4：ASCII View 改成 Map View

把：

```text
ROOM 1
[指揮中心]
<command_center>
```

改成：

```text
        北
        ↑
西 ← 目前房間 → 東
        ↓
        南
```

---

### A Step 5：加入點擊指令

點擊北方房間：

```js
sendCommand("move north");
```

點擊火球術：

```js
sendCommand("skill fireball");
```

---

# 方案 B：升級成 React / Vue / Svelte，做接近正式產品的前端

---

## B-1. 方案定位

這個方案是：

```text
保留 Node.js + Express 後端
保留 Game Engine
保留 Content Designer Agent
但前端改用 React / Vue / Svelte
```

建議如果要選框架，優先考慮：

```text
React + Vite
```

原因：

- 社群大
- 文件多
- GitHub 上範例多
- 元件化思維清楚
- 之後可以接 Tailwind CSS
- 也比較符合現代 Web App 開發

---

## B-2. 可以做到什麼？

可以更好地做到：

- 成熟 RPG 角色狀態欄
- 角色立繪
- 動態 HP / MP bar
- 背包 popover
- 技能 tooltip
- 裝備欄
- 地圖節點 component
- 房間卡片 component
- 故事訊息 component
- Log component
- 角色創建頁
- 地圖生成頁
- Prompt 編輯頁
- AI 生成結果預覽頁
- 每組學生有自己的角色 / 地圖資料

---

## B-3. React 版可能的資料夾

如果未來升級 React，可能變成：

```text
AI-DUNGEON-DEMO
├─ server.js
├─ engine/
├─ data/
├─ AI/
├─ tools/
├─ docs/
├─ outputs/
└─ client/
   ├─ package.json
   ├─ index.html
   ├─ src/
   │  ├─ App.jsx
   │  ├─ main.jsx
   │  ├─ components/
   │  │  ├─ CharacterPanel.jsx
   │  │  ├─ InventoryPopover.jsx
   │  │  ├─ SkillTooltip.jsx
   │  │  ├─ MapView.jsx
   │  │  ├─ RoomCard.jsx
   │  │  ├─ StoryPanel.jsx
   │  │  ├─ LogPanel.jsx
   │  │  └─ CommandBar.jsx
   │  ├─ api/
   │  │  └─ gameApi.js
   │  └─ styles/
   │     └─ main.css
```

---

## B-4. 優點

### 更像正式產品

React 很適合做你想要的這種成熟 UI：

- RPG 狀態欄
- 大頭像
- 裝備欄
- 技能欄
- hover UI
- 彈窗
- 地圖節點
- 即時狀態更新

---

### 元件化比較清楚

例如：

```text
CharacterPanel
InventoryPanel
SkillList
MapView
StoryLog
```

每一個都可以獨立修改。

這對 GitHub 協作也有好處。

---

### 適合分組開發

可以讓不同組負責不同 component：

```text
A 組：CharacterPanel
B 組：MapView
C 組：SkillList
D 組：StoryPanel
```

這很符合 GitHub branch / pull request 練習。

---

### 長期可維護性比較好

如果你真的想把它做成正式品，React 比較能承受功能變多。

---

## B-5. 缺點

### 對初學者門檻高

React 會多出新概念：

```text
component
props
state
useEffect
useState
Vite
build
dev server
```

如果營隊學生本來就不懂前後端，一次丟 React 可能會太難。

---

### 專案結構會變複雜

原本：

```text
npm start
```

就能跑。

React 後可能變成：

```text
後端：
npm start

前端：
cd client
npm install
npm run dev
```

或要做 proxy / build / static serve。

---

### 教學時間會被框架吃掉

如果課程目標是 AI + GitHub + Prompt + 遊戲設計，React 可能會搶走太多時間。

---

## B-6. 適合情境

方案 B 適合：

```text
目標是做接近正式品
學生不是從零做完整專案
主辦方希望成果看起來成熟
GitHub 協作是重點
學生只修改部分 component / JSON / prompt
講師自己能先把框架搭好
```

---

## B-7. 方案 B 的建議教學方式

不要教學生「從零學 React」。

比較好的方式是：

```text
講師先做好 React 版成熟 Demo
學生只負責改指定區塊
```

例如學生可以做：

- 改角色名字
- 改職業設定
- 改技能描述
- 改技能數值
- 改角色頭像
- 改地圖 prompt
- 生成新地圖
- 用 GitHub commit / branch / PR 提交自己的版本

這樣他們會體驗到現代開發流程，但不會被 React 細節壓垮。

---

## 12. 我對兩個方案的建議結論

---

## 12.1 如果目標是「營隊穩定教學」

選：

```text
方案 A：HTML + CSS + JavaScript
```

原因：

- 最簡單
- 最穩
- 最好解釋
- 學生比較能理解
- 不會被框架卡住

---

## 12.2 如果目標是「做出接近正式品，讓學生改一部分」

選：

```text
方案 B：React + Node.js + Express
```

原因：

- UI 更成熟
- 更像正式作品
- 更適合角色卡、背包、技能、地圖元件
- 更適合 GitHub 分工
- 長期可維護性較好

---

## 12.3 我個人的建議

以你目前的描述，我會建議：

```text
專案本體走方案 B
營隊教學方式採方案 A 的簡化精神
```

意思是：

- 你自己或講師團先把正式 Demo 做成 React 版
- 學生不需要從零學 React
- 學生只在指定範圍內修改
- 教學重點放在：
  - AI 生成地圖
  - AI 生成角色
  - JSON 資料結構
  - GitHub 協作
  - 前後端 API 概念
  - 如何用 prompt 影響作品

這樣最符合你的目標。

---

## 13. 未來正式版可能的功能設計

---

## 13.1 角色創建系統

讓學生可以設定：

```text
角色名稱
職業
種族
個性
技能組
角色頭像
背景故事
```

角色資料可以長這樣：

```json
{
  "name": "艾爾芙",
  "classId": "ranger",
  "race": "elf",
  "level": 1,
  "hp": 50,
  "mp": 20,
  "attack": 3,
  "speed": 3,
  "skills": ["quick_shot", "detect_trap"],
  "inventory": ["dagger", "agility_ring"],
  "avatarUrl": "/assets/avatars/elf_ranger.gif"
}
```

---

## 13.2 職業系統

新增：

```text
warrior
mage
ranger
rogue
cleric
```

每個職業有不同：

- HP
- MP
- attack
- speed
- skills
- passive effect

---

## 13.3 技能系統

技能不再只固定三個。

技能資料可以長這樣：

```json
{
  "id": "detect_trap",
  "name": "偵測陷阱",
  "mpCost": 2,
  "damage": 0,
  "description": "偵查目前房間與相鄰房間是否存在陷阱。",
  "effect": {
    "revealTraps": true
  }
}
```

---

## 13.4 背包與裝備系統

目前 inventory 只是字串陣列。

未來可以拆成：

```json
{
  "inventory": ["torch", "small_potion"],
  "equipment": {
    "weapon": "guard_dagger",
    "ring": "agility_ring"
  }
}
```

---

## 13.5 地圖互動系統

把 ASCII View 改成 Map View。

資料可以由後端提供：

```json
{
  "mapView": {
    "currentRoomId": "command_center",
    "adjacentRooms": {
      "north": null,
      "south": {
        "id": "habitation_module",
        "name": "居住艙",
        "discovered": true,
        "visible": true
      },
      "east": {
        "id": "engine_room",
        "name": "引擎室",
        "discovered": true,
        "visible": false
      },
      "west": null
    }
  }
}
```

---

## 13.6 火把 / 視野系統

可以讓 `torch` 變成真正有用的道具。

例如：

```text
沒有火把：
- 只能看到出口方向
- 看不到房間內道具
- 看不到隱藏陷阱

有火把：
- 能看到道具
- 能看到怪物
- 能看到部分機關

有偵查技能：
- 能看到陷阱
- 能看到隱藏通道
```

---

## 13.7 AI 生圖 / ComfyUI

可以做，但建議當加分功能。

順序建議：

```text
第一階段：使用預設角色頭像
第二階段：讓 GPT/Gemini 生成角色文字設定
第三階段：接圖片生成 API
第四階段：再接 ComfyUI 本地 workflow
```

原因：

- ComfyUI 很強，但整合成本高
- 現場 demo 風險高
- GPU / workflow / model 會增加不穩定性
- 不應該成為主線必要功能

---

## 14. 明天可以跟總召討論的問題

---

### 問題 1：學生的目標是什麼？

是：

```text
學會完整寫出 AI 遊戲
```

還是：

```text
體驗 AI 協作開發流程
```

如果是後者，React 成熟 Demo + 小範圍修改比較合理。

---

### 問題 2：最後成果是什麼？

可能選項：

```text
每組一張 AI 生成地圖
每組一個角色設定
每組一個可玩的分支版本
每組一個 PR
每組一段展示影片
```

---

### 問題 3：GitHub 協作要做到多深？

可能程度：

```text
只看 repo
clone repo
改檔案
commit
push
開 branch
開 pull request
code review
merge
```

對初學者來說，不一定要全部做完。

---

### 問題 4：學生需要碰程式碼到什麼程度？

選項：

```text
只改 JSON
只改 prompt
改 HTML/CSS
改 React component
改後端 gameData
改 engine 邏輯
```

建議不要讓初學者直接改 engine。

---

### 問題 5：AI 生成是主軸還是加分？

如果 AI 生成是主軸，教學應該集中在：

```text
prompt
schema
validator
human review
generatedArea
experimental runtime
```

如果 UI 成品是主軸，就要投入更多時間在 React / CSS / component。

---

## 15. 建議明天對總召的說法

可以這樣講：

```text
目前專案已經完成一個 Node.js + Express 的 AI 文字地城 Demo。
它分成 Game Engine、Narrator Agent、Content Designer Agent 三層。

現在技術上已經可以：
1. 玩基本文字地城
2. 用 AI 生成新地圖
3. 驗證 generatedArea JSON
4. 轉成 experimental gameData
5. 用 GAME_DATA_SOURCE=experimental 進入 runtime 測試

但目前 UI 還是 terminal 風格，對學生或展示來說不夠像成熟作品。

接下來有兩條路：
A. 繼續 HTML/CSS/JS，做輕量互動 UI，教學最穩。
B. 改成 React 前端，做成熟 RPG UI，學生只改指定模組和 prompt。

我會建議如果目標是營隊展示與 GitHub 協作，主專案可以走 React 成熟版；
但教學時不要要求學生從零學 React，而是讓他們在完成品中修改角色、地圖、技能、prompt，並透過 GitHub 練習分工。
```

---

## 16. 給明天討論用的初步決策建議

| 問題 | 建議 |
|---|---|
| 要不要換遊戲引擎？ | 暫時不要 |
| 要不要繼續 Web？ | 要 |
| 要不要升級 UI？ | 要 |
| 要不要保留文字敘事？ | 要 |
| 要不要保留 Game Engine？ | 要 |
| 要不要讓 AI 直接改 engine？ | 不要 |
| 要不要讓學生從零寫完整專案？ | 不建議 |
| 要不要讓學生改 prompt / JSON / 角色設定？ | 建議 |
| 要不要上 React？ | 如果目標是正式品，建議 |
| 要不要馬上接 ComfyUI？ | 不建議當主線 |

---

## 17. 最終建議版本

我建議把下一階段稱為：

```text
AI-DUNGEON-DEMO MVP 2.0
```

目標：

```text
從 terminal 文字地城
升級成互動式 AI 文字 RPG Web Demo
```

核心功能：

```text
1. React 或重構後的 Web UI
2. RPG 角色狀態欄
3. 角色大頭像
4. 背包 hover UI
5. 技能 hover UI
6. 房間節點式互動地圖
7. 保留 AI 敘事輸出
8. Content Designer 生成地圖
9. GitHub 分組協作
```

---

## 18. 可以先不做的事

為了避免爆量，以下建議先不要放進第一版：

```text
完整 2D 角色走路
Unity / Godot 重做
即時戰鬥
複雜動畫系統
完整裝備強化
多人連線
完整資料庫
ComfyUI 現場即時生圖
AI 直接修改 engine
完全自由技能編輯器
```

---

## 19. 總結

這個專案目前已經不是單純「做一個文字遊戲」而已。

它已經可以被包裝成：

```text
AI 生成內容
遊戲資料結構
前後端 API
GitHub 協作
人類審查 AI 內容
互動式 Web Game UI
```

如果明天要和總召討論，我會建議重點不要放在「學生能不能從零做完」，而是放在：

```text
我們做出一個完整成熟的 Demo，
學生在其中體驗 AI 協作開發流程，
每組透過 prompt / JSON / UI 小修改，
做出自己的角色與地圖版本，
最後用 GitHub 協作提交成果。
```

這樣比較實際，也比較符合營隊的時間限制和學生程度。

