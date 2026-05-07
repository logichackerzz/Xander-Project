from fastapi import APIRouter
from datetime import date, timedelta
from typing import Optional
import yfinance as yf

router = APIRouter()

# ── 2026 FOMC 會議日期（Fed 官方公告，取會議結束日）──
FOMC_2026 = [
    "2026-01-29", "2026-03-19", "2026-05-07",
    "2026-06-18", "2026-07-30", "2026-09-17",
    "2026-10-29", "2026-12-10",
]

# ── 2026 美國重要經濟數據公告（BLS / BEA 官方行事曆）──
MACRO_EVENTS: list[dict] = [
    # CPI
    {"date": "2026-01-14", "type": "macro", "title": "CPI（12 月）",     "prev": "2.7%",  "forecast": "2.8%",  "unit": "YoY"},
    {"date": "2026-02-11", "type": "macro", "title": "CPI（1 月）",      "prev": "2.9%",  "forecast": "2.9%",  "unit": "YoY"},
    {"date": "2026-03-11", "type": "macro", "title": "CPI（2 月）",      "prev": "3.0%",  "forecast": "2.9%",  "unit": "YoY"},
    {"date": "2026-04-10", "type": "macro", "title": "CPI（3 月）",      "prev": "2.8%",  "forecast": "2.7%",  "unit": "YoY"},
    {"date": "2026-05-13", "type": "macro", "title": "CPI（4 月）",      "prev": "2.4%",  "forecast": "2.4%",  "unit": "YoY"},
    {"date": "2026-06-10", "type": "macro", "title": "CPI（5 月）",      "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-07-14", "type": "macro", "title": "CPI（6 月）",      "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-08-12", "type": "macro", "title": "CPI（7 月）",      "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-09-09", "type": "macro", "title": "CPI（8 月）",      "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-10-14", "type": "macro", "title": "CPI（9 月）",      "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-11-12", "type": "macro", "title": "CPI（10 月）",     "prev": None,    "forecast": None,    "unit": "YoY"},
    {"date": "2026-12-10", "type": "macro", "title": "CPI（11 月）",     "prev": None,    "forecast": None,    "unit": "YoY"},
    # 非農就業
    {"date": "2026-01-09", "type": "macro", "title": "非農就業（12 月）", "prev": "256K",  "forecast": "160K",  "unit": "人"},
    {"date": "2026-02-06", "type": "macro", "title": "非農就業（1 月）",  "prev": "143K",  "forecast": "170K",  "unit": "人"},
    {"date": "2026-03-06", "type": "macro", "title": "非農就業（2 月）",  "prev": "151K",  "forecast": "160K",  "unit": "人"},
    {"date": "2026-04-03", "type": "macro", "title": "非農就業（3 月）",  "prev": "151K",  "forecast": "140K",  "unit": "人"},
    {"date": "2026-05-08", "type": "macro", "title": "非農就業（4 月）",  "prev": "228K",  "forecast": "138K",  "unit": "人"},
    {"date": "2026-06-05", "type": "macro", "title": "非農就業（5 月）",  "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-07-10", "type": "macro", "title": "非農就業（6 月）",  "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-08-07", "type": "macro", "title": "非農就業（7 月）",  "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-09-04", "type": "macro", "title": "非農就業（8 月）",  "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-10-02", "type": "macro", "title": "非農就業（9 月）",  "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-11-06", "type": "macro", "title": "非農就業（10 月）", "prev": None,    "forecast": None,    "unit": "人"},
    {"date": "2026-12-04", "type": "macro", "title": "非農就業（11 月）", "prev": None,    "forecast": None,    "unit": "人"},
    # PCE
    {"date": "2026-01-30", "type": "macro", "title": "PCE 物價指數（12 月）", "prev": "2.6%", "forecast": "2.6%", "unit": "YoY"},
    {"date": "2026-02-27", "type": "macro", "title": "PCE 物價指數（1 月）",  "prev": "2.6%", "forecast": "2.5%", "unit": "YoY"},
    {"date": "2026-03-27", "type": "macro", "title": "PCE 物價指數（2 月）",  "prev": "2.5%", "forecast": "2.5%", "unit": "YoY"},
    {"date": "2026-04-30", "type": "macro", "title": "PCE 物價指數（3 月）",  "prev": "2.5%", "forecast": None,   "unit": "YoY"},
    {"date": "2026-05-29", "type": "macro", "title": "PCE 物價指數（4 月）",  "prev": None,   "forecast": None,   "unit": "YoY"},
    {"date": "2026-06-26", "type": "macro", "title": "PCE 物價指數（5 月）",  "prev": None,   "forecast": None,   "unit": "YoY"},
    # GDP
    {"date": "2026-01-30", "type": "macro", "title": "GDP（Q4 2025 初值）", "prev": "3.1%", "forecast": "2.5%", "unit": "QoQ ann."},
    {"date": "2026-04-30", "type": "macro", "title": "GDP（Q1 2026 初值）", "prev": "2.4%", "forecast": None,   "unit": "QoQ ann."},
    {"date": "2026-07-30", "type": "macro", "title": "GDP（Q2 2026 初值）", "prev": None,   "forecast": None,   "unit": "QoQ ann."},
    {"date": "2026-10-29", "type": "macro", "title": "GDP（Q3 2026 初值）", "prev": None,   "forecast": None,   "unit": "QoQ ann."},
]

# 加入 FOMC
for d in FOMC_2026:
    MACRO_EVENTS.append({
        "date": d,
        "type": "fomc",
        "title": "FOMC 利率決議",
        "prev": None,
        "forecast": None,
        "unit": "Fed Funds Rate",
    })

# ── 熱門股票財報日期（yfinance 免費抓）──
TRACKED_EARNINGS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "TSLA",
    "GOOG", "META", "AMD", "INTC", "NFLX",
]

def _fetch_earnings(symbols: list[str]) -> list[dict]:
    events = []
    for sym in symbols:
        try:
            info = yf.Ticker(sym).calendar
            if info is None:
                continue
            # yfinance returns dict with 'Earnings Date' as list of Timestamps
            dates = info.get("Earnings Date") or []
            for ts in dates[:2]:  # 最多取近 2 筆
                try:
                    d = ts.date() if hasattr(ts, "date") else date.fromisoformat(str(ts)[:10])
                    events.append({
                        "date": str(d),
                        "type": "earnings",
                        "title": f"{sym} 財報公布",
                        "prev": None,
                        "forecast": None,
                        "unit": "EPS",
                    })
                except Exception:
                    pass
        except Exception:
            pass
    return events


@router.get("/events")
def get_events(year: int = 2026, month: Optional[int] = None, tickers: str = ""):
    watchlist_syms = {t.strip().upper() for t in tickers.split(",") if t.strip()}
    earnings = _fetch_earnings(TRACKED_EARNINGS)
    all_events = MACRO_EVENTS + earnings

    if month:
        prefix = f"{year}-{month:02d}"
        filtered = [dict(e) for e in all_events if e["date"].startswith(prefix)]
    else:
        prefix = str(year)
        filtered = [dict(e) for e in all_events if e["date"].startswith(prefix)]

    for e in filtered:
        if e["type"] == "earnings" and watchlist_syms:
            sym = e["title"].split(" ")[0]
            e["is_watchlist"] = sym in watchlist_syms
        else:
            e["is_watchlist"] = False

    filtered.sort(key=lambda e: e["date"])
    return {"events": filtered}


@router.get("/upcoming")
def get_upcoming(days: int = 14):
    today = date.today()
    end = today + timedelta(days=days)
    earnings = _fetch_earnings(TRACKED_EARNINGS)
    all_events = MACRO_EVENTS + earnings
    upcoming = [
        e for e in all_events
        if today.isoformat() <= e["date"] <= end.isoformat()
    ]
    upcoming.sort(key=lambda e: e["date"])
    return {"events": upcoming[:10]}
