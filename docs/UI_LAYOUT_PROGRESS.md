# AI-DUNGEON-DEMO UI 版面重構進度紀錄

> 本文件記錄目前前端 UI 重構的階段性結果。  
> 目前 UI 位置與資訊架構先暫停在這個版本，後續再針對細節做第二輪調整。

## 1. 本次 UI 重構目標

本輪調整的核心目標是：

1. 讓右側 `CharacterPanel` 從「塞滿角色、裝備、背包、技能」改成「角色主視覺與角色狀態」。
2. 將原本常駐在右下角的 `ActionTabsPanel` 拆成浮動視窗內容。
3. 讓 `MapView`、`CharacterPanel`、`StoryCommandPanel` 三個主要區塊的視覺比例更接近 RPG / 文字冒險介面。
4. 暫時不碰戰鬥流程、不新增 BattleView、不修改 game engine。

---

## 2. 已完成的主要改動

### 2.1 右側 Character 主卡化

目前右側常駐區域只保留角色主卡：

- 角色標題：`探索者 / 人類 / 冒險者`
- `Lv. 1`
- 大型 AD 角色圖框
- `HP / MP / EXP`
- `ATK / DEF / SPD / LCK`

其中：

- `SPD` 與 `LCK` 目前仍為 `--`，只是 UI 預留欄位，尚未實作數值與規則。
- 原本 CharacterPanel 右側的裝備欄已移除，不再壓縮 AD 圖框。
- `CharacterPanel` 目前使用 `min-h-[760px]`，並透過 App 外層 wrapper 撐出右側主卡高度。

相關檔案：

```txt
client/src/components/CharacterPanel.jsx
client/src/App.jsx
```

---

### 2.2 角色旁邊新增獨立書籤按鈕

原本裝備、背包、技能不再常駐展開，而是改成角色卡右側的獨立書籤按鈕：

```txt
[裝備]
[背包]
[技能]
```

這些按鈕不放進 `CharacterPanel` 內容區，以免擠壓角色圖。它們負責開啟對應浮動視窗。

相關檔案：

```txt
client/src/components/CharacterSideTabs.jsx
client/src/App.jsx
```

---

### 2.3 拆出浮動視窗系統

原本 `ActionTabsPanel.jsx` 的常駐 UI 已不再由 App render。  
背包、裝備、技能拆成浮動視窗內容：

```txt
client/src/components/FloatingGameWindow.jsx
client/src/components/windowContents/EquipmentWindowContent.jsx
client/src/components/windowContents/InventoryWindowContent.jsx
client/src/components/windowContents/SkillsWindowContent.jsx
```

目前使用套件：

```txt
react-rnd
```

目標是讓這些視窗可以像遊戲 UI 一樣獨立顯示，不再影響 Map / Character 的排版。

目前已完成：

- 點「裝備」可開啟裝備視窗。
- 點「背包」可開啟背包視窗。
- 點「技能」可開啟技能視窗。
- 右上角 X 可關閉。
- 視窗本身已有 `react-rnd` 結構與 resize / draggable 設定。

目前待修：

- 浮動視窗滑鼠移到標題列時會顯示可拖曳游標，但實際拖曳仍無法正常移動。
- 這是下一輪 UI 修正的優先項目。

---

### 2.4 Quick Actions 改為 Esc 中央選單

原本右下角 `Quick Actions` 不再常駐。  
目前改成按 `Esc` 開啟中央 modal：

- 背景變暗。
- 中央出現 Quick Actions。
- 可使用：`Status / Help / Log / Reset`
- 再按 Esc、點背景或按 X 可關閉。

相關檔案：

```txt
client/src/components/QuickActionsModal.jsx
client/src/App.jsx
```

---

### 2.5 StoryLog 與 CommandBar 合併

原本左下角是兩個獨立區塊：

```txt
StoryLog
CommandBar
```

目前已整合成：

```txt
StoryCommandPanel
```

新版結構：

```txt
STORY   敘事紀錄
────────────────────────
story lines / command lines
...
────────────────────────
> [ command input ][送出]
```

已保留：

- storyLines 更新時自動滾到底部。
- command 類型以 `> command` 呈現。
- input 送出後呼叫原本 `sendCommand`。
- loading 時 input / button disabled。

相關檔案：

```txt
client/src/components/StoryCommandPanel.jsx
client/src/App.jsx
```

原本的檔案仍保留，但 App 不再使用：

```txt
client/src/components/StoryLog.jsx
client/src/components/CommandBar.jsx
```

---

### 2.6 MapView 版面簡化

目前 `MapView` 已做過幾個視覺調整：

- 移除 `MAP` 小標題。
- 移除右上角怪物資訊卡片。
- 只保留目前房間名稱。
- 房間名稱改為 absolute 浮在左上角，不再佔 normal flow 空間。
- 九宮格地圖縮小並置中。

目前 Map 九宮格設定：

```jsx
mx-auto grid h-[360px] w-full max-w-[480px] grid-cols-3 grid-rows-3 gap-3
```

目前 Map 外層：

```jsx
relative overflow-visible rounded-lg border border-white/10 bg-[#191714]/90 p-4
```

相關檔案：

```txt
client/src/components/MapView.jsx
```

---

## 3. 目前 App 主要 layout 狀態

目前 `App.jsx` 主容器大致為：

```txt
max-w-[1450px]
左欄：MapView + StoryCommandPanel
右欄：CharacterPanel + CharacterSideTabs
```

目前左右欄比例：

```jsx
lg:grid-cols-[minmax(0,1fr)_420px]
2xl:grid-cols-[minmax(0,1fr)_480px]
```

目前左欄：

```txt
MapView
StoryCommandPanel h-[420px]
```

目前右欄：

```txt
Character wrapper min-h-[760px]
CharacterPanel min-h-[760px]
```

---

## 4. 目前暫停點

目前 UI 位置先停在這個版本。  
接下來不應該再大幅移動 Map / Character / StoryCommandPanel 的主版面，除非有明確設計理由。

接下來優先處理的是「視覺細節與互動問題」。

---

## 5. 待處理事項

### 5.1 字體大小

目前未縮放狀態下，整體 UI 可讀性尚可，但部分文字仍需要調整：

- Map 卡片內文字大小。
- StoryCommandPanel 文字大小。
- CharacterPanel 屬性卡文字。
- Floating window 內文與按鈕文字。

目標：

- 不使用瀏覽器縮放或 CSS zoom 來解決。
- 以元件內字級與 padding 微調為主。

---

### 5.2 容器邊框不夠明顯

目前多數容器使用：

```txt
border-white/10
```

視覺上在深色背景中有些不夠清楚。後續可考慮：

- 主要容器改成 `border-white/15` 或 `border-white/20`。
- 互動區塊使用更明確的 hover / focus 邊框。
- Map / Character / StoryCommandPanel 三個主容器可以有不同 accent 色。

---

### 5.3 浮動視窗無法正常拖曳

目前 `FloatingGameWindow.jsx` 已經設定：

```jsx
dragHandleClassName="floating-window-title"
cancel=".floating-window-no-drag"
enableUserSelectHack={false}
className="fixed z-[70]"
```

但實測仍有問題：

- 游標顯示可以拖曳。
- 按住標題列後視窗仍無法像一般視窗一樣移動。

下一步需要針對 `react-rnd` 進一步排查：

1. 確認 `Rnd` 是否被 CSS `fixed` / transform / parent stacking context 影響。
2. 嘗試改用受控 `position` / `size` state。
3. 檢查是否有 overlay、pointer event 或瀏覽器事件被攔截。
4. 必要時改用 `react-draggable` 或自己實作拖曳。

---

### 5.4 浮動視窗位置與尺寸

目前浮動視窗使用固定初始座標：

```jsx
defaultPosition={{ x: 980, y: 120 }}
defaultSize={{ width: 420, height: 420 }}
```

後續可能需要：

- 根據視窗類型給不同預設位置。
- 避免在較小螢幕超出 viewport。
- 記憶上次開啟位置。
- 多視窗時處理 z-index。

---

### 5.5 BattleView 尚未實作

目前尚未新增 battle mode 或 BattleView。  
戰鬥技能未來應該移到 BattleView，而不是常駐在右側或浮動技能視窗中。

目前 `SkillsWindowContent` 比較像：

```txt
技能配置 / 技能預覽 / 技能樹預留 UI
```

不是最終戰鬥操作介面。

---

## 6. 不應該改動的範圍

目前 UI 微調階段，除非明確要求，請不要改動：

```txt
engine/gameEngine.js
server.js
AI/narrator.js
AI/contentDesigner.js
data/gameData.js
data/gameData.experimental.js
```

也不要在這個階段新增 battle mode 或改戰鬥流程。

---

## 7. 建議下一步

建議下一輪依序處理：

1. 修正 `FloatingGameWindow` 無法拖曳問題。
2. 調整主容器邊框明顯度。
3. 調整字體大小與 padding。
4. 檢查不同螢幕寬度下的 layout。
5. 再開始規劃 BattleView。

---

## 8. 目前相關新增 / 變更檔案

新增：

```txt
client/src/components/FloatingGameWindow.jsx
client/src/components/CharacterSideTabs.jsx
client/src/components/QuickActionsModal.jsx
client/src/components/StoryCommandPanel.jsx
client/src/components/windowContents/EquipmentWindowContent.jsx
client/src/components/windowContents/InventoryWindowContent.jsx
client/src/components/windowContents/SkillsWindowContent.jsx
docs/UI_LAYOUT_PROGRESS.md
```

仍保留但目前不由 App 常駐使用：

```txt
client/src/components/ActionTabsPanel.jsx
client/src/components/StoryLog.jsx
client/src/components/CommandBar.jsx
```

主要修改：

```txt
client/src/App.jsx
client/src/components/MapView.jsx
client/src/components/CharacterPanel.jsx
client/package.json
client/package-lock.json
README.md
PROJECT_CONTEXT.md
```
