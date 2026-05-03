# Content Designer Runtime Merge Strategy

## 1. 文件目的
本文件用於規劃 `generatedArea` / `patch suggestion` 如何安全進入 runtime 遊戲資料。

重點：
- 這是策略文件。
- 不直接修改 `data/gameData.js`。
- 不直接修改 `engine/gameEngine.js`。
- 目標是在合併前先釐清接入方式、測試方式與回滾方式。

## 2. 當前狀態
- generatedArea 已可由 Gemini / mock 產生。
- generatedArea 已可通過 validator。
- patch suggestion 已可產生。
- Human Review decision 目前是 NEEDS REVISION。
- runtime 仍使用 `data/gameData.js`。
- generatedArea 尚未接入 runtime。

## 3. 為什麼不能直接合併
- generatedArea 是 Development-time draft。
- `data/gameData.js` 是 Runtime 正式資料。
- 兩者格式與用途不同。
- 目前 patch suggestion 的 ascii 是空字串。
- 起始房間接入策略未定。
- 既有勝利條件與 ancient_core / boss flow 可能受影響。
- 直接覆蓋可能破壞原本遊戲流程。

## 4. 可選合併策略

### Strategy A：替換原本地圖
說明：
- 用 generatedArea 的 rooms 取代 `data/gameData.js` 原本 rooms。

優點：
- 最快看到 AI 生成地圖進入遊戲。

缺點：
- 風險最高。
- 可能破壞原本起點、boss、key、ancient_core 流程。
- 不適合目前直接採用。

建議：
- 暫不採用。

### Strategy B：作為新區域加入既有地圖
說明：
- 保留原本地圖。
- 將冰封遺跡作為新區域加入。
- 從既有某個房間新增出口連到 generatedArea 的第一個房間。

優點：
- 保留原本遊戲流程。
- 可以局部測試新區域。

缺點：
- 需要設計入口。
- 需要確認回程 exits。
- 可能需要調整勝利條件。

建議：
- 中期可採用。

### Strategy C：建立 experimental gameData 檔案
說明：
- 不直接改 `data/gameData.js`。
- 建立 `data/gameData.generated.js` 或 `data/gameData.experimental.js`。
- runtime 可透過環境變數或手動切換載入資料。

優點：
- 最安全。
- 可保留原本遊戲。
- 方便展示與回滾。

缺點：
- 需要後續修改 server / gameData 載入流程。
- 需要多一層測試。

建議：
- Step 32 優先採用。

## 5. 推薦策略
目前推薦 Strategy C：建立 experimental gameData。

原因：
- 不破壞原本遊戲。
- 適合展示 AI 生成地圖。
- 適合教學與 rollback。
- 可以先用手動切換或環境變數控制。
- 等穩定後再考慮 Strategy B。

## 6. experimental gameData 設計草案
未來可能檔案：
- `data/gameData.experimental.js`

它應該：
- 從原本 `data/gameData.js` 複製基本 items / monsters / skills。
- rooms 使用 `generatedArea.patchSuggestion.json` 的 `roomsToAdd`。
- 補上 ascii placeholder 或簡單 ASCII。
- 保持 items / monsters / skills id 與原本一致。
- 不新增 engine 不支援的欄位。

## 7. runtime 切換策略

### Option 1：手動替換 require
- 在 `server.js` 暫時 require experimental 檔。
- 缺點是容易忘記還原。

### Option 2：使用環境變數 GAME_DATA_SOURCE
例如：
- `GAME_DATA_SOURCE=default`
- `GAME_DATA_SOURCE=experimental`

`server.js` 或 data loader 根據此變數決定載入哪個 gameData。

建議：
- 未來採用 Option 2，但下一步可以先用文件規劃，不立即改 `server.js`。

## 8. rollback strategy
- 合併前確認 `git status` clean。
- 合併前記錄 `git diff`。
- 若修改 `data/gameData.js`，必須單獨 commit。
- runtime 測試失敗時使用 `git restore` 或 `git revert`。
- 不要混合其他 unrelated changes。
- 不要把 `.env` 加入 commit。

## 9. runtime 測試清單

基本啟動：
- `npm start`
- 打開 `http://localhost:3000`
- `GET /api/health`
- `GET /api/state`

基本指令：
- `look`
- `status`
- `move north`
- `move south/east/west`
- `take torch`
- `attack`
- `skill fireball`
- `use small_potion`
- `log`
- `reset`

資料檢查：
- 初始房間存在
- exits 指向存在房間
- items 可拾取
- monsters 可戰鬥
- ancient_core 不破壞勝利流程
- gameOver / gameWon 邏輯正常

## 10. 合併前必要條件
- `npm test` PASS
- `npm run generate:area` PASS
- `node tools/createAreaPatchSuggestion.js` PASS
- Human Review decision 至少不是 REJECT
- patch suggestion 無 missing references
- patch suggestion 無 room id conflicts
- 已有 rollback plan
- 已決定 Strategy C 或 B

## 11. 不允許做的事
- 不直接覆蓋 `data/gameData.js`
- 不跳過 Human Review
- 不在同一 commit 混入 unrelated changes
- 不自動 commit / push
- 不暴露 API key
- 不修改 engine 規則來配合壞資料

## 12. 後續步驟
- Step 32：建立 `data/gameData.experimental.js` 草案
- Step 33：加入 `GAME_DATA_SOURCE` 切換設計，或先用手動測試方式
- Step 34：執行 runtime 測試
- Step 35：整理完整專案報告
- Step 36：考慮 CI / AJV / 自動化回歸測試
