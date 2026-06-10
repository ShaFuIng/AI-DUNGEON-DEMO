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
- 戰鬥中目前會禁用一般輸入，避免 `move` / `take` 等探索指令混入戰鬥流程。

### MapView

- 顯示目前房間名稱與九宮格方向移動。
- 房間描述改由 hover tooltip 顯示。
- 怪物資訊不再常駐於 MapView，而是由 Encounter / Battle 流程承接。

## 3. 戰鬥 UI 目前狀態

### EncounterModal

- `EncounterModal` 已存在。
- 當目前房間有未擊敗怪物時，前端會提示遭遇敵人。
- 玩家確認後進入 `BattleView`。
- 若目前房間沒有未擊敗怪物，不應進入戰鬥。

### BattleView

- `BattleView` 已存在並接入 `App.jsx`。
- 可顯示玩家與敵人資訊。
- 可顯示玩家 HP / MP、敵人 HP、HP bar、battle log、回合數與目前狀態。
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

- 後端已有基礎戰鬥指令：`attack`、`skill slash`、`skill fireball`、`skill guard`、`use small_potion`。
- `escape` 已加入簡化版機制：
  - 成功時離開前端 battleMode 並回到探索狀態。
  - 失敗時怪物會反擊。
  - 目前成功率固定為 60%。
- `skill slash`、`skill fireball`、`skill guard` 統一要求目前房間必須有未擊敗怪物。
- `guard` 在沒有敵人時不會消耗 MP。
- 當目前房間有未擊敗怪物時，後端會阻擋 `move` / `take`，避免探索流程破壞戰鬥狀態。
- 戰鬥勝利後，怪物會標記 defeated，前端回到 MapView。
- 玩家死亡後維持 `gameOver`，前端 BattleView 會停用一般戰鬥按鈕。

## 5. 仍需整理的設計問題

- 目前 `battleMode` 主要是前端 UI state，尚未成為後端正式 `gameState.mode`。
- Encounter / Battle 的敘事訊息仍可再統一，例如勝利、逃跑、死亡後的 log 呈現。
- `escape` 目前是固定 60% 成功率，未來可改成依角色速度、敵人等級或狀態計算。
- `FloatingGameWindow` 拖曳與 resize 體驗仍需後續修正。
- 技能視窗目前仍保留技能預覽與 shortcut，但正式戰鬥操作以 `BattleView` 為主。

## 6. 重要檔案

```txt
client/src/App.jsx
client/src/components/BattleView.jsx
client/src/components/EncounterModal.jsx
client/src/components/MapView.jsx
client/src/components/CharacterPanel.jsx
client/src/components/StoryCommandPanel.jsx
client/src/components/FloatingGameWindow.jsx
client/src/components/CharacterSideTabs.jsx
client/src/components/QuickActionsModal.jsx
engine/gameEngine.js
server.js
data/gameData.js
```
