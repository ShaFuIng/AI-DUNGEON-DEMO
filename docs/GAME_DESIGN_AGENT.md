# GAME_DESIGN_AGENT.md

## 1. 文件目的
本文件為 `AI-DUNGEON-DEMO` 的 `Content Designer Agent` 開發規格，提供人類開發者與 AI/Codex 接手時的共同依據。
重點在於定義：
- `Content Designer Agent` 的工作定位與邊界
- 與 `Game Engine`、`Narrator Agent` 的責任切分
- `Phase 1` 的資料契約（`JSON` / `JSON Schema`）
- `Validator` 的檢查流程與限制
- 安全邊界與禁止事項
- `Step 4` 到 `Step 8` 的銜接方向

本文件屬於 Development-time 規格，不描述 Runtime 玩法邏輯。

## 2. 專案目前三層架構
目前專案採三層分工：
- `Game Engine`：`engine/gameEngine.js`
  - 負責遊戲規則與 `state` 變更（移動、戰鬥、道具、技能、勝負條件等）。
- `Narrator Agent`：`AI/narrator.js`
  - 負責將 `eventResult` 改寫為繁體中文敘事，不可改變 `state`。
- `Content Designer Agent`：Development-time 內容設計輔助
  - 產生區域與內容草案，供驗證與人工審核。

明確邊界：
- `Content Designer Agent` 不是 Runtime AI。
- 玩家遊玩期間，`Content Designer Agent` 不能直接決定 HP、MP、背包、位置、怪物血量或勝負條件。

## 3. Content Designer Agent 的定位
`Content Designer Agent` 是 Development-time 輔助工具，不是遊戲進行中的 GM。

可執行工作：
- 根據主題產生新 `Area`
- 產生 `rooms`
- 產生 `items` / `monsters` / `skills` / `traps` 的設計草案
- 輸出 `generatedArea.json`
- 輸出 `patch` 建議（僅建議，不自動套用）
- 交由 `Human Review`

禁止工作：
- 直接修改 `gameEngine.js`
- 直接修改 `data/gameData.js`
- 直接改動 Runtime `state`
- 繞過 `Validator`
- 自動 `commit` 或 `push`

## 4. Phase 1 MVP 範圍
### In Scope
- 產生單一 `Area JSON`
- `Area` 內至少包含 `rooms`
- `rooms` 需包含：`id`、`name`、`description`、`exits`、`items`、`monster`
- 輸出至 `outputs/generatedArea.json`
- 使用 `tools/validateArea.js` 驗證
- 僅在 `Human Review` 後才考慮後續合併建議

### Out of Scope
- 不自動合併至 `data/gameData.js`
- 不修改 `Game Engine`
- 不修改 `Narrator Agent`
- 不做 Gemini provider
- 不新增資料庫、登入、session、多人功能
- 不做 Runtime AI 生成遊戲規則
- 不做完整平衡模擬
- 不做自動化測試整合（除非後續步驟明確要求）

## 5. 目前檔案責任分工
| 檔案 | 角色與用途 |
|---|---|
| `docs/GAME_DESIGN_AGENT.md` | 本文件；定義規格、邊界、流程與限制 |
| `schemas/generatedArea.schema.json` | 定義 `generatedArea` 資料格式的 `JSON Schema` |
| `tools/validateArea.js` | `Validator`；檢查是否符合 `MVP` 契約與邏輯規則 |
| `tools/sampleGeneratedArea.json` | 固定範例；示範合法格式 |
| `outputs/generatedArea.json` | 當前產出草案；不代表已合併進正式遊戲 |
| `data/gameData.js` | 正式遊戲資料來源；`Phase 1` 不直接修改 |

## 6. Phase 1 generatedArea JSON 資料契約
以下為 `Phase 1` 最小格式要求。

Root 欄位：
- `id`：`string`，`snake_case`，至少 3 字元
- `name`：`string`，`Area` 顯示名稱
- `theme`：`string`，主題描述
- `narrativeHook`：`string`，進入區域時的敘事鉤子
- `difficulty`：`integer`，1 到 10
- `rooms`：`array`，至少 1 個 `room`

Room 欄位：
- `id`：`string`，`snake_case`，且在 `rooms` 內唯一
- `name`：`string`
- `description`：`string`
- `exits`：`object`，目前只允許 `north` / `south` / `east` / `west`
- `items`：`string[]`，目前先引用 `item id`
- `monster`：`string` 或 `null`，目前先引用 `monster id`

最小合法 `JSON` 範例：
```json
{
  "id": "frozen_ruins",
  "name": "冰封遺跡",
  "theme": "寒霜、古代祭壇、低能見度",
  "narrativeHook": "你踏入霜霧瀰漫的石門，腳下冰屑發出清脆聲響。",
  "difficulty": 4,
  "rooms": [
    {
      "id": "frozen_gate",
      "name": "凍結門廊",
      "description": "風從破碎拱門灌入，牆面覆滿白霜。",
      "exits": {
        "east": "frozen_hall"
      },
      "items": [],
      "monster": null
    },
    {
      "id": "frozen_hall",
      "name": "寒霜大廳",
      "description": "中央石像半埋於冰層，地面有古老刻痕。",
      "exits": {
        "west": "frozen_gate"
      },
      "items": ["old_torch"],
      "monster": "ice_slime"
    }
  ]
}
```

## 7. 命名規則
- `id` 一律使用 `snake_case`
- 不使用中文 `id`
- 不使用空白
- 不使用 dash（例如 `ice-room` 不建議）
- 建議以區域語意前綴避免衝突，例如 `frozen_gate`、`frozen_hall`
- `name` 與 `description` 可使用繁體中文

## 8. Validator 應檢查的內容
### 目前已支援
根據 `tools/validateArea.js` 的現況，已包含以下檢查：
- root 必須是 object
- 必要 root 欄位存在
- area `id` 格式合法（`snake_case`）
- `name` / `theme` / `narrativeHook` 為非空字串
- `difficulty` 為 1 到 10 的整數
- `rooms` 為非空 array
- room 必要欄位存在
- room `id` 為 `snake_case`
- room `id` 不重複
- `exits` 方向只允許 `north/south/east/west`
- `exits` 目標必須存在於 `rooms`
- `items` 必須是 array
- `items` 中 `item id` 必須是 `snake_case`
- `monster` 必須是 `null` 或 `snake_case`

### 未來應補能力
- 檢查多餘欄位（`additionalProperties`）
- 檢查 `exits` 是否需雙向一致
- 檢查地圖可達性（reachability）
- 檢查 `item` / `monster` 是否存在於允許清單或 `data/gameData.js`
- 檢查重複 `items`
- 檢查文字長度上下限
- 檢查 `difficulty` 與怪物/補給配置是否大致合理
- 未來可考慮使用 AJV 套用 `JSON Schema`，但目前不要新增 dependency

注意：目前雖有 `JSON Schema` 檔案，主要驗證仍以手寫檢查為主，尚未宣告完整 schema runtime 驗證。

## 9. 標準工作流程
1. 人類或 AI 先根據主題產生 Area 草案。
2. 儲存為 `outputs/generatedArea.json`。
3. 執行：
   - `node tools/validateArea.js outputs/generatedArea.json`
4. `Validator` PASS 才能進入 `Human Review`。
5. `Human Review` 通過後，才考慮產生 `patch` 建議。
6. `patch` 建議仍不應自動套用到 `data/gameData.js`。
7. 最終是否合併，由人類開發者決定。

## 10. 禁止事項與安全邊界
- `Content Designer Agent` 不得修改 `gameEngine.js`
- 不得修改 Runtime `state`
- 不得讓 LLM 決定戰鬥結果
- 不得讓 LLM 決定勝負條件
- 不得繞過 `Validator`
- 不得直接 `commit` / `push`
- 不得把 `.env` 或 API key 寫入文件或 `JSON`
- 不得修改 `package-lock.json`，除非人類明確要求安裝套件

## 11. Step 4 到 Step 8 銜接計畫
- `Step 4`：完善 `tools/sampleGeneratedArea.json`
  - 建議改為真正的「冰封遺跡」範例
  - 保持可通過 `Validator`
- `Step 5`：完善 `schemas/generatedArea.schema.json`
  - 補強 schema 欄位限制
  - 決定是否加入 `items` / `monsters` / `skills` / `traps` 正式區塊
- `Step 6`：完善 `tools/validateArea.js`
  - 增加更多邏輯檢查
  - 暫時不要新增 dependency
  - 先以手寫檢查擴充
- `Step 7`：測試 `Validator`
  - 建立或手動準備 valid / invalid cases
  - 確認錯誤訊息清楚可行動
- `Step 8`：整理 `CLI` 指定檔案路徑
  - 目前 `process.argv[2]` 已有基本支援
  - 後續可補 `--help`、錯誤訊息、schema path 顯示

## 12. Phase 2 方向
`Phase 2` 方向以保守擴充為原則：
- 產生 `patch` 建議
- 協助轉換成 `gameData.js` 可讀格式
- 擴充更完整的 `items` / `monsters` / `skills` / `traps`
- 加入基礎 balance check
- 納入 CI 驗證流程

前述能力即使完成，所有正式合併仍需 `Human Review`。

## 13. 交接檢查清單
每次修改 `generatedArea` 前後，請至少確認：
- `JSON` 是否可 parse
- 是否通過 `Validator`
- 是否使用 UTF-8
- `id` 是否為 `snake_case`
- `exits` 是否只指向存在房間
- 是否未修改核心檔案
- 是否未執行 `commit/push`
- 是否已用 `Git diff` 檢查變更

---
最後更新：2026-05-02
