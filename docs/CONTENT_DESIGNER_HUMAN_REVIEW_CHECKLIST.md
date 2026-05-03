# Content Designer Human Review Checklist

## 1. 文件目的
本文件用於人類審查 AI 產生的 `generatedArea`。

重點：
- `validator PASS` 只代表格式與基本邏輯通過。
- 不代表內容可直接合併。
- 合併前仍需 Human Review。

## 2. 適用時機
- `npm run generate:area` 後
- `node AI/contentDesigner.js --provider gemini ... --write --validate` PASS 後
- 準備進入 patch suggestion 前
- 準備考慮合併到 `data/gameData.js` 前

## 3. 必要前置條件
- `npm test` PASS
- `npm run validate:area` PASS
- generatedArea 已通過 `tools/validateArea.js`
- `.env` 沒有被 commit
- 沒有修改 `gameEngine.js`
- 沒有修改 `data/gameData.js`
- 沒有自動 commit / push

## 4. JSON Contract 檢查
- root 只有允許欄位
- root 必含 `id/name/theme/narrativeHook/difficulty/rooms`
- room 必含 `id/name/description/exits/items/monster`
- id 都是 snake_case
- 沒有中文 id
- 沒有多餘欄位
- 沒有 API key / `.env` / 敏感資訊

## 5. 地圖結構檢查
- rooms 數量符合預期
- 所有房間可從第一間抵達
- exits 只使用 `north/south/east/west`
- exits 指向存在房間
- exits 雙向一致
- 沒有孤島房間
- 沒有不合理死路（除非設計上有意義）

## 6. 敘事品質檢查
- theme 與 `name` / `narrativeHook` / `descriptions` 一致
- 描述使用繁體中文
- 每個房間有明確視覺或情境差異
- 敘事不過度重複
- 沒有奇怪翻譯腔或不自然文字
- 不含不適合課堂或營隊展示的內容

## 7. 道具與怪物配置檢查
- items 只使用允許 id
- monsters 只使用允許 id 或 `null`
- 道具分布合理
- 怪物分布合理
- 不會每個房間都塞滿道具或怪物
- 關鍵道具位置符合遊戲流程
- 怪物和場景敘事一致

## 8. 難度與平衡檢查
- difficulty 與實際內容一致
- 怪物數量與難度匹配
- 補給品配置合理
- 不會一開始就過難
- 不會完全沒有挑戰
- 目前僅做人工 rough balance，不代表正式 balance simulation

## 9. 與 Game Engine 邊界檢查
- generatedArea 不應描述會改變 engine 規則的內容
- 不應要求新戰鬥機制
- 不應要求新道具效果（除非後續另開功能開發）
- 不應假設不存在的技能或狀態效果
- 不應直接修改 HP / MP / inventory / position / monster HP

## 10. Provider 輸出檢查
針對 Gemini / LLM provider：
- 是否有多餘欄位
- 是否違反 roomCount
- 是否發明不存在 item / monster
- 是否有 markdown code block
- 是否有前後說明文字
- 是否有模型自我描述或解釋
- 是否需要重新生成

## 11. 審查結果分類
### PASS
可進入下一階段 patch suggestion。
但仍不代表可自動合併。

### NEEDS REVISION
內容可用，但需要重新生成或人工調整。
例如：
- 文字品質普通
- 房間描述重複
- 難度略不合理
- 道具配置需要調整

### REJECT
不應使用。
例如：
- validator FAIL
- 發明不存在系統
- 嚴重違反安全邊界
- 內容不適合教學展示
- 包含敏感資訊

## 12. 建議審查表格
| Category | Check Item | Result（PASS / NEEDS REVISION / REJECT） | Notes |
|---|---|---|---|
| JSON Contract | root 與 room 欄位完整性 |  |  |
| 地圖結構 | exits / 可達性 / 房間數量 |  |  |
| 敘事品質 | 主題一致性與文字自然度 |  |  |
| 道具怪物 | ID 合法與分布合理 |  |  |
| 平衡性 | 難度與補給匹配 |  |  |
| 邊界安全 | 無越權規則與敏感資訊 |  |  |

## 13. 審查後下一步
- PASS：可進入 Step 28 patch suggestion
- NEEDS REVISION：重新生成或人工修正後再驗證
- REJECT：不使用，保留錯誤原因
- 無論結果如何，不自動改 `data/gameData.js`

## 14. 安全提醒
- 不 commit `.env`
- 不暴露 API key
- 不自動修改核心規則
- 不自動 push
- Human Review 是必要關卡
