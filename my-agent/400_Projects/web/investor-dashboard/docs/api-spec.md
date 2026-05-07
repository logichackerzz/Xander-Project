# API 規格文件

## Base URL
- 開發：`http://localhost:8000`
- 部署：TBD（Railway）

## 端點一覽

### 持倉管理 /api/portfolio
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | /holdings | 取得所有持倉 |
| POST | /holdings | 新增持倉 |
| DELETE | /holdings/{id} | 刪除持倉 |
| POST | /holdings/ocr | 上傳對帳單圖片解析 |

### 財報 /api/financials
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | /{symbol}/income-statement | 損益表 |
| GET | /{symbol}/balance-sheet | 資產負債表 |
| GET | /{symbol}/cash-flow | 現金流量表 |

查詢參數：`market=us|tw|crypto`

### 市場情緒 /api/sentiment
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | /fear-greed | 恐懼貪婪指數 |
| GET | /news | 財經新聞摘要 |
| GET | /indicators/{symbol} | 技術指標（RSI、MACD）|
