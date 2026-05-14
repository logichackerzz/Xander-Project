from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import WatchlistItem
from pydantic import BaseModel
import yfinance as yf
import math

router = APIRouter(tags=["watchlist"])


def _safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return None


class AddWatchlistRequest(BaseModel):
    symbol: str
    name: str
    market: str = "us"


@router.get("")
def get_watchlist(db: Session = Depends(get_db)):
    items = db.query(WatchlistItem).all()
    result = []
    for item in items:
        REC_MAP = {
            "strong_buy": "強力買入", "strongbuy": "強力買入", "buy": "買入",
            "hold": "持有", "sell": "賣出",
            "strong_sell": "強力賣出", "strongsell": "強力賣出",
        }
        recommendation = None
        try:
            info = yf.Ticker(item.symbol).info
            price = _safe(info.get("regularMarketPrice") or info.get("currentPrice"))
            prev = _safe(info.get("regularMarketPreviousClose") or info.get("previousClose"))
            change_pct = round((price - prev) / prev * 100, 2) if price and prev else None
            rec_key = (info.get("recommendationKey") or "").lower()
            if not rec_key:
                rec_mean = _safe(info.get("recommendationMean"))
                if rec_mean is not None:
                    if rec_mean <= 1.5:   rec_key = "strongbuy"
                    elif rec_mean <= 2.5: rec_key = "buy"
                    elif rec_mean <= 3.5: rec_key = "hold"
                    elif rec_mean <= 4.5: rec_key = "sell"
                    else:                 rec_key = "strongsell"
            recommendation = REC_MAP.get(rec_key, None)
        except Exception:
            price = None
            change_pct = None
        result.append({
            "symbol": item.symbol,
            "name": item.name,
            "market": item.market,
            "price": price,
            "change_pct": change_pct,
            "recommendation": recommendation,
        })
    return result


@router.post("")
def add_to_watchlist(req: AddWatchlistRequest, db: Session = Depends(get_db)):
    sym = req.symbol.upper()
    existing = db.query(WatchlistItem).filter(WatchlistItem.symbol == sym).first()
    if existing:
        return {"symbol": existing.symbol, "name": existing.name, "market": existing.market}
    item = WatchlistItem(symbol=sym, name=req.name, market=req.market)
    db.add(item)
    db.commit()
    return {"symbol": item.symbol, "name": item.name, "market": item.market}


@router.delete("/{symbol}")
def remove_from_watchlist(symbol: str, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(WatchlistItem.symbol == symbol.upper()).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
