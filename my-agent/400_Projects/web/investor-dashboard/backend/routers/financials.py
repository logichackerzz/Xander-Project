from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd
import math
import requests as _req
import time as _time
from datetime import datetime, timedelta

_INST_CACHE: dict = {}
_TWSE_HEADERS = {"User-Agent": "Mozilla/5.0"}

def _last_trading_dates_fin(n=5):
    dates, d = [], datetime.today()
    while len(dates) < n:
        if d.weekday() < 5:
            dates.append(d.strftime("%Y%m%d"))
        d -= timedelta(days=1)
    return dates

def _is_tw(symbol: str) -> bool:
    s = symbol.upper()
    if s.endswith(".TW") or s.endswith(".TWO"):
        return True
    code = s.replace(".TW", "").replace(".TWO", "")
    return code.isdigit() and len(code) in (4, 5, 6)

def _tw_code(symbol: str) -> str:
    return symbol.upper().replace(".TW", "").replace(".TWO", "")

def _to_yf_symbol(symbol: str) -> str:
    """補齊 yfinance 用的 .TW suffix（純數字台股代碼）"""
    s = symbol.upper()
    if _is_tw(s) and not s.endswith(".TW") and not s.endswith(".TWO"):
        return s + ".TW"
    return s

router = APIRouter(tags=["financials"])


def _safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return None


def _b(val):
    v = _safe(val)
    return round(v / 1e9, 3) if v is not None else None


@router.get("/{symbol}/overview")
def get_overview(symbol: str):
    try:
        ticker = yf.Ticker(_to_yf_symbol(symbol))
        info = ticker.info

        price = _safe(info.get("regularMarketPrice") or info.get("currentPrice"))
        if price is None:
            raise HTTPException(status_code=404, detail=f"找不到股票代碼 {symbol.upper()}")

        prev_close = _safe(info.get("regularMarketPreviousClose") or info.get("previousClose"))
        change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else None

        latest_revenue = None
        revenue_yoy_pct = None
        net_margin_pct = None

        try:
            qf = ticker.quarterly_financials
            if qf is not None and not qf.empty:
                cols = sorted(qf.columns, reverse=True)

                if "Total Revenue" in qf.index:
                    rev = qf.loc["Total Revenue"]
                    rev_vals = [_safe(rev[c]) for c in cols if _safe(rev.get(c)) is not None]
                    if rev_vals:
                        latest_revenue = rev_vals[0]
                    if len(rev_vals) >= 5:
                        prev = rev_vals[4]
                        if prev and prev != 0:
                            revenue_yoy_pct = round((latest_revenue / prev - 1) * 100, 1)

                if "Total Revenue" in qf.index and "Net Income" in qf.index:
                    r = _safe(qf.loc["Total Revenue", cols[0]]) if cols else None
                    n = _safe(qf.loc["Net Income", cols[0]]) if cols else None
                    if r and r != 0 and n is not None:
                        net_margin_pct = round(n / r * 100, 1)
        except Exception:
            pass

        roe_raw = _safe(info.get("returnOnEquity"))
        roe_pct = round(roe_raw * 100, 1) if roe_raw is not None else None

        gm_raw = _safe(info.get("grossMargins"))
        snap_gm = round(gm_raw * 100, 1) if gm_raw is not None else None

        market_cap = _safe(info.get("marketCap"))
        week52_high = _safe(info.get("fiftyTwoWeekHigh"))
        week52_low  = _safe(info.get("fiftyTwoWeekLow"))
        sector      = info.get("sector") or info.get("industryDisp") or None

        volume     = _safe(info.get("volume") or info.get("regularMarketVolume"))
        avg_volume = _safe(info.get("averageVolume") or info.get("averageVolume10days"))
        vol_ratio  = round(volume / avg_volume, 2) if volume and avg_volume else None
        beta       = _safe(info.get("beta"))

        rsi_val = None
        try:
            hist = ticker.history(period="3mo")
            if len(hist) >= 15:
                delta = hist["Close"].diff()
                gain  = delta.where(delta > 0, 0.0).rolling(14).mean()
                loss  = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
                rs    = gain / loss
                rsi_val = round(float((100 - 100 / (1 + rs)).iloc[-1]), 1)
        except Exception:
            pass

        return {
            "symbol": symbol.upper(),
            "name": info.get("longName") or info.get("shortName", symbol.upper()),
            "quote_type": info.get("quoteType", "EQUITY"),
            "price": price,
            "change_pct": change_pct,
            "currency": info.get("currency", "USD"),
            "market_cap": market_cap,
            "week52_high": week52_high,
            "week52_low":  week52_low,
            "sector":      sector,
            "volume":      volume,
            "avg_volume":  avg_volume,
            "vol_ratio":   vol_ratio,
            "beta":        beta,
            "rsi":         rsi_val,
            "kpi": {
                "revenue_b": _b(latest_revenue),
                "revenue_yoy_pct": revenue_yoy_pct,
                "net_margin_pct": net_margin_pct,
                "roe_pct": roe_pct,
            },
            "snap": {
                "pe_trailing":      _safe(info.get("trailingPE")),
                "debt_to_equity":   _safe(info.get("debtToEquity")),
                "fcf_b":            _b(_safe(info.get("freeCashflow"))),
                "gross_margin_pct": snap_gm,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/price-history")
def get_price_history(symbol: str, period: str = "1y"):
    try:
        allowed = {"1mo", "3mo", "6mo", "1y", "2y", "5y"}
        if period not in allowed:
            period = "1y"
        ticker = yf.Ticker(_to_yf_symbol(symbol))
        hist = ticker.history(period=period, interval="1d")
        if hist is None or hist.empty:
            raise HTTPException(status_code=404, detail="無歷史資料")
        result = []
        for ts, row in hist.iterrows():
            o = _safe(row.get("Open"))
            h = _safe(row.get("High"))
            l = _safe(row.get("Low"))
            c = _safe(row.get("Close"))
            v = _safe(row.get("Volume"))
            if c is None:
                continue
            result.append({
                "date":   ts.strftime("%Y-%m-%d"),
                "open":   round(o, 2) if o else c,
                "high":   round(h, 2) if h else c,
                "low":    round(l, 2) if l else c,
                "close":  round(c, 2),
                "volume": int(v) if v else 0,
            })
        return {"symbol": symbol.upper(), "period": period, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/income-statement")
def get_income_statement(symbol: str, period: str = "quarterly", count: int = 8):
    try:
        ticker = yf.Ticker(_to_yf_symbol(symbol))
        df = ticker.quarterly_financials if period == "quarterly" else ticker.financials

        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="無財報資料")

        cols = sorted(df.columns)[-count:]

        result = []
        for col in cols:
            if period == "quarterly":
                q = (col.month - 1) // 3 + 1
                label = f"{col.year}-Q{q}"
            else:
                label = str(col.year)

            entry: dict = {"period": label}
            for row, key in [
                ("Total Revenue", "revenue"),
                ("Net Income", "net_income"),
                ("Gross Profit", "gross_profit"),
                ("Operating Income", "operating_income"),
            ]:
                entry[key] = _b(_safe(df.loc[row, col])) if row in df.index else None

            r, n = entry.get("revenue"), entry.get("net_income")
            entry["net_margin"] = round(n / r * 100, 1) if r and n is not None and r != 0 else None
            result.append(entry)

        return {"symbol": symbol.upper(), "period": period, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/health")
def get_health(symbol: str, period: str = "quarterly", count: int = 8):
    try:
        ticker = yf.Ticker(_to_yf_symbol(symbol))
        info = ticker.info

        debt_to_equity = _safe(info.get("debtToEquity"))

        cf  = ticker.quarterly_cashflow  if period == "quarterly" else ticker.cashflow
        fin = ticker.quarterly_financials if period == "quarterly" else ticker.financials

        series = []

        if cf is not None and not cf.empty:
            cf_cols = sorted(cf.columns)[-count:]

            for col in cf_cols:
                if period == "quarterly":
                    q = (col.month - 1) // 3 + 1
                    label = f"{col.year}-Q{q}"
                else:
                    label = str(col.year)

                entry: dict = {"period": label}

                # FCF: try direct row first, fallback to OCF - CapEx
                fcf = None
                if "Free Cash Flow" in cf.index:
                    fcf = _safe(cf.loc["Free Cash Flow", col])
                if fcf is None:
                    ocf   = _safe(cf.loc["Operating Cash Flow", col]) if "Operating Cash Flow" in cf.index else None
                    capex = _safe(cf.loc["Capital Expenditure",  col]) if "Capital Expenditure"  in cf.index else None
                    if ocf is not None and capex is not None:
                        fcf = ocf + capex   # capex stored as negative → OCF - |CapEx|
                    elif ocf is not None:
                        fcf = ocf

                entry["fcf"] = _b(fcf)

                # Gross margin from income statement
                gross_margin = None
                if fin is not None and not fin.empty and col in fin.columns:
                    gp  = _safe(fin.loc["Gross Profit",   col]) if "Gross Profit"   in fin.index else None
                    rev = _safe(fin.loc["Total Revenue",  col]) if "Total Revenue"  in fin.index else None
                    if gp is not None and rev and rev != 0:
                        gross_margin = round(gp / rev * 100, 1)

                entry["gross_margin"] = gross_margin
                series.append(entry)

        latest = series[-1] if series else {}

        roe_raw = _safe(info.get("returnOnEquity"))
        roe_pct = round(roe_raw * 100, 1) if roe_raw is not None else None

        return {
            "symbol": symbol.upper(),
            "period": period,
            "snapshot": {
                "fcf_b":            latest.get("fcf"),
                "gross_margin_pct": latest.get("gross_margin"),
                "debt_to_equity":   debt_to_equity,
                "roe_pct":          roe_pct,
            },
            "data": series,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/valuation")
def get_valuation(symbol: str, count: int = 8):
    try:
        ticker = yf.Ticker(_to_yf_symbol(symbol))
        info   = ticker.info

        pe_trailing = _safe(info.get("trailingPE"))
        pe_forward  = _safe(info.get("forwardPE"))
        ps          = _safe(info.get("priceToSalesTrailing12Months") or info.get("priceToSalesTrailingTwelveMonths"))
        pb          = _safe(info.get("priceToBook"))
        ev_ebitda   = _safe(info.get("enterpriseToEbitda"))

        # Historical quarterly P/E  ─────────────────────────────────
        pe_history: list = []
        try:
            shares = _safe(info.get("sharesOutstanding") or info.get("impliedSharesOutstanding"))
            qf     = ticker.quarterly_financials
            hist   = ticker.history(period="3y", interval="1d")

            if (shares and shares > 0
                    and qf is not None and not qf.empty
                    and "Net Income" in qf.index
                    and hist is not None and not hist.empty):

                if hist.index.tzinfo:
                    hist = hist.copy()
                    hist.index = hist.index.tz_localize(None)

                ni_cols = sorted(qf.columns)

                for col in ni_cols[-count:]:
                    q     = (col.month - 1) // 3 + 1
                    label = f"{col.year}-Q{q}"

                    trailing = [c for c in ni_cols if c <= col][-4:]
                    ttm_ni   = sum((_safe(qf.loc["Net Income", c]) or 0) for c in trailing)

                    if ttm_ni and ttm_ni > 0:
                        eps_ttm  = ttm_ni / shares
                        col_ts   = pd.Timestamp(col.year, col.month, col.day)
                        mask     = hist.index <= col_ts
                        if mask.any():
                            price_at = float(hist.loc[hist.index[mask][-1], "Close"])
                            pe_val   = round(price_at / eps_ttm, 1)
                            pe_history.append({"period": label, "pe": pe_val if 0 < pe_val < 500 else None})
                        else:
                            pe_history.append({"period": label, "pe": None})
                    else:
                        pe_history.append({"period": label, "pe": None})
        except Exception:
            pass

        return {
            "symbol": symbol.upper(),
            "snapshot": {
                "pe_trailing": pe_trailing,
                "pe_forward":  pe_forward,
                "ps":          round(ps, 2) if ps else None,
                "pb":          round(pb, 2) if pb else None,
                "ev_ebitda":   round(ev_ebitda, 2) if ev_ebitda else None,
            },
            "pe_history": pe_history,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 個股法人動向 ─────────────────────────────────────────────────────────────

@router.get("/{symbol}/institutions")
def get_institutions(symbol: str):
    key = f"inst_{symbol.upper()}"
    cached = _INST_CACHE.get(key)
    if cached and _time.time() < cached[1]:
        return cached[0]
    result = _fetch_tw_institutions(symbol) if _is_tw(symbol) else _fetch_us_institutions(symbol)
    _INST_CACHE[key] = (result, _time.time() + 1800)
    return result

def _fmt_shares(n: int) -> str:
    a = abs(n)
    if a >= 1_000_000: return f"{a/1_000_000:.1f}M 股"
    if a >= 1_000:     return f"{a/1_000:.0f}K 股"
    return f"{a:,} 股"

def _fetch_tw_institutions(symbol: str):
    code = _tw_code(symbol)
    for date_str in _last_trading_dates_fin(5):
        try:
            url  = f"https://www.twse.com.tw/rwd/zh/fund/T86?date={date_str}&selectType=ALLBUT0999&response=json"
            rows = _req.get(url, timeout=10, headers=_TWSE_HEADERS).json().get("data", [])
            if not rows:
                continue
            for row in rows:
                if str(row[0]).strip() != code:
                    continue
                def pn(s):
                    try: return int(str(s).replace(",", ""))
                    except: return 0
                foreign_net = pn(row[4])
                trust_net   = pn(row[10])
                diverge = (foreign_net > 0 and trust_net < 0) or (foreign_net < 0 and trust_net > 0)
                return {
                    "type": "tw",
                    "date": date_str,
                    "foreign": {
                        "net": foreign_net,
                        "direction": "買超" if foreign_net > 0 else "賣超" if foreign_net < 0 else "持平",
                        "display": _fmt_shares(foreign_net),
                    },
                    "trust": {
                        "net": trust_net,
                        "direction": "買超" if trust_net > 0 else "賣超" if trust_net < 0 else "持平",
                        "display": _fmt_shares(trust_net),
                    },
                    "diverge": diverge,
                }
        except Exception:
            continue
    return {"type": "tw", "error": "暫無資料"}

def _fetch_us_institutions(symbol: str):
    try:
        ticker = yf.Ticker(symbol.upper())
        expirations = ticker.options
        if not expirations:
            return {"type": "us", "error": "無期權資料"}

        expiry = expirations[0]
        chain  = ticker.option_chain(expiry)
        calls, puts = chain.calls, chain.puts

        call_oi = int(calls["openInterest"].fillna(0).sum())
        put_oi  = int(puts["openInterest"].fillna(0).sum())
        pc_ratio = round(put_oi / call_oi, 2) if call_oi > 0 else None

        info  = ticker.info
        price = _safe(info.get("regularMarketPrice") or info.get("currentPrice"))
        atm_iv = None
        if price is not None and not calls.empty:
            idx = (calls["strike"] - price).abs().idxmin()
            iv  = calls.loc[idx, "impliedVolatility"]
            if iv is not None:
                atm_iv = round(float(iv) * 100, 1)

        if pc_ratio is not None:
            if pc_ratio > 1.2:   pc_label, pc_cls = "偏空", "red"
            elif pc_ratio < 0.8: pc_label, pc_cls = "偏多", "green"
            else:                pc_label, pc_cls = "中立", "neutral"
        else:
            pc_label, pc_cls = None, "neutral"

        return {
            "type":     "us",
            "expiry":   expiry,
            "call_oi":  call_oi,
            "put_oi":   put_oi,
            "pc_ratio": pc_ratio,
            "pc_label": pc_label,
            "pc_cls":   pc_cls,
            "atm_iv":   atm_iv,
        }
    except Exception:
        return {"type": "us", "error": "暫無資料"}
