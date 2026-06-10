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

## UI 目前階段
- 右側 `CharacterPanel` 目前作為角色主卡使用，保留大型 AD 圖、HP / MP / EXP、ATK / DEF / SPD / LCK。
- 裝備、背包、技能已從常駐右下角區塊改為角色旁書籤按鈕與浮動視窗。
- 原本 `StoryLog` 與 `CommandBar` 已整合為 `StoryCommandPanel`。
- `MapView` 已簡化為房間名稱 + 九宮格地圖，移除原本 MAP 小標題與怪物資訊卡片。
- 主版面維持 Map / Character / StoryCommand / Floating Window 架構，不做大幅重排。
- `EncounterModal` 會在目前房間有未擊敗怪物時提示遭遇；確認後進入 `BattleView`。
- `BattleView` 已可顯示玩家 / 敵人資訊、HP bar、MP、battle log、行動按鈕與狀態文字。
- 目前 `battleMode` 仍是前端 UI state，不是後端正式 `gameState.mode`；後端已補上基礎指令護欄，避免怪物未擊敗時混入 `move` / `take` 探索流程。
- 後續仍需評估是否把 battle state 正式納入 engine state，以及讓戰鬥 log / 敘事事件更完整。

## 下一步
1. Step 36：處理 experimental win condition
2. Step 37：執行並記錄完整 runtime 測試結果
3. Step 38：整理完整專案報告
4. Step 39：評估 AJV / CI / 自動化回歸測試
5. UI 下一輪：修正 `FloatingGameWindow` 拖曳、調整字體大小、強化容器邊框與可讀性
6. Battle 下一輪：整理正式 battle state、逃跑機率與戰鬥中可用指令白名單
