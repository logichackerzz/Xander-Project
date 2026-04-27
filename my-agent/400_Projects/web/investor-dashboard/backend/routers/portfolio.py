import uuid
import httpx
import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["portfolio"])

_holdings: list[dict] = []

MARKET_SUFFIX = {"tw": ".TW", "us": "", "crypto": "-USD"}

# 台股中文名稱快取（啟動後首次查詢時載入，之後不再重複打 API）
_tw_cache: dict[str, str] = {}
_tw_cache_loaded = False

async def _load_tw_cache() -> None:
    global _tw_cache, _tw_cache_loaded
    if _tw_cache_loaded:
        return
    # 同時抓：上市公司、上市 ETF、上櫃公司
    urls = [
        "https://openapi.twse.com.tw/v1/opendata/t187ap03_L",  # 上市公司
        "https://openapi.twse.com.tw/v1/opendata/t187ap04_L",  # 上市 ETF
        "https://openapi.twse.com.tw/v1/opendata/t187ap05_L",  # 上市 ETN/其他
    ]
    merged: dict[str, str] = {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in urls:
                try:
                    r = await client.get(url)
                    data = r.json()
                    for c in data:
                        code = c.get("公司代號") or c.get("證券代號", "")
                        name = c.get("公司簡稱") or c.get("證券名稱") or c.get("公司名稱", "")
                        if code and name:
                            merged[code] = name
                except Exception:
                    continue
        _tw_cache = merged
        _tw_cache_loaded = True
    except Exception:
        pass


@router.get("/lookup")
async def lookup_symbol(symbol: str, market: str):
    """輸入代碼 → 回傳公司中文/英文名稱，給前端自動填入用"""
    if market == "crypto":
        return {"name": "", "found": False}

    if market == "tw":
        await _load_tw_cache()
        name = _tw_cache.get(symbol.upper(), "")
        if not name:
            # TWSE 沒收錄（ETF / 上櫃），改走 Yahoo Finance search API
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    r = await client.get(
                        f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol.upper()}.TW",
                        headers={"User-Agent": "Mozilla/5.0"},
                    )
                    quotes = r.json().get("quotes", [])
                    match = next((q for q in quotes if q.get("symbol") == f"{symbol.upper()}.TW"), None)
                    if match:
                        name = match.get("longname") or match.get("shortname") or ""
            except Exception:
                name = ""
        return {"name": name, "found": bool(name)}

    if market == "us":
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(
                    f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                data = r.json()
                name = data["chart"]["result"][0]["meta"].get("shortName", "")
                return {"name": name, "found": bool(name)}
        except Exception:
            return {"name": "", "found": False}

    return {"name": "", "found": False}


def build_yf_symbol(raw: str, market: str) -> str:
    return raw.upper() + MARKET_SUFFIX.get(market, "")


class HoldingCreate(BaseModel):
    symbol: str
    market: str       # "tw" | "us" | "crypto"
    name: str
    quantity: float
    cost_per_unit: float


@router.get("/holdings")
def get_holdings():
    if not _holdings:
        return []

    prices: dict[str, float | None] = {}
    for h in _holdings:
        sym = h["yf_symbol"]
        if sym in prices:
            continue
        try:
            fi = yf.Ticker(sym).fast_info
            prices[sym] = fi.last_price or fi.previous_close or None
        except Exception:
            prices[sym] = None

    result = []
    for h in _holdings:
        price = prices.get(h["yf_symbol"])
        cost = h["cost_per_unit"]
        qty = h["quantity"]

        market_value = price * qty if price else None
        pnl = (price - cost) * qty if price else None
        pnl_pct = (price - cost) / cost * 100 if price and cost > 0 else None

        result.append({
            **h,
            "current_price": price,
            "market_value": market_value,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
        })

    return result


@router.post("/holdings", status_code=201)
def add_holding(body: HoldingCreate):
    yf_symbol = build_yf_symbol(body.symbol, body.market)

    try:
        fi = yf.Ticker(yf_symbol).fast_info
        price = fi.last_price or fi.previous_close
        if not price or price <= 0:
            raise ValueError("price not found")
    except ValueError:
        raise HTTPException(400, detail=f"找不到代碼「{yf_symbol}」，請確認市場與代碼是否正確")
    except Exception:
        raise HTTPException(400, detail=f"驗證失敗，請稍後重試")

    holding = {
        "id": str(uuid.uuid4()),
        "symbol": body.symbol.upper(),
        "yf_symbol": yf_symbol,
        "market": body.market,
        "name": body.name or body.symbol.upper(),
        "quantity": body.quantity,
        "cost_per_unit": body.cost_per_unit,
    }
    _holdings.append(holding)
    return holding


@router.delete("/holdings/{holding_id}")
def delete_holding(holding_id: str):
    global _holdings
    before = len(_holdings)
    _holdings = [h for h in _holdings if h["id"] != holding_id]
    if len(_holdings) == before:
        raise HTTPException(404, detail="找不到此持倉")
    return {"ok": True}
