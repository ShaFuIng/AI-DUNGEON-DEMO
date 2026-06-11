# AI-DUNGEON-DEMO 專案脈絡（Step 1～Battle UI Progress）

## 目前狀態
- 已有固定流程可從 Gemini 生成到 experimental runtime：
  1. `generatedArea`
  2. `patchSuggestion`
  3. `experimentalGameData`
  4. `GAME_DATA_SOURCE=experimental` runtime 測試
- Step 35 pipeline test 文件已建立：`docs/CONTENT_DESIGNER_PIPELINE_TEST.md`
- default `data/gameData.js` 仍未被覆蓋
- React UI 目前已完成一輪大型版面重構，並新增進度紀錄：`docs/UI_LAYOUT_PROGRESS.md`
- `BattleView` 與 `EncounterModal` 已接入 React UI，戰鬥流程已有基礎版。
- battle state 已由後端 `gameEngine` 正式管理。

## UI 目前階段
- 右側 `CharacterPanel` 目前作為角色主卡使用，保留大型 AD 圖、HP / MP / EXP、ATK / DEF / SPD / LCK。
- 裝備、背包、技能已從常駐右下角區塊改為角色旁書籤按鈕與浮動視窗。
- 原本 `StoryLog` 與 `CommandBar` 已整合為 `StoryCommandPanel`。
- `MapView` 已簡化為房間名稱 + 九宮格地圖，移除原本 MAP 小標題與怪物資訊卡片。
- 主版面維持 Map / Character / StoryCommand / Floating Window 架構，不做大幅重排。
- `EncounterModal` 會在目前房間有未擊敗怪物時提示遭遇；確認後進入 `BattleView`。
- `BattleView` 已可顯示玩家 / 敵人資訊、HP bar、MP、battle log、行動按鈕與狀態文字。
- 後端公開 state 目前包含 `mode`、`activeMonsterId`、`activeMonster`、`battle.turn`、`battle.log`、`battle.status`、`battle.lastEvent`。
- `EncounterModal` 確認後會送出 `battle start` 指令，由後端切換到 `mode = "battle"`。
- 前端 `App.jsx` 依後端 `gameState.mode` 顯示 `BattleView`；戰鬥中顯示 BattleView，敗北的 `gameOver` 狀態也保留 BattleView 並停用按鈕，不再用本地 `battleMode` 作為主要真相來源。
- 後端已補上基礎指令護欄，避免怪物未擊敗或戰鬥中混入 `move` / `take` 探索流程。
- Battle Log 已改為固定高度可滾動，避免戰鬥訊息撐高 `BattleView`。
- 背包視窗已改為 hover tooltip 顯示道具資訊，點擊道具會在格子旁開啟小型「使用」action menu；資料來源優先使用後端 `player.inventoryItems` / `itemDetails`。
- `use item` 後端已支援 consumable 與 key 類道具的環境判斷；quest / equipment / material 會回傳合理提示，裝備系統仍是 TODO。
- 後端已加入基礎 EXP / Level Up 系統；怪物可設定 `expReward` 與固定 `drops`。
- Content Designer prompt / validator / schema 已更新，要求 item description、usageHint、equipment stats、monster drops、expReward。
- Map 左上 Recent Log 已改為較窄的最近 5 筆半透明 block 列表，不再使用輪播。
- 後續仍需讓戰鬥 log / 敘事事件更完整，並補上更正式的敵人 AI、狀態效果、技能冷卻與戰鬥動畫。

## 下一步
1. Step 36：處理 experimental win condition
2. Step 37：執行並記錄完整 runtime 測試結果
3. Step 38：整理完整專案報告
4. Step 39：評估 AJV / CI / 自動化回歸測試
5. UI 下一輪：修正 `FloatingGameWindow` 拖曳、調整字體大小、強化容器邊框與可讀性
6. Battle 下一輪：完善完整回合制、敵人 AI、狀態效果、技能冷卻、戰鬥動畫與更細緻的逃跑規則
7. Content Designer 下一輪：讓 experimental runtime merge 更完整接入 generated items / monsters / equipment
