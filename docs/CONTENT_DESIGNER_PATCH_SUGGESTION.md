# Content Designer Patch Suggestion Spec

## 1. 文件目的
本文件定義如何把 `outputs/generatedArea.json` 轉成「patch suggestion」。

重點：
- patch suggestion 是建議，不是自動套用。
- 不直接修改 `data/gameData.js`。
- 必須先通過 validator 與 Human Review。

## 2. 為什麼需要 patch suggestion
- `generatedArea.json` 是 content design draft。
- `data/gameData.js` 是 runtime 正式遊戲資料。
- 兩者格式與責任不同。
- 不能直接覆蓋。
- 需要中介格式讓人類審查、討論與回滾。

## 3. 目前資料格式差異
`generatedArea.json`：
- root 有 `id/name/theme/narrativeHook/difficulty/rooms`
- `rooms` 是 array
- room 有 `id/name/description/exits/items/monster`
- 不一定有 `ascii`
- 屬於 Development-time draft

`data/gameData.js`：
- runtime 使用的正式資料
- `rooms` 通常是 object map
- room 可能需要 `ascii`
- engine 可能依賴既有 room id、key item、boss flow
- 直接覆蓋可能破壞遊戲流程

## 4. Patch suggestion 的定位
- 是 Human Review 後的下一階段
- 是「建議如何修改」而不是「直接修改」
- 可輸出到 `outputs/generatedArea.patchSuggestion.json`
- 應保持可讀、可比較、可回滾
- 不應包含 API key 或 `.env` 資訊

## 5. Patch suggestion 建議格式
```json
{
  "type": "gameDataPatchSuggestion",
  "sourceAreaId": "frozen_ruins",
  "sourceFile": "outputs/generatedArea.json",
  "targetFile": "data/gameData.js",
  "status": "draft",
  "requiresHumanReview": true,
  "summary": "建議將冰封遺跡加入 gameData rooms。",
  "roomsToAdd": {},
  "itemsReferenced": [],
  "monstersReferenced": [],
  "skillsReferenced": [],
  "engineCompatibilityNotes": [],
  "humanReviewNotes": [],
  "risks": [],
  "rollbackNotes": []
}
```

## 6. 欄位語意建議
- `type`：固定識別 patch suggestion 文件類型
- `sourceAreaId`：來源 generatedArea 的 id
- `sourceFile`：來源檔案
- `targetFile`：建議變更目標檔案
- `status`：`draft` / `reviewed` / `approved` / `rejected`
- `requiresHumanReview`：是否必須人工審查
- `summary`：本次建議摘要
- `roomsToAdd`：建議新增房間（以 room id 為 key）
- `itemsReferenced` / `monstersReferenced` / `skillsReferenced`：依賴項目
- `engineCompatibilityNotes`：與 engine 相容性提醒
- `humanReviewNotes`：審查者註記
- `risks`：風險列表
- `rollbackNotes`：回滾建議

## 7. 產生 patch suggestion 前置條件
- `npm test` PASS
- `npm run validate:area` PASS
- `outputs/generatedArea.json` 通過 `tools/validateArea.js`
- 已完成 `docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md`
- 確認未直接修改 `data/gameData.js`

## 8. 建議流程（Step 28）
1. 取得 `outputs/generatedArea.json`
2. 通過 validator
3. 完成人工審查 checklist
4. 生成 `generatedArea.patchSuggestion.json`（僅建議）
5. 人工審查 patch suggestion
6. 人工決定是否手動實作到 `data/gameData.js`

## 9. 不在本步驟內的事
- 不自動產生 patch
- 不自動修改 `data/gameData.js`
- 不自動 commit / push
- 不改 Runtime engine 規則

## 10. 安全提醒
- 不把 `.env` 或 API key 寫入 patch suggestion
- 不把 LLM 原始敏感輸出直接寫入正式資料
- patch suggestion 只是建議，Human Review 是必要關卡
