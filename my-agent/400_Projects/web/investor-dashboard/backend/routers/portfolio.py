import uuid
import httpx
import yfinance as yf
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Holding

router = APIRouter(tags=["portfolio"])

MARKET_SUFFIX = {"tw": ".TW", "us": "", "crypto": "-USD"}

_tw_cache: dict[str, str] = {}
_tw_cache_loaded = False


async def _load_tw_cache() -> None:
    global _tw_cache, _tw_cache_loaded
    if _tw_cache_loaded:
        return
    urls = [
        "https://openapi.twse.com.tw/v1/opendata/t187ap03_L",
        "https://openapi.twse.com.tw/v1/opendata/t187ap04_L",
        "https://openapi.twse.com.tw/v1/opendata/t187ap05_L",
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
    if market == "crypto":
        return {"name": "", "found": False}

    if market == "tw":
        await _load_tw_cache()
        name = _tw_cache.get(symbol.upper(), "")
        if not name:
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


_TW_POPULAR = {
    "2330", "2317", "2454", "2881", "2882", "2886", "2303", "2412",
    "1301", "1303", "2308", "2002", "3008", "2357", "6505", "2382",
    "2395", "3711", "4938", "2379", "2609", "1216", "2207", "5871",
    "2884", "2885", "2891", "2892", "2883", "2887", "0050", "0056",
    "00878", "00940",
}


@router.get("/search")
async def search_symbols(q: str, market: str, limit: int = 8):
    q = q.strip()
    if len(q) < 1:
        return []

    if market == "tw":
        await _load_tw_cache()
        q_upper = q.upper()
        matches = []
        for code, name in _tw_cache.items():
            code_match = code.startswith(q_upper)
            name_match = q in name
            if not code_match and not name_match:
                continue
            score = 100 if code in _TW_POPULAR else 0
            if code_match:
                score += 50
            if name.startswith(q):
                score += 30
            elif name_match:
                score += 10
            matches.append({"symbol": code, "name": name, "score": score})
        matches.sort(key=lambda x: (-x["score"], x["symbol"]))
        return [{"symbol": m["symbol"], "name": m["name"]} for m in matches[:limit]]

    if market == "us":
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(
                    f"https://query2.finance.yahoo.com/v1/finance/search?q={q}&lang=en-US&type=equity&count={limit}",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                quotes = r.json().get("quotes", [])
                results = []
                for quote in quotes:
                    sym = quote.get("symbol", "")
                    name = quote.get("longname") or quote.get("shortname") or ""
                    quote_type = quote.get("quoteType", "")
                    if (sym and name
                            and "." not in sym
                            and "-" not in sym
                            and quote_type not in ("CRYPTOCURRENCY", "CURRENCY")):
                        results.append({"symbol": sym, "name": name})
                    if len(results) >= limit:
                        break
                return results
        except Exception:
            return []

    return []


def build_yf_symbol(raw: str, market: str) -> str:
    return raw.upper() + MARKET_SUFFIX.get(market, "")


class HoldingCreate(BaseModel):
    symbol: str
    market: str
    name: str
    quantity: float
    cost_per_unit: float


def _fetch_prices(yf_symbols: list[str]) -> dict[str, float | None]:
    prices: dict[str, float | None] = {}
    for sym in yf_symbols:
        if sym in prices:
            continue
        try:
            fi = yf.Ticker(sym).fast_info
            prices[sym] = fi.last_price or fi.previous_close or None
        except Exception:
            prices[sym] = None
    return prices


@router.get("/holdings")
def get_holdings(db: Session = Depends(get_db)):
    rows = db.query(Holding).all()
    if not rows:
        return []

    prices = _fetch_prices([h.yf_symbol for h in rows])

    result = []
    for h in rows:
        price = prices.get(h.yf_symbol)
        cost = h.cost_per_unit
        qty = h.quantity

        market_value = price * qty if price else None
        pnl = (price - cost) * qty if price else None
        pnl_pct = (price - cost) / cost * 100 if price and cost > 0 else None

        result.append({
            "id": h.id,
            "symbol": h.symbol,
            "yf_symbol": h.yf_symbol,
            "market": h.market,
            "name": h.name,
            "quantity": h.quantity,
            "cost_per_unit": h.cost_per_unit,
            "current_price": price,
            "market_value": market_value,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
        })

    return result


@router.post("/holdings", status_code=201)
def add_holding(body: HoldingCreate, db: Session = Depends(get_db)):
    yf_symbol = build_yf_symbol(body.symbol, body.market)

    try:
        fi = yf.Ticker(yf_symbol).fast_info
        price = fi.last_price or fi.previous_close
        if not price or price <= 0:
            raise ValueError("price not found")
    except ValueError:
        raise HTTPException(400, detail=f"找不到代碼「{yf_symbol}」，請確認市場與代碼是否正確")
    except Exception:
        raise HTTPException(400, detail="驗證失敗，請稍後重試")

    holding = Holding(
        id=str(uuid.uuid4()),
        symbol=body.symbol.upper(),
        yf_symbol=yf_symbol,
        market=body.market,
        name=body.name or body.symbol.upper(),
        quantity=body.quantity,
        cost_per_unit=body.cost_per_unit,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {
        "id": holding.id,
        "symbol": holding.symbol,
        "yf_symbol": holding.yf_symbol,
        "market": holding.market,
        "name": holding.name,
        "quantity": holding.quantity,
        "cost_per_unit": holding.cost_per_unit,
    }


class CloseBody(BaseModel):
    sell_quantity: float
    sell_price: float


@router.post("/holdings/{holding_id}/close")
def close_holding(holding_id: str, body: CloseBody, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(404, detail="找不到此持倉")
    if body.sell_quantity <= 0 or body.sell_quantity > holding.quantity + 1e-9:
        raise HTTPException(400, detail="賣出數量超過持倉或無效")

    realized_pnl = (body.sell_price - holding.cost_per_unit) * body.sell_quantity
    remaining = holding.quantity - body.sell_quantity

    if remaining < 1e-9:
        db.delete(holding)
        db.commit()
        return {"deleted": True, "realized_pnl": realized_pnl, "remaining_quantity": 0}

    holding.quantity = remaining
    db.commit()
    db.refresh(holding)
    return {"deleted": False, "realized_pnl": realized_pnl, "remaining_quantity": remaining}


@router.delete("/holdings/{holding_id}")
def delete_holding(holding_id: str, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(404, detail="找不到此持倉")
    db.delete(holding)
    db.commit()
    return {"ok": True}
