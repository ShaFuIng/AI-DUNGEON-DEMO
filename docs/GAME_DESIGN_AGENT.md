# GAME_DESIGN_AGENT.md

## 文件目的
本文件定義 `Content Designer Agent` 在目前專案的第一階段（MVP）工作邊界、資料契約與操作流程，讓其他 AI 或開發者可直接接手。

- 專案：`ai-dungeon-demo`
- 階段：Phase 1（單一 Area 生成與驗證）
- 目標：讓生成內容可以被自動檢查，並可安全交給後續整合流程

## 目前專案脈絡（摘要）
目前遊戲主體已存在：
- `server.js`：API 與遊戲流程編排
- `engine/gameEngine.js`：規則引擎（移動、戰鬥、道具、勝負條件）
- `data/gameData.js`：既有地圖與資料
- `AI/narrator.js`：敘事生成

Content Designer Agent 目前不直接改動上述核心檔案，而是先產生可驗證的內容草案。

## Phase 1 範圍
### In Scope
1. 生成一個 `Area` JSON（包含多個 rooms）。
2. 驗證 JSON 結構是否合法。
3. 將可用輸出放到 `outputs/generatedArea.json`。

### Out of Scope
1. 不自動合併到 `data/gameData.js`。
2. 不自動修改 `engine` 與 `server`。
3. 不做數值平衡模擬或自動測試整合。

## 檔案與責任
- `schemas/generatedArea.schema.json`
  - Area 的 JSON Schema（欄位、型別、基本限制）
- `tools/validateArea.js`
  - 驗證工具（結構檢查與額外邏輯檢查）
- `tools/sampleGeneratedArea.json`
  - 可參考的範例資料
- `outputs/generatedArea.json`
  - 本輪產出的區域資料

## Area 資料契約
### Root 欄位
- `id`: string，snake_case，至少 3 字元
- `name`: string，區域名稱
- `theme`: string，主題描述
- `narrativeHook`: string，進區一句敘事鉤子
- `difficulty`: integer，1 到 10
- `rooms`: array，至少 1 個 room

### Room 欄位
- `id`: string，snake_case，唯一
- `name`: string
- `description`: string
- `exits`: object，可含 `north/south/east/west`
- `items`: string[]（item id）
- `monster`: string 或 null

## 驗證規則（MVP）
除了 Schema 之外，`tools/validateArea.js` 會額外檢查：
1. `room.id` 不可重複。
2. `exits` 方向只能是 `north/south/east/west`。
3. `exits` 指向的 room id 必須存在於同一份 `rooms` 內。
4. `items` 與 `monster` id 必須符合 snake_case 格式。

## 標準工作流程
1. 先建立或更新區域內容（可參考 `tools/sampleGeneratedArea.json`）。
2. 輸出到 `outputs/generatedArea.json`。
3. 執行驗證：
   - `node tools/validateArea.js outputs/generatedArea.json`
4. 若驗證通過，標記為可進入下一階段整合。
5. 若驗證失敗，依錯誤訊息修正後重跑。

## 給 Agent 的實作準則
1. 先保證格式正確，再追求敘事豐富度。
2. `rooms` 的出口連結要保持可達性與一致性（避免單向死路錯誤）。
3. `difficulty` 要與怪物配置、補給密度大致相符。
4. 優先重用既有 id 命名風格（snake_case）。
5. 不要在本階段直接修改核心遊戲檔案。

## 交接檢查清單
每次產出前請確認：
1. `outputs/generatedArea.json` 可被 `validateArea.js` 通過。
2. 所有必要欄位都存在。
3. 出口沒有指向不存在的房間。
4. 檔案使用 UTF-8 編碼。

## 下一階段建議（Phase 2）
1. 新增「與既有 `gameData` 自動合併」工具。
2. 新增平衡性檢查（怪物強度、補給、路徑長度）。
3. 將驗證接入 CI（例如 PR 時自動檢查）。
4. 加入可回滾的內容版本管理策略。

---
最後更新：2026-05-02
