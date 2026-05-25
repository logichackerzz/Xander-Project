# 壽宴邀請網站 開發日誌

**專案**：黃鎮岳先生八十大壽壽宴邀請  
**GitHub**：https://github.com/logichackerzz/BanquetInvitation  
**網址**：https://logichackerzz.github.io/BanquetInvitation/  
**技術棧**：純 HTML + CSS + Canvas JS（單檔，無框架）

---

## 2026-05-07

### 完成項目

- **Bug 修正**：電話 `0913-202-533` 的 `href` 原本錯連到 `0915757503`，已修正為 `tel:0913202533`
- **整體風格重設計**（參考壽宴邀請圖）：
  - 維持深紅金色壽宴配色（#130404 底 + #D4AF37 金）
  - 加入「福如東海 壽比南山」對聯（置頂橫排）
  - 加入 SVG 燈籠（深紅橢圓體 + 金色橫紋 + 流蘇 + 壽/福字 + 晃動動畫），最終保留左側一個
  - 梅花枝改為真正 5 瓣 bezier 曲線花形 + 金色花心 + 花苞 + 綠葉，三頁各有配置
  - 雙層金邊框 + 四角 ◈ 裝飾，套用至三頁
  - Page 2 左右側加梅花枝裝飾
  - Row icon 全面改為 SVG 線條（日曆、時鐘、定位針），不用 emoji
- **換頁機制重寫**：
  - 移除 CSS scroll-snap，改用全 JS `transform: translateY` 動畫
  - easeInOutCubic 緩動，1000ms，絲滑可控
  - `scroll-snap-stop: always` → 改為 JS busy lock，手指滑一下只換一頁
  - 支援 touch 和 wheel 兩種輸入
- **Nav dots 修正**：縮小為 5px、gap 拉開為 14px，移除 padding 重疊問題
- **Page 2** 加入往下滑動提示
- **Page 3 電話**：兩支號碼下方統一只放一條金色漸層線，移除個別 border

---

## 2026-05-08

### 完成項目

- **本地 clone**：將 BanquetInvitation repo clone 至 `my-agent/400_Projects/web/BanquetInvitation/`，之後可直接編輯不用 API 推檔
- **PNG 素材匯入**：四張素材複製至 `images/` 資料夾
  - `corner-knot.jpg`（角落中國結）、`chinese-knot.jpg`（中國結吊飾）
  - `lantern.jpg`（燈籠）、`cloud.jpg`（祥雲）
- **JS 去背函數**：`removeWhiteBg()` — Canvas 逐像素掃描，`min(R,G,B) > 200` 的像素漸層透明化，不需去背素材
- **金框線移除**：`.frame { display:none }` — 框線與角落結視覺衝突，直接隱藏
- **SVG 梅花枝全移除**：三頁的梅花枝裝飾清空，改用 PNG 素材
- **四角結確認**：三頁各四個角落結，正確旋轉方向
  - BL：原圖；BR：`scaleX(-1)`；TL：`scaleY(-1)`；TR：`scale(-1,-1)`
  - **踩坑**：加 `transform-origin` 會讓翻轉後元素跑出 viewport，拿掉後用預設 `center` 正常

### 待辦

- [ ] 調整角落結大小（目前 90px，待確認最終尺寸）
- [ ] 一步步加回其他 PNG 素材（燈籠、祥雲等）
- [ ] 確認 iPhone Safari 換頁動畫是否順暢
- [ ] 完成後推上 GitHub Pages
- [ ] 活動結束後考慮封存或加入 RSVP 統計功能

### 技術備忘

- GitHub Pages 用 `PUT /contents/index.html` API 推檔（base64），因為 BanquetInvitation 是獨立 repo 沒有本地 clone
- 推檔需先取 SHA：`gh api repos/logichackerzz/BanquetInvitation/contents/index.html --jq '.sha'`
- 大檔案無法用 `--field content=` 傳，改用 PowerShell `Invoke-RestMethod` 搭配 JSON body

### 設計決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 頁數 | 三頁 | 每頁各司其職，長輩操作清楚，收尾有儀式感 |
| 底色 | 維持深紅金 | 不要婚禮粉，保留壽宴莊重感 |
| 右燈籠 | 移除 | 與對聯文字重疊，視覺衝突 |
| 圖案風格 | SVG 手繪（暫） | 待取得去背 PNG 後替換 |
| scroll 機制 | JS transform | CSS snap 無法控制動畫速度 |
