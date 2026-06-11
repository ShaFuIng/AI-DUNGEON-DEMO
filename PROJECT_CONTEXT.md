# AI-DUNGEON-DEMO 專案脈絡（Step 1～Battle UI Progress）

## 目前狀態
- 已有固定流程可從 Gemini 生成到 experimental runtime：
  1. `generatedArea`
  2. `patchSuggestion`
  3. `experimentalGameData`
  4. `GAME_DATA_SOURCE=experimental` runtime 測試
- Step 35 pipeline test 文件已建立：`docs/CONTENT_DESIGNER_PIPELINE_TEST.md`
- default `data/gameData.js` 仍未被覆蓋
- Runtime Generated Adventure Mode 已新增：前端 Start Screen 可輸入 Gemini API key、模型、風格、角色與冒險 prompt，呼叫 `/api/adventure/generate` 產生短篇可遊玩 `gameData`
- React UI 目前已完成一輪大型版面重構，並新增進度紀錄：`docs/UI_LAYOUT_PROGRESS.md`
- `BattleView` 與 `EncounterModal` 已接入 React UI，戰鬥流程已有基礎版。
- battle state 已由後端 `gameEngine` 正式管理。
- `gameEngine` 已改為可透過 `setRuntimeGameData()` 注入目前 runtime gameData，預設 Demo 與 generated adventure 共用同一套 command/state 流程。

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

## 近期新增：Generated Adventure Mode
- 新增 `client/src/components/AdventureSetup.jsx`，啟動時先選擇 Default Demo 或 Generated Adventure。
- 新增 `POST /api/adventure/generate`，成功後回傳 `state`、`gameData`、`generationSummary`。
- 新增 `AI/runtimeAdventureGenerator.js`、`AI/runtimeProviders/geminiRuntimeProvider.js`、`AI/prompts/buildRuntimeAdventurePrompt.js`、`AI/validators/validateRuntimeGameData.js`。
- Runtime validator 會檢查房間連通、exits 雙向一致、items / monsters / skills reference、勝利條件、補血道具與 quest item。
- 玩家技能改為由 `gameData.player.skills` 與 `gameData.skills` 決定；`BattleView` 與技能視窗不再硬編碼 `slash/fireball/guard`。
- API key 只由前端存入 localStorage 並在單次 request 使用；後端不記錄、不回傳、不寫入檔案。
- 規格文件：`docs/GENERATED_ADVENTURE_PLAN.md`

## 近期修正：Runtime Adventure Normalizer
- 新增 `AI/normalizers/normalizeRuntimeGameData.js`，將 Gemini 常見的 array 輸出轉為 engine 需要的 object map。
- `AI/runtimeAdventureGenerator.js` 流程改為 `parse -> normalizeRuntimeGameData -> validateRuntimeGameData`。
- normalizer 會修正 `items` / `monsters` / `skills` array、缺漏 id、player skill reference、room item / monster reference、consumable effect 與 winCondition required item。
- `validateRuntimeGameData` 仍是最後守門；如果收到未正規化 array，錯誤會明確顯示 `items must be object map, but got array`。
- 新增 samples：`AI/samples/runtimeAdventure.valid.json` 與 `AI/samples/runtimeAdventure.arrayInput.json`。

## 近期新增：Adventure Design Pass 與裝備 runtime
- 新增 `AI/balancers/balanceRuntimeAdventure.js`，runtime generation 流程改為 `parse -> normalize -> balance -> validate`。
- balancer 會補齊 room.kind、challenge、healing consumable、equipment、Boss room quest item，以及普通怪 / Boss 數值平衡。
- `validateRuntimeGameData` 增加 adventure design 檢查：empty room ratio、equipment item、puzzle challenge、skill role、Boss balance、equipment slot/stats、challenge references。
- `engine/gameEngine.js` 新增 player equipment：weapon / armor / accessory。
- `use <equipment_id>` 會裝備道具；public player state 回傳 base stats 與 effective stats。
- 戰鬥公式改用 effective attack / defense；怪物攻擊會扣玩家防禦，技能傷害會吃武器攻擊加成。
- `EquipmentWindowContent` 改為顯示 runtime equipment，不再硬編碼 Rusty Blade / Empty。

## 近期新增：Adventure Setup 三步流程與 Boss Retreat 泛化
- `AdventureSetup` 改為 Step 1 Adventure Inputs、Step 2 Character Preview、Step 3 Adventure Preview。
- 新增 `POST /api/character/preview`，只生成角色預覽，不修改 runtime session。
- 新增 `POST /api/adventure/preview`，生成冒險預覽並暫存同一份 runtime state/gameData，供 Step 3 開始冒險後的 command API 使用。
- Step 3「開始冒險」直接使用 `/api/adventure/preview` 回傳的 state/gameData，不再呼叫 `/api/adventure/generate`。
- `confirmedCharacter` 會被傳入 adventure generation，角色 attributes、skills、starter equipment 會套用到 runtime gameData。
- 新增 `AI/prompts/buildCharacterPreviewPrompt.js` 與 `AI/characterPreviewGenerator.js`。
- Boss retreat 不再硬綁 `boss_room` / `ruin_guardian` / `west`；改由 `room.kind === "boss"`、monster boss metadata 與 `previousRoomId` 決定。
- `balanceRuntimeAdventure` 會修復 mirrored exits 與 unreachable rooms，讓 validator 的 exit mirror / reachability 檢查仍保留但更少被 LLM shape 卡住。

## 近期修正：門鎖與 Recent Log 動畫
- `gameEngine` 已新增 `flags.unlockedDoors`，用來保存已解鎖的門。
- `boss_room` 不再因玩家背包擁有 `rusty_key` 就直接開放；玩家必須在 `altar`，也就是 east exit 指向 `boss_room` 的位置，主動使用 `rusty_key`。
- 鑰匙使用成功後會解鎖門、消耗 `rusty_key`，之後即使鑰匙已消耗，已解鎖的門仍可通過。
- 鑰匙在不合理房間使用不會消耗，會回傳附近沒有可用機關或門鎖的繁體中文提示。
- Recent Log 維持最多 5 筆，顯示順序改為舊到新；新訊息從底部淡入，第 6 筆出現時最舊訊息淡出上移，其餘 block 往上遞補。
## 近期修正：Boss 撤退與 Map Log 佈局
- 一般遭遇戰不可取消；普通怪房間仍會阻擋 `move` / `take`，玩家必須進入戰鬥後用 `escape` 脫離。
- Boss 危險提示可以選擇「暫時撤退」；前端會送出 `retreat` 指令，後端在 `boss_room` 將玩家移回 west 出口的 `altar`。
- `retreat` 不會進入 battle mode、不會標記 Boss defeated，也不會移除 Boss。手動在 Boss 房輸入 `move west` 會提示改用 `retreat`。
- Map 九宮格已由置中改為略向右靠齊，Recent Log 可使用較舒適寬度但仍不遮住主要操作區。
- Recent Log 維持最多 5 筆、舊到新排列、最新在最下方，並保留最舊離開與新訊息從底部進入的動畫。
## 近期精修：Boss modal 靜默撤退與 Map 微偏移
- Boss 危險提示按「暫時撤退」時，前端會直接呼叫 `/api/game/command` 送出 `retreat`，但不會把 `retreat` 顯示成玩家輸入的 command line。
- 後端 `retreat` 指令仍保留，供手動輸入或 debug 使用。
- Map 九宮格已從靠右改為以置中為基準微幅右移，避免貼近右側。
- Recent Log 寬度調整為約 16rem，仍保留最近 5 筆、舊到新排列與進出動畫。

## 近期修正：Command API 與 Map 欄位
- 前端 command 呼叫已統一使用 `COMMAND_API = "/api/game/command"`；Boss modal 的「暫時撤退」會打同一個 endpoint，但不新增 command line。
- `server.js` 正式 command endpoint 為 `/api/game/command`；前端一般指令與 Boss modal 暫時撤退都使用同一個 endpoint。
- 開發環境後端固定使用 `http://localhost:3000`，Vite proxy 為 `/api -> http://localhost:3000`。
- Map 內容區改為左側 Recent Log 空間與右側九宮格區域，九宮格在右側區域置中，不再只用 translate 視覺位移。
- Recent Log 寬度調整為約 18rem，仍維持最近 5 筆、舊到新排列與進出動畫。

## 近期修正：Boss warning 與指令列
- Boss 危險提示的 dismissed 狀態只 suppress 當下撤退；當玩家離開 `boss_room` 時會清除，下一次重新進入會再次跳出 Boss warning。
- 後端 `help` / `/help` 會依 explore、battle、gameOver / gameWon 狀態列出重要操作指令；終端機 help 不再列出 `status`、`help`、`/help`、`reset` 等 ESC 選單輔助指令。
- `StoryCommandPanel` 支援 Tab 自動補全、候選提示、↑/↓ 歷史指令；候選指令由 `App.jsx` 依目前 `gameState` 動態產生，並會依背包狀態更新 `use item` 候選。
- 房間道具拾取狀態已改由 `flags.collectedItems` 記錄，避免 consumable / key 使用後在原房間重生。
- `status` / `help` / `/help` 會以系統資訊顯示，不再新增一般 `> command` 區塊。
- 指令輸入列只會在送出指令後自動取回 focus；Floating Window 開關不會搶焦點，E / B / S 可連續按第二次關閉裝備、背包、技能視窗。
# Runtime Generated JSON / Item Challenge Update
- Gemini runtime JSON parsing is centralized in `AI/utils/parseGeneratedJson.js`.
- The parser extracts plain JSON, fenced `json` blocks, or the first object found inside surrounding text.
- If direct `JSON.parse` fails, invalid escape sequences are sanitized while legal JSON escapes stay intact.
- Runtime adventure challenges are item-based only: `item_puzzle`, `locked_door`, `mechanism`, `trap`, `sealed_chest`.
- Text-answer challenge types such as `riddle`, `answer_riddle`, `text_answer`, and `guess` are normalized away before validation and rejected if still present.
- Balancer ensures each challenge `requiredItemId` exists and is obtainable before the challenge.
- Validator reports missing required items, missing item sources, self-locked items, and missing challenge reward items.
- Step 2 character preview now carries `starterEquipment`, trait objects, structured appearance, and portrait prompt text.
- Step 3 adventure preview now includes required/reward item names and `itemChains`.
- Starting Step 3 still uses the `/api/adventure/preview` state/gameData directly; it does not call `/api/adventure/generate`.
