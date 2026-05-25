---
name: isu-journal
description: "ISU App 開發日誌 — 記錄每次開發的完成項目、卡點、決策與下次待辦。與一般學習日記完全分離，專門追蹤 ISU 校園通 App 的開發進度。觸發時機：(1) 輸入 /isu-journal，(2) 說「記錄 ISU 開發」「寫 ISU 日誌」「今天 ISU 做了什麼」。"
---

# ISU App 開發日誌 Skill

專門記錄 `my-agent/400_Projects/web/isu-app/` 這個專案的開發歷程。
日誌存放在 `my-agent/400_Projects/web/isu-app/docs/journal/YYYY-MM-DD.md`。
與一般學習日記（`my-agent/000_Agent/memory/daily/`）**完全分離**，不要混用。

---

## 流程

### Step 0：讀入現況

執行前先自動讀取（不需問用戶）：

1. `my-agent/400_Projects/web/isu-app/docs/journal/` — 找到最新一篇日誌（如果存在），擷取其中「下次待辦」區塊，作為今天的起點提示
2. `C:\Users\mybab\.claude\projects\C--Xander-agent\memory\project_isu_app.md` — 讀取「下次要做」清單

把讀到的「上次待辦」整理成一行提示，在 Step 1 第一個問題的 description 裡顯示給用戶看。

---

### Step 1：5 個引導問題

用 **AskUserQuestion** 一次問完（允許多選 / 多個問題並排，因為這是結構化記錄不是決策對話）。

問以下 5 題：

**Q1 — 今天完成了什麼？**
- header: `完成項目`
- 說明：功能新增、UI 修改、bug 修復、設定調整都算
- 如果上次有待辦，在 description 裡提示「上次預計做：[讀到的待辦清單]」
- multiSelect: false（讓用戶自由輸入，選 Other 填寫）
- options:
  - 「新增功能頁面」
  - 「修改 UI 樣式 / 動畫」
  - 「資料 / API 串接」
  - 「bug 修復」

**Q2 — 碰到什麼問題或卡點？**
- header: `問題卡點`
- multiSelect: false
- options:
  - 「沒有特別問題」
  - 「TypeScript / 型別錯誤」
  - 「樣式跑版」
  - 「API / 資料問題」

**Q3 — 有什麼設計或技術決策？**
- header: `決策`
- description: 例如：選了某個方案、捨棄某個功能、改了某個架構
- multiSelect: false
- options:
  - 「沒有特別決策」
  - 「UI 設計方向調整」
  - 「技術方案選擇」
  - 「功能範圍調整」

**Q4 — 下次要做什麼？**
- header: `下次待辦`
- description: 盡量具體，例如「串接 FastAPI /schedule endpoint」而不是「繼續做後端」
- multiSelect: false
- options:
  - 「液態玻璃效果（CSS backdrop-filter 近似）」
  - 「FastAPI 後端串接（/login /schedule /profile）」
  - 「行事曆功能完善（可編輯待辦）」
  - 「PWA 設定（manifest + service worker）」

**Q5 — 有什麼想法或靈感？（可跳過）**
- header: `靈感備忘`
- multiSelect: false
- options:
  - 「沒有，跳過」
  - 「UI 改進想法」
  - 「新功能構想」
  - 「效能或架構想法」

---

### Step 2：收集補充說明

收到 5 題的初步答案後，對於**不是「沒有 / 跳過」的項目**，用一句話跟用戶確認：

「好，我整理一下 —— 你說的「[Q1 答案]」，可以再說具體一點嗎？（例如：改了哪個頁面 / 用了什麼方法解決）」

**只對有實質內容的答案追問一次**，不要每題都追問。沒有內容的（「沒有」「跳過」）直接忽略。

如果用戶說「不用問了直接寫」，跳到 Step 3。

---

### Step 3：生成日誌

根據收集到的內容，生成以下格式的 Markdown 日誌：

```markdown
# ISU App 開發日誌 — YYYY-MM-DD

> 累計開發：第 N 篇日誌

---

## 完成項目

- [具體描述，一條一條列]

## 問題與解決

- [問題]：[解決方式]（如果沒有就寫「無」）

## 設計 / 技術決策

- [決策內容]（如果沒有就省略這個 section）

## 下次待辦

- [ ] [具體待辦 1]
- [ ] [具體待辦 2]

## 備忘 / 靈感

[有填就寫，沒有就省略這個 section]
```

**`第 N 篇日誌`的 N**：讀取 `docs/journal/` 目錄下的日誌數量 + 1。

---

### Step 4：存檔與更新記憶

**4-1 存日誌**

存到：`my-agent/400_Projects/web/isu-app/docs/journal/YYYY-MM-DD.md`

如果今天已有日誌（同一天執行第二次），在原檔尾端追加一個 `## 補充 — HH:MM` section，不要覆蓋原檔。

**4-2 更新專案記憶**

更新 `C:\Users\mybab\.claude\projects\C--Xander-agent\memory\project_isu_app.md` 裡的「下次要做」清單，把 Q4 的答案寫進去（取代舊的清單）。

**4-3 不要碰**

- 不要寫入 `my-agent/000_Agent/memory/daily/`（那是一般學習日誌的地盤）
- 不要修改 `MEMORY.md`（project_isu_app.md 的指標已經在裡面了）

---

### Step 5：結尾回報

簡短告知用戶：

```
日誌已存到 my-agent/400_Projects/web/isu-app/docs/journal/YYYY-MM-DD.md

下次待辦：
- [ ] ...
- [ ] ...
```

不需要說「太棒了」「做得好」之類的附和語。

---

## 規則

- 全程繁體中文
- 日誌語氣：工程記錄，簡潔直白，不要文青
- 不加多餘 emoji（最多用 `- [ ]` 的勾選框）
- 問題追問最多一輪，用戶說「直接寫」就不再追問
- 這個 skill 只管 ISU App，不要把一般學習心得寫進來
