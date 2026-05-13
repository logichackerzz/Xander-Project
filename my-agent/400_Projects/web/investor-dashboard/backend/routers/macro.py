import time as _time
import requests
import yfinance as yf
import pandas as pd
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["macro"])

_BLS     = "https://api.bls.gov/publicAPI/v1/timeseries/data/"
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)"}

# ── 快取 helper ───────────────────────────────────────────────────────────────
_CACHE: dict = {}

def _cached(key: str, ttl: int, fn):
    entry = _CACHE.get(key)
    if entry and _time.time() < entry[1]:
        return entry[0]
    result = fn()
    _CACHE[key] = (result, _time.time() + ttl)
    return result

# ── 共用 helper ───────────────────────────────────────────────────────────────

def _bls_latest(series_id: str):
    """從 BLS 公開 API（v1, 不需 key）取最新一期與去年同期資料"""
    now = datetime.now()
    resp = requests.get(
        f"{_BLS}{series_id}?startyear={now.year - 2}&endyear={now.year}",
        headers=_HEADERS, timeout=10,
    )
    data = resp.json()
    series = data["Results"]["series"][0]["data"]
    latest = series[0]
    prev_year = str(int(latest["year"]) - 1)
    yoy_base = next(
        (d for d in series if d["year"] == prev_year and d["period"] == latest["period"]),
        None,
    )
    return latest, yoy_base

# ── 1. 美債 10 年期殖利率（2 分鐘快取） ──────────────────────────────────────

@router.get("/us10y")
def get_us10y():
    def _fetch():
        hist = yf.Ticker("^TNX").history(period="10d").dropna()
        if len(hist) < 2: raise ValueError("資料不足")
        cur, prev = round(float(hist["Close"].iloc[-1]), 3), round(float(hist["Close"].iloc[-2]), 3)
        chg = round(cur - prev, 3)
        label, tone = ("殖利率攀升","red") if chg>0.02 else ("殖利率回落","green") if chg<-0.02 else ("殖利率持平","neutral")
        return {"value": cur, "unit": "%", "change": chg, "label": label, "tone": tone}
    try:
        return _cached("us10y", 120, _fetch)
    except Exception as e:
        print(f"[us10y] {str(e)[:80]}")
        return None

# ── 2. Fed 利率預期（2 分鐘快取） ──────────────────────────────────────────

@router.get("/fed-rate")
def get_fed_rate():
    def _fetch():
        irx = yf.Ticker("^IRX").history(period="5d").dropna()
        tnx = yf.Ticker("^TNX").history(period="5d").dropna()
        if irx.empty or tnx.empty: raise ValueError("無資料")
        r3m, r10y = round(float(irx["Close"].iloc[-1]),2), round(float(tnx["Close"].iloc[-1]),2)
        spread = round(r3m - r10y, 2)
        if spread > 0.75:   label, tone = "預期降息", "green"
        elif spread > 0.2:  label, tone = "降息預期升溫", "green"
        elif spread > -0.2: label, tone = "高息維持", "neutral"
        else:               label, tone = "高息持續", "red"
        return {"value": r3m, "unit": "%", "spread": spread, "label": label, "tone": tone,
                "note": f"3M-10Y 利差 {spread:+.2f}%"}
    try:
        return _cached("fed-rate", 120, _fetch)
    except Exception as e:
        print(f"[fed-rate] {str(e)[:80]}")
        return None

# ── 3. 核心 CPI 年增率 ────────────────────────────────────────────────────────

@router.get("/core-cpi")
def get_core_cpi():
    def _fetch():
        latest, yoy_base = _bls_latest("CUSR0000SA0L1E")
        val_now = float(latest["value"])
        if not yoy_base: raise ValueError("找不到去年同期")
        yoy = round((val_now - float(yoy_base["value"])) / float(yoy_base["value"]) * 100, 1)
        label, tone = ("通膨降溫","green") if yoy<=2.5 else ("通膨頑強","amber") if yoy<=3.5 else ("通膨頑強","red")
        return {"value": yoy, "unit": "%", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}"}
    try:
        return _cached("core-cpi", 3600, _fetch)
    except Exception as e:
        print(f"[core-cpi] {str(e)[:80]}")
        return None

# ── 4. 美元指數 DXY（2 分鐘快取） ────────────────────────────────────────────

@router.get("/dxy")
def get_dxy():
    def _fetch():
        hist = yf.Ticker("DX-Y.NYB").history(period="10d").dropna()
        if len(hist) < 2: raise ValueError("資料不足")
        cur, prev = round(float(hist["Close"].iloc[-1]),2), round(float(hist["Close"].iloc[-2]),2)
        chg = round(cur - prev, 2)
        label, tone = ("美元走強","red") if chg>0 else ("美元轉弱","green") if chg<0 else ("美元持平","neutral")
        return {"value": cur, "change": chg, "change_pct": round(chg/prev*100,2), "label": label, "tone": tone}
    try:
        return _cached("dxy", 120, _fetch)
    except Exception as e:
        print(f"[dxy] {str(e)[:80]}")
        return None

# ── 5. 美國失業率（1 小時快取，BLS 月更新） ──────────────────────────────────

@router.get("/unemployment")
def get_unemployment():
    def _fetch():
        latest, _ = _bls_latest("LNS14000000")
        val = float(latest["value"])
        label, tone = ("就業強勁","green") if val<4 else ("就業趨緩","amber") if val<5 else ("衰退隱憂","red")
        return {"value": val, "unit": "%", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}"}
    try:
        return _cached("unemployment", 3600, _fetch)
    except Exception as e:
        print(f"[unemployment] {str(e)[:80]}")
        return None

# ── 6. ISM 製造業 PMI ─────────────────────────────────────────────────────────

@router.get("/ism-pmi")
def get_ism_pmi():
    """ISM 製造業 PMI（BLS 製造業就業月增幅代理）
    PMI 外部源均被地區封鎖，以 BLS 製造業就業 MoM 衡量景氣擴張/收縮。
    """
    def _fetch():
        latest, prev = _bls_latest("CES3000000001")
        val_now  = float(latest["value"])
        val_prev = float(prev["value"]) if prev else val_now
        mom      = round(val_now - val_prev, 1)
        label, tone = ("製造業擴張","green") if mom>=20 else ("製造業持平","neutral") if mom>=0 else ("製造業趨緩","amber") if mom>=-20 else ("製造業收縮","red")
        return {"value": mom, "unit": "K", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}"}
    try:
        return _cached("ism-pmi", 3600, _fetch)
    except Exception as e:
        print(f"[ism-pmi] {str(e)[:80]}")
        return None
