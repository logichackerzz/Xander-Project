# ISU App — 義守大學選課系統重設計

> 個人休閒項目，與投資儀表板專題完全無關。勿混淆。
> 程式碼：`my-agent/400_Projects/data/isu-scraper/`

---

## 目標

把義守大學的老舊 ASP 選課系統，重新包裝成 Apple 設計風格的現代 App，
最終部署給全校同學使用。

**技術路線：**
1. 先做 PWA（Next.js + Tailwind）— 驗證想法，零成本
2. 有人用後 → Expo + EAS Build → App Store（需 Apple Developer $99/年）

---

## API 逆向工程結果（已完整驗證）

### 登入

```
POST https://netreg.isu.edu.tw/Wapp/wap_check.asp
Content-Type: application/x-www-form-urlencoded

logon_id=isu{學號}    ← 注意：前面要加 "isu"
txtpasswd={密碼}
language=zh_TW
lange_sel=zh_TW
```

**登入流程：**
```
wap_check.asp → SSO (apcrt.isu.edu.tw/certificate/) → wap_ldapca.asp → main.asp
```

> ⚠️ 安全問題：SSO 把帳密放在 URL query string 傳遞，我們自己的 app 絕對不能這樣做。

**Session 機制：** 純 Cookie-based，無 CSRF token，對爬蟲友善。

**Python 登入範例：**
```python
import requests, urllib3
urllib3.disable_warnings()

s = requests.Session()
s.post('https://netreg.isu.edu.tw/Wapp/wap_check.asp',
    data={'logon_id': 'isu11240004A', 'txtpasswd': 'Tcsh@tcsh087',
          'language': 'zh_TW', 'lange_sel': 'zh_TW'},
    headers={'User-Agent': 'Mozilla/5.0',
             'Referer': 'https://netreg.isu.edu.tw/Wapp/Wap_indexmain2.asp',
             'Content-Type': 'application/x-www-form-urlencoded'},
    verify=False, allow_redirects=True)
# 之後所有請求都帶 session，cookie 自動帶入
```

---

### 已確認可爬的 Endpoint

| 功能 | URL | 狀態 | 資料格式 |
|------|-----|------|---------|
| 我的課表（週視圖＋課程清單）| `/Wapp/wap_13/wap_130430.asp` | ✅ | HTML table × 2 |
| 個人基本資料 | `/Wapp/wap_00/wap_001400.asp` | ✅ | HTML table |
| 學號/系所資訊 | `/Wapp/wap_00/wap_000011.asp` | ✅ | 純文字 |
| 線上文件申請 | `/Wapp/wap_11/wap_110110.asp` | ✅ | HTML table |
| 課程授課計畫查詢 | `/Wapp/wap_13/wap_130020.asp` | ✅ | 含下拉選單 |
| 學生個人選課資料 | `/Wapp/wap_13/wap_130030.asp` | ✅ | 需帶學年學期 |
| 線上選課 | `/Wapp/wap_11/wap_110110.asp` | 🔲 待測 | |
| 成績查詢 | `/Wapp/wap_11/wap_110010.asp` | ⚠️ 尚未開放 | |

**BASE_URL：** `https://netreg.isu.edu.tw/Wapp`

---

### 課表資料結構（wap_130430.asp 解析後）

頁面含兩個 table：

**Table 1：週視圖**
```
欄位: 堂 | 星期一 | 星期二 | 星期三 | 星期四 | 星期五 | 星期六 | 星期日
節次: 1(08:20) 2(09:20) 3(10:20) 4(11:20) Z(12:20) 5(13:30) 6(14:30) 7(15:30) 8(16:30) 9(17:30) A(18:50) B(19:40) C(20:30) D(21:20)
課程格式: 【課程代號】(選修別) 課程名稱 【老師】 教室
```

**Table 2：課程清單**
```
欄位: 課程代號 | 課程名稱 | 開課系級 | 學分數 | 時數 | 選修別 | 授課教師 | 教室 | 一 | 二 | 三 | 四 | 五 | 六 | 日 | 修課情況 | 其他說明
```

---

## Xander 目前課表（114學年第2學期，用於開發測試）

| 課程 | 代號 | 老師 | 教室 | 節次 | 類型 |
|------|------|------|------|------|------|
| 深度學習 | A4008900 | 孫志彬 | 03117 | 三789 | 必修 |
| 網路程式設計 | A4024100 | 葉建寧 | 03717 | 一234 | 必修 |
| 專題製作 | A4047000 | 黃宏財/謝良瑜/葉建寧 | 50415 | 二1/四1/五1 | 必修 |
| 財務管理（二） | A2321200 | 吳昇曄 | 01802 | 二234 | 選修·全英 |
| 期貨選擇權 | A2331800 | 林雅玲 | 50509 | 四567 | 選修 |
| 證券投資分析 | A2337900 | 吳昇曄 | 01910 | 三234 | 選修 |
| 會計學(二) | A2514300 | 曾秀梅 | 01817 | 一789 | 選修 |

總計：21 學分（必修 9 + 選修 12）

---

## 設計方向

### 核心哲學：Apple 漸進揭露

原版把 74 個功能全丟出來 → 我們只在對的時間顯示對的資訊。

### 底部導航（Bottom Tab Bar）

```
今日  |  課表  |  選課  |  成績  |  我的
```

### 各頁面設計概念

**今日（首頁）**
- 現在是第幾節課、剩幾分鐘
- 下一堂課：課名 + 教室 + 倒數
- 今日剩餘課程列表（卡片式）
- 無課時顯示：「今天沒有課 ☀️」

**課表**
- 週視圖，顏色區分必修/選修
- 點課程卡片 → 展開詳情（老師、教室、學分）
- 左右滑動切換週次

**選課**
- 搜尋框即時過濾
- 課程卡片：名稱 + 老師 + 剩餘名額進度條
- 加選按鈕 → Face ID / Touch ID 確認

**成績**
- 學期成績卡片
- GPA 折線圖趨勢

---

## 技術棧

| 層次 | 選擇 | 原因 |
|------|------|------|
| 前端 | Next.js 14 + Tailwind CSS | 熟悉、可做 PWA |
| 後端 | Python FastAPI | 負責登入+爬蟲，回傳 JSON |
| 爬蟲 | requests + BeautifulSoup | 已驗證可行 |
| iOS 打包 | Expo + EAS Build | Windows 也能編譯 iOS |
| 部署 | Vercel（前端）+ Railway（後端）| 免費額度夠用 |

---

## 開發進度

- [x] 逆向工程登入 API
- [x] 確認 session cookie 機制
- [x] 爬出課表資料（wap_130430.asp）
- [x] 爬出個人資料
- [x] 分析 UX 問題、制定設計方向
- [ ] 設計課表資料的 JSON 結構（標準化節次代號）
- [ ] 寫 FastAPI 後端（/login、/schedule、/profile）
- [ ] 做「今日課表」UI prototype
- [ ] 做「週課表視圖」UI prototype
- [ ] 爬選課 endpoint（加選/退選流程）
- [ ] PWA 設定（manifest、service worker）
- [ ] 測試帳號登入流程完整串接

---

## 環境

- 開發機：Windows 11
- Python：`C:\Users\mybab\anaconda3\python.exe`
- 爬蟲腳本：`my-agent/400_Projects/data/isu-scraper/`
  - `step1_analyze_form.py` — 分析登入表單結構
  - `isu_scraper.py` — 互動式登入爬蟲（用 getpass）

---

## 注意事項

1. **帳號格式**：學號前要加 `isu`（`isu11240004A`，不是 `11240004A`）
2. **別把帳密貼在對話裡**，下次讓使用者自己輸入或用環境變數
3. **非官方 app**：部署時要在介紹頁寫清楚「非義守大學官方」
4. **不儲存使用者密碼**：後端只做登入轉發，session 存在用戶端
