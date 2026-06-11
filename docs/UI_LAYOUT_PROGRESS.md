## 近期修正：門鎖與 Recent Log 動畫
- 鑰匙開門流程已收斂為：在對應出口使用對應鑰匙，鑰匙被消耗，`flags.unlockedDoors` 記錄已解鎖門，之後移動才會放行。
- `altar -> east -> boss_room` 目前會在 `rusty_key` 於祭壇使用前阻擋移動；只擁有鑰匙不足以通過鎖門。
- Recent Log 維持窄版半透明 block 列表，最多 5 筆，顯示順序改為舊到新，最新訊息在最下方。
- Recent Log 僅使用 CSS 動畫：新訊息從下方淡入，第 6 筆出現時最舊訊息往上淡出後移除。

# AI-DUNGEON-DEMO UI Layout Progress

> 本文件記錄目前 React UI 版面與戰鬥 UI 狀態。
> 主版面目前維持 Map / Character / StoryCommand / Floating Window 架構，不做大幅重排。

## 1. 主版面架構

目前 `App.jsx` 的主版面分成兩欄：

- 左側：`MapView` 或 `BattleView`，下方固定放置 `StoryCommandPanel`
- 右側：`CharacterPanel` 搭配 `CharacterSideTabs`
- 浮動視窗：`FloatingGameWindow` 承載裝備、背包、技能內容
- 快速選單：`QuickActionsModal`

目前保留此架構，不把 Map / Character / StoryCommand / Floating Window 大幅重排。

## 2. 已完成 UI 內容

### CharacterPanel

- 作為角色主卡使用。
- 顯示角色名稱、職業占位、等級、AD 圖、HP / MP / EXP、ATK / DEF / SPD / LCK。
- `SPD` / `LCK` 目前仍為預留值。

### CharacterSideTabs 與 FloatingGameWindow

- 裝備、背包、技能已從常駐面板改為角色旁書籤按鈕與浮動視窗。
- `FloatingGameWindow` 仍需後續檢查拖曳與 viewport 邊界行為。

### StoryCommandPanel

- 原 `StoryLog` 與 `CommandBar` 已整合為 `StoryCommandPanel`。
- 顯示 story / command / system 訊息。
- 戰鬥中目前會禁用一般輸入，避免 `move` / `take` 等探索指令混入戰鬥流程；戰鬥操作改由 `BattleView` 按鈕送到後端。
- Map 左上 Recent Log 已改為較窄的固定最近 5 筆半透明 block 列表，顯示順序為舊到新，最新一筆在最下方，不再輪播、不顯示 indicator。

### MapView

- 顯示目前房間名稱與九宮格方向移動。
- 房間描述改由 hover tooltip 顯示。
- 怪物資訊不再常駐於 MapView，而是由 Encounter / Battle 流程承接。

## 3. 戰鬥 UI 目前狀態

### EncounterModal

- `EncounterModal` 已存在。
- 當目前房間有未擊敗怪物時，前端會提示遭遇敵人。
- 玩家確認後會送出 `battle start` 指令，由後端 `gameEngine` 切換到 `mode = "battle"`。
- 若目前房間沒有未擊敗怪物，不應進入戰鬥。

### BattleView

- `BattleView` 已存在並接入 `App.jsx`。
- `BattleView` 由後端 `gameState.mode` 控制顯示；戰鬥中顯示 BattleView，敗北的 `gameOver` 狀態也保留 BattleView 並停用按鈕，不再依賴前端本地 `battleMode` 作為主要真相來源。
- `BattleView` 的 player / enemy / battle log / turn / status 都來自後端公開 gameState。
- 可顯示玩家與敵人資訊。
- 可顯示玩家 HP / MP、敵人 HP、HP bar、battle log、回合數與目前狀態。
- Battle Log 已改為固定高度可滾動區塊，訊息增加時不會撐高整個 BattleView。
- 目前按鈕包含：
  - `attack`
  - `skill slash`
  - `skill fireball`
  - `skill guard`
  - `use small_potion`
  - `escape`
- 戰鬥按鈕會依狀態 disable，例如 MP 不足時不能使用 `fireball` / `guard`，gameOver 時不能繼續操作一般戰鬥按鈕。
- 若沒有敵人資料，BattleView 會顯示 fallback 訊息並允許返回地圖。

## 4. 戰鬥機制目前狀態

- battle state 已由後端 `gameEngine` 管理，公開欄位包含：
  - `mode`
  - `activeMonsterId`
  - `activeMonster`
  - `battle.turn`
  - `battle.log`
  - `battle.status`
  - `battle.lastEvent`
- 平常 `mode = "explore"`。
- `battle start` 會在目前房間有未擊敗怪物時進入 `mode = "battle"`。
- 怪物死亡後會標記 defeated，`mode` 回到 `explore`，`battle.status = "victory"`。
- escape 成功後 `mode` 回到 `explore`，`battle.status = "escaped"`。
- 玩家死亡後 `mode = "gameOver"`，`battle.status = "defeat"`。
- 後端已有基礎戰鬥指令：`attack`、`skill slash`、`skill fireball`、`skill guard`、`use small_potion`。
- `escape` 已加入簡化版機制：
  - 成功時由後端離開 battle mode 並回到探索狀態。
  - 失敗時怪物會反擊。
  - 目前成功率固定為 60%。
- `skill slash`、`skill fireball`、`skill guard` 統一要求目前房間必須有未擊敗怪物。
- `guard` 在沒有敵人時不會消耗 MP。
- 當目前房間有未擊敗怪物時，後端會阻擋 `move` / `take`，避免探索流程破壞戰鬥狀態。
- 戰鬥勝利後，怪物會標記 defeated，後端回到 `mode = "explore"`，前端回到 MapView。
- 玩家死亡後維持 `gameOver`，前端 BattleView 會停用一般戰鬥按鈕。
- 怪物可設定 `expReward` 與 `drops`；擊敗怪物後會顯示獲得 EXP、掉落物與升級訊息。
- 基礎 Level Up 規則已加入：`expToNextLevel = level * 20`，升級後 level / maxHp / maxMp / attack / defense 增加，HP / MP 回滿。

## 5. 背包與物品提示

- `InventoryWindowContent` 已改為 hover 顯示自訂 tooltip，不再把完整道具說明放在背包底部。
- Tooltip 會顯示：
  - 道具名稱
  - 類型
  - 描述
  - 效果
  - 用途提示
- 點擊道具格會在格子旁開啟小型 action menu，提供「使用」按鈕。
- action menu 會在點其他地方、按 Escape、或使用道具後關閉。
- 資料來源優先使用後端 `player.inventoryItems` 與 `itemDetails`。
- 若 item 缺少 description，會顯示 fallback：「這個道具還沒有詳細說明。」
- 空格子不顯示錯誤資訊。
- `use item` 後端已支援 consumable 與 key 類道具的環境判斷；quest / equipment / material 會回傳提示。
- 裝備系統尚未開放，equipment 目前只提供使用提示。

## 6. 生成資料規則

- Content Designer Gemini prompt 已要求：
  - item 必須有 `id`、`name`、`type`、`description`、`usageHint`。
  - item 可以有 `command`；沒有 command 時前端會自動送 `use <item.id>`。
  - key item 必須有 `unlocks`，且 usageHint 要描述能在哪裡使用。
  - consumable 必須有 `effect`。
  - equipment 使用 `type = "equipment"`，並包含 `slot` 與 `stats`。
  - monster 必須有 `hp`、`maxHp`、`attack`、`defense`、`expReward`、`drops`、`description`。
  - 重要門、寶箱、機關需要對應 key item 或 quest item。
- `tools/validateArea.js` 與 `schemas/generatedArea.schema.json` 已更新以接受上述欄位。

## 7. 仍需整理的設計問題

- Encounter / Battle 的敘事訊息仍可再統一，例如勝利、逃跑、死亡後的 log 呈現。
- `escape` 目前是固定 60% 成功率，未來可改成依角色速度、敵人等級或狀態計算。
- 完整回合制、敵人 AI、狀態效果、技能冷卻、戰鬥動畫仍待設計。
- `FloatingGameWindow` 拖曳與 resize 體驗仍需後續修正。
- 技能視窗目前仍保留技能預覽與 shortcut，但正式戰鬥操作以 `BattleView` 為主。
- generated items / monsters / equipment 尚未完整接入 experimental runtime merge。

## 近期新增：Adventure Setup 與動態技能
- `App.jsx` 啟動時先顯示 `AdventureSetup`，玩家可選 Default Demo 或 Generated Adventure。
- Default Demo 會呼叫 `/api/reset` 並使用預設 `data/gameData.js`。
- Generated Adventure 先呼叫 `/api/adventure/preview`，Step 3 開始冒險時直接使用 preview response 的 `state` / `gameData` 進入主遊戲畫面。
- `BattleView` 的技能按鈕改由 `gameState.player.skills` 產生，不再硬編碼 `skill slash` / `skill fireball` / `skill guard`。
- `SkillsWindowContent` 會顯示 runtime skill name、role、MP cost 與 description，並送出 `skill <skill.id>`。
- Start Screen 的 API key 欄位只會存到瀏覽器 localStorage；後端只在該次生成 request 使用。

## 近期新增：Runtime Equipment 與 Adventure Design Pass
- Generated Adventure pipeline 新增 `balanceRuntimeAdventure`，會補齊 room.kind、challenge、裝備、補給、Boss room 與數值平衡。
- `EquipmentWindowContent` 改為讀取 `gameState.player.equipmentItems`，顯示 weapon / armor / accessory、stats 與 description。
- `CharacterPanel` 顯示 effective ATK / DEF；若裝備提供加成，會以 `8 (+2)` 形式呈現。
- `BattleView` 的補給按鈕改為讀取 runtime consumable，不再只支援 `small_potion`。
- 後端 `use equipment` 已可裝備道具；戰鬥傷害與怪物反擊會使用 effective attack / defense。

## 近期新增：Setup Preview Flow
- `AdventureSetup` 從單步生成改為三步：Adventure Inputs、Character Preview、Adventure Preview。
- Character Preview 顯示角色摘要、背景、attributes、三個技能、appearance 與 imagePrompt。
- Adventure Preview 顯示房間列表、kind、敵人、道具 / challenge、Boss、勝利條件與資源摘要。
- Adventure Preview 成功後 server 會持有同一份 runtime state/gameData；按「開始冒險」不再呼叫 `/api/adventure/generate`。
- Balancer 會補 mirrored exits 並嘗試接回 unreachable rooms，避免 generated map 因單向出口或孤島房間卡在 validator。
- Boss encounter 判斷已支援 generated adventure 的 `room.kind = "boss"`，撤退會依後端 previousRoomId 回到上一個房間。

## 8. 重要檔案

```txt
client/src/App.jsx
client/src/components/BattleView.jsx
client/src/components/EncounterModal.jsx
client/src/components/MapView.jsx
client/src/components/CharacterPanel.jsx
client/src/components/StoryCommandPanel.jsx
client/src/components/FloatingGameWindow.jsx
client/src/components/MissionLogOverlay.jsx
client/src/components/CharacterSideTabs.jsx
client/src/components/QuickActionsModal.jsx
client/src/components/windowContents/InventoryWindowContent.jsx
engine/gameEngine.js
server.js
data/gameData.js
AI/contentDesignerProviders/geminiProvider.js
tools/validateArea.js
schemas/generatedArea.schema.json
```
## 近期修正：Boss 撤退與 Map Log 佈局
- 一般遭遇戰不可取消；普通怪仍會阻擋探索行動，玩家要先進入戰鬥，再透過 `escape` 脫離。
- Boss 危險提示的「暫時撤退」會呼叫後端 `retreat`，玩家會直接退回安全房間，不進入 Boss 戰。
- `retreat` 目前只在 `boss_room` 且 `ruin_guardian` 未擊敗時生效；手動 `move west` 會提示使用 `retreat`。
- Map 九宮格略向右移，替左上 Recent Log 留出閱讀空間。
- Recent Log 寬度調回約 15rem，維持最近 5 筆、舊到新排列與進出動畫。
## 近期精修：Boss modal 靜默撤退與 Map 微偏移
- Boss 危險提示按「暫時撤退」時，前端會靜默呼叫後端 `retreat`，StoryCommandPanel 只顯示撤退敘事，不顯示 `> retreat`。
- 手動 `retreat` 指令仍可作為備用流程。
- Map 九宮格不再整個靠右，改為從置中位置微幅右移。
- Recent Log 寬度調整到約 16rem，仍維持最近 5 筆、舊到新排列、最新在最下方與進出動畫。

## 近期修正：Command API 與 Map 欄位
- `App.jsx` 已統一使用 `COMMAND_API = "/api/game/command"`；Boss modal 暫時撤退會打這個 endpoint，但不顯示 `> retreat`。
- `server.js` 正式 command endpoint 為 `/api/game/command`；前端一般指令與 Boss modal 暫時撤退都使用同一個 endpoint。
- 開發環境後端固定使用 `http://localhost:3000`，Vite proxy 為 `/api -> http://localhost:3000`。
- Map 內容區已調整成左側 Recent Log 空間與右側九宮格區域，九宮格在右側區域置中，真正替左側 log 留出空間。
- Recent Log 寬度調整為約 18rem，仍維持最近 5 筆、舊到新排列、最新在最下方與進出動畫。

## 近期修正：Boss warning 與指令列
- Boss 危險提示的 dismissed 狀態只 suppress 當下撤退；玩家離開 `boss_room` 後會清除，下一次重新進入會再次跳出警告。
- 後端 `help` / `/help` 已改為依目前狀態列出可用指令。
- `StoryCommandPanel` 支援 Tab 自動補全、候選清單提示，以及 ↑/↓ 瀏覽本次 session 的歷史指令。
- 房間道具拾取狀態由 `flags.collectedItems` 保存，已拾取道具不再於使用後重新出現在 Map / look / help / autocomplete。
- `status` / `help` / `/help` 以系統資訊呈現，不再顯示一般 `> command` 區塊。
- 指令列送出後會自動 focus；E / B / S 可切換裝備、背包、技能視窗，Escape 優先關閉已開 Floating Window。
- Recent Command Panel Refinement：後端 `help` / `/help` 只列目前狀態的重要操作指令；`status`、`help`、`/help`、`reset` 等 ESC 選單輔助指令不再出現在終端機 help 清單。`StoryCommandPanel` 補全候選由 `App.jsx` 依目前 `gameState` 產生，已拾取道具不再出現在 help / autocomplete 的 `take` 候選。指令列只會在送出指令後自動 focus，Floating Window 開關不會搶回輸入焦點，E / B / S 可連續按第二次關閉裝備、背包、技能視窗。
## Adventure Setup Preview Refinement
- Step 2 character preview now shows `title`, `personality`, starter equipment, structured appearance, and portrait prompt positive/negative text.
- Step 3 adventure preview now shows richer room rows: monster, items, challenge type, required item, reward items, exits, and summary.
- Step 3 sidebar includes player summary, content counts, and `itemChains` that connect required item source -> challenge room -> reward.
- The start button still enters the adventure with the preview response `state` / `gameData`; it does not call `/api/adventure/generate`.

## ComfyUI Status and Portrait in Adventure Setup

- 第四階段開始接 ComfyUI integration，目前完成健康檢查與 Step 2 角色立繪生成。
- Adventure Setup Step 2 的角色預覽區塊，在 Portrait Prompt 附近顯示 ComfyUI 狀態。
- 狀態包含：檢查中、ComfyUI 已連線、ComfyUI 未連線。
- 前端呼叫 `GET /api/comfy/status`，並提供「重新檢查 ComfyUI」按鈕。
- ComfyUI 預設 URL 是 `http://127.0.0.1:8188`，可用 `COMFYUI_BASE_URL` 覆蓋。
- ComfyUI 已連線且角色預覽存在時，可按「生成角色立繪」。
- 前端會把 `portraitPrompt.positive` / `portraitPrompt.negative` POST 到 `/api/image/character`，預設使用 `512x768`。
- 成功後 Step 2 會顯示生成圖片，並把結果記錄在 `characterPreview.generatedPortrait`。
- Vite dev server 已 proxy `/generated` 到後端，Step 2 可以讀取 `/generated/comfy/<filename>`。
- 開始冒險後，App 會把 generated character metadata 套進 `gameState.player`，CharacterPanel 顯示 generated name/title/species/class 與 portrait。
- `/api/game/command` 回傳新 state 後，前端會重新套用 metadata，讓 look / move 後角色立繪仍保留。
- CharacterPanel 若沒有 portraitUrl 或圖片載入失敗，會 fallback 到原本 AD placeholder。
- ComfyUI 未啟動或產圖失敗時不顯示全頁錯誤，不阻擋角色生成、冒險生成或開始冒險。
