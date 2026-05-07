# 散戶投資儀表板

散戶投資人專用的多市場儀表板，包含財報查詢、資產負債表、市場情緒分析。

## 技術棧
- 前端：Next.js + Tailwind CSS + shadcn/ui
- 後端：Python FastAPI
- OCR：Claude API

## 目錄結構

```
investor-dashboard/
├── frontend/          ← Next.js（待 npx create-next-app 初始化）
├── backend/           ← FastAPI
│   ├── main.py        ← 入口點
│   ├── requirements.txt
│   ├── routers/       ← API 路由（財報、持倉、情緒）
│   ├── scrapers/      ← 爬蟲模組（台股、美股、新聞）
│   ├── services/      ← 業務邏輯（報價、OCR、計算）
│   └── models/        ← 資料模型（Pydantic schemas）
└── docs/              ← API 規格、設計文件
```

## 快速啟動（建置後）

```bash
# 後端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

## 計劃書
`C:\Xander-agent\my-agent\100_Todo\projects\investor-dashboard.md`
