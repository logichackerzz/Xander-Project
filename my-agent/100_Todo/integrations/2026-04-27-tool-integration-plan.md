---
created: 2026-04-27
status: in-progress
source: 外部工具整合包 by 雷小蒙
---

# 外部工具整合計畫（2026-04-27）

> 這份計畫是「外部工具整合包」訪談後產出的，列出所有你打算接到 Claude Code 的工具。
> **執行方式**：有空的時候打開這份文件跟 AI 說：「幫我挑一個來裝」，AI 會用網路搜尋查當下最新的整合方式，一步一步帶你裝，完成後把對應的 checklist 打勾。

## 決策原則速查

在選每個工具的路線前，優先順序是：

1. 🥇 **CLI**（`gh`、`gws-cli`、官方 CLI）— 不吃 context、最穩定
2. 🥈 **REST API + `.env`**（curl / Python requests）— 彈性最高、可精準控制
3. 🥉 **MCP**（`~/.claude.json` 的 `mcpServers`）— 只有 CLI + API 都不行時才用
4. 🔒 **瀏覽器控制**（Chrome DevTools MCP / Playwright）— 真的沒 API 才走這條

每個工具的「建議路線」欄位是 AI 初步判斷，實際執行時會再用網路搜尋確認當下最新的最佳做法。

---

## 工具清單

### 🟡 Gmail — 尚未整合

- **用途**：讀信、建草稿、搜尋歷史信件，讓 AI 幫你篩選重要郵件
- **建議路線**：🥈 REST API（Gmail API + OAuth 2.0，或透過 `gws-cli`）
- **執行時要查的事情**：
  - [ ] `gws-cli` 目前是否仍維護？安裝方式？（優先考慮 CLI，比純 REST 更省事）
  - [ ] 若走 REST API：Google Cloud Console 如何開啟 Gmail API、取得 OAuth client credentials？
  - [ ] token 要存哪裡？（`.env` 或 `~/.env.claude-tools`）
  - [ ] 有沒有比 gws-cli 更新/更穩的 Gmail CLI 方案？
- **安裝 checklist**：
  - [ ] 決定路線（`gws-cli` CLI 或 Gmail REST API）
  - [ ] 取得必要憑證（OAuth client ID / secret 或 API key），存到 `.env`
  - [ ] 安裝並完成授權流程
  - [ ] 跑驗證指令：「幫我看最近 3 封信的主旨」
  - [ ] 回來打勾 + 備註欄記下踩坑
- **備註**：（執行完畢後填這裡）

---

### ⏸️ GitHub — 暫緩（未來架站再裝）

- **用途**：管理 repo、查看 issues、建立 PR、追蹤 commit 記錄
- **建議路線**：🥇 CLI（`gh`，GitHub 官方 CLI）
- **暫緩原因**：目前不需要，等未來有架設網站需求時再整合
- **備註**：準備好時跟 AI 說「幫我裝 GitHub 整合」，它會即時查最新步驟

---

### 🟢 Firecrawl — 已整合

- **用途**：抓網頁內容、整理文章重點、比較產品規格、爬取資料
- **建議路線**：🥉 MCP（Firecrawl 官方 MCP server，CLI/API 相對不順）
- **執行時要查的事情**：
  - [ ] Firecrawl 目前官方推薦的 MCP 安裝方式（npm 套件名、設定格式）
  - [ ] Firecrawl 免費方案的額度限制？需要信用卡嗎？
  - [ ] API key 從哪裡取得（firecrawl.dev 或其他）？
  - [ ] `~/.claude.json` 的 `mcpServers` 要怎麼加這個 entry？
- **安裝 checklist**：
  - [x] 在 firecrawl.dev 申請帳號、取得 API key
  - [x] 把 `FIRECRAWL_API_KEY` 存到 `.env`
  - [x] 建立 `.mcp.json` 加入 Firecrawl MCP entry
  - [x] `settings.local.json` 加入 `enableAllProjectMcpServers: true`
  - [ ] 重新啟動 Claude Code，讓 MCP 載入
  - [ ] 跑驗證：「幫我抓這個網頁的重點：[某個 URL]」
- **備註**：路線 MCP（npx firecrawl-mcp）。API key 存於 `.env` 和 `.mcp.json`。待重啟 Claude Code 後驗證。

---

### 🟡 協作筆記空間 — 尚未建構

- **用途**：記錄 AI 與 Xander 的協作筆記、決策紀錄、學習心得、專題進度
- **建議路線**：🥇 本地資料夾（Claude Code 直接讀寫，零成本、零設定）
- **執行時要查的事情**：
  - [ ] 確認 `my-agent/200_Reference/` 和 `my-agent/000_Agent/memory/` 的現有結構
  - [ ] 協作筆記要放哪個子資料夾最合理？（建議：`my-agent/200_Reference/notes/` 或直接用現有 memory 系統）
  - [ ] 要不要建立一個「每週協作摘要」的模板？
- **安裝 checklist**：
  - [ ] 確認目錄結構，選定協作筆記的存放路徑
  - [ ] 建立第一份筆記範本（`000_Agent/memory/` 或新資料夾）
  - [ ] 告訴 AI：「我們的協作筆記放在 [路徑]」，讓 AI 知道要往哪裡寫
  - [ ] 回來打勾
- **備註**：（建構完畢後填這裡）

---

### ⏸️ Apple Calendar — 暫時跳過

- **原因**：目前沒有官方 MCP，iCloud 整合屬進階操作
- **未來**：若有輕量方案出現再評估

---

## 進度總覽

- 🟡 尚未整合：2 個（Gmail、協作筆記空間）
- 🟢 已整合：1 個（Firecrawl）
- 🔴 放棄：0 個
- ⏸️ 暫緩：2 個（Apple Calendar、GitHub — 未來架站再裝）

**下次執行建議**：從 **協作筆記空間**（零設定，最快）開始，再挑 **Gmail** 或 **Firecrawl** 其中一個。

---

## 給未來 AI 執行時的指引（不要刪這段）

當用戶打開這份文件跟你說「幫我挑 [某個工具] 來裝」時，請按以下步驟：

### 1. 確認範圍

用 `AskUserQuestion` 確認：
- 你要整合 [工具名]，對嗎？
- 整合的主要用途是什麼？（從計畫文件的「用途」欄讀出來讓他確認）

### 2. 用網路搜尋查最新整合方式

**這一步絕對不要跳過，也不要用訓練資料裡的舊資訊。** 執行：

1. 用 WebSearch / WebFetch 查：
   - `"[工具名]" Claude Code MCP integration 2026`
   - `"[工具名]" official CLI tool`
   - `"[工具名]" REST API authentication`
2. 優先看官方文件、GitHub README、官方 blog 公告
3. 對照計畫文件的「建議路線」，看看有沒有更新/更好的方案
4. **整理成一段話告訴用戶**：「我查到 [工具名] 目前最推薦的整合方式是 [XX]，因為 [原因]。要不要照這個走？」
5. 用 `AskUserQuestion` 讓用戶拍板

### 3. 執行安裝

根據拍板的路線：

- **CLI 路線**：安裝 CLI 工具（brew / winget / npm / pip，依官方推薦），完成 auth，跑驗證指令
- **API 路線**：
  - 引導用戶取得 API key / token（告知官方取得頁面）
  - 存到 `600_Project/.env` 或 `~/.env.claude-tools`，命名用大寫底線（例：`GMAIL_CLIENT_ID`）
  - 在 `000_Agent/skills/` 底下建 skill（例：`gmail-api/SKILL.md`），寫認證方式、常見 endpoint、範例
- **MCP 路線**：
  - 編輯 `~/.claude.json` 的 `mcpServers` 加入新 entry
  - 完成 auth（OAuth 跳瀏覽器 / 貼 token）
  - 告訴用戶如何重啟 Claude Code 讓 MCP 載入

### 4. 驗證

用一個實際指令測試整合真的能用：
- Gmail → 「幫我看最近 3 封信的主旨」
- GitHub → `gh repo list --limit 5`
- Firecrawl → 「幫我抓這個網頁的重點：[URL]」
- 協作筆記 → 建立一份測試筆記，確認 AI 能讀到

### 5. 更新計畫文件

用 `Edit` 工具更新這份計畫文件：
- 該工具區塊的標題從 🟡 改成 🟢
- checklist 全部打勾
- 備註欄寫：「實際用了 [路線]、版本 [版本號]、踩坑 [...]、驗證指令 [...]」
- 進度總覽數字更新

### 6. 告訴用戶下一步

「[工具名] 整合完成！剩下 [N] 個工具。建議一週後再挑下一個，讓這個先用熟。」
