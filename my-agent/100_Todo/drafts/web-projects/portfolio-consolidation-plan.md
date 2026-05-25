# 持倉頁面優化計劃

> 建立：2026-04-28
> 狀態：⬜ 待執行（開新 session 做）
> 對應頁面：`my-agent/400_Projects/web/investor-dashboard/frontend/src/app/portfolio/page.tsx`

---

## 任務 1：相同標的合併 + 加權平均成本

**目標**：同一個 symbol + market 的多筆持倉，在前端合併顯示成一行。

**邏輯（純前端，不動後端）：**
```
合併後數量  = sum(qty_i)
加權平均成本 = sum(qty_i × cost_i) / sum(qty_i)
市值        = current_price × 合併後數量
損益        = (current_price - 加權平均成本) × 合併後數量
報酬率      = (current_price - 加權平均成本) / 加權平均成本 × 100
```

**實作位置：**
- `portfolio/page.tsx` 的 `holdings` state 拿到資料後，在 render 前做 group + reduce
- `HoldingsTable.tsx` 不需要改，資料結構不變

**注意：**
- 合併後的 `id` 可以用 `symbol-market` 當 key（刪除功能需要額外思考，合併後不能刪單筆）
- 或者先不做合併列的刪除，改成「展開/收合」子列（進階，可選）

---

## 任務 2：台股 → 美股 → Crypto 排序

**目標**：holdings 列表固定按市場順序排列，同市場內按代碼字母排序。

**邏輯（純前端）：**
```typescript
const MARKET_ORDER = { tw: 0, us: 1, crypto: 2 }

holdings.sort((a, b) =>
  MARKET_ORDER[a.market] - MARKET_ORDER[b.market] ||
  a.symbol.localeCompare(b.symbol)
)
```

**實作位置：**
- `portfolio/page.tsx` 合併邏輯之後、傳進 `HoldingsTable` 之前

---

## 執行順序

1. 先做排序（2 行，最簡單）
2. 再做合併（需要 groupBy + reduce，約 10-15 行）
3. 確認 Summary Card（台股/美股/Crypto 分欄市值）數字是否正確反映合併後的結果

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `frontend/src/app/portfolio/page.tsx` | 主要修改位置 |
| `frontend/src/components/portfolio/HoldingsTable.tsx` | 不需改，確認 key 用 symbol-market 即可 |
| `backend/routers/portfolio.py` | 不需改 |
