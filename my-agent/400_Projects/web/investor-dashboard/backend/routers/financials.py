from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd
import math

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
        ticker = yf.Ticker(symbol.upper())
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

        return {
            "symbol": symbol.upper(),
            "name": info.get("longName") or info.get("shortName", symbol.upper()),
            "price": price,
            "change_pct": change_pct,
            "currency": info.get("currency", "USD"),
            "market_cap": market_cap,
            "week52_high": week52_high,
            "week52_low":  week52_low,
            "sector":      sector,
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


@router.get("/{symbol}/income-statement")
def get_income_statement(symbol: str, period: str = "quarterly", count: int = 8):
    try:
        ticker = yf.Ticker(symbol.upper())
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
        ticker = yf.Ticker(symbol.upper())
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
        ticker = yf.Ticker(symbol.upper())
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
