import os
import time as _time
import requests
import yfinance as yf
import pandas as pd
from fastapi import APIRouter
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

router = APIRouter(tags=["macro"])

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

def _bls_raw(series_id: str) -> list:
    """BLS API：有 key 走 v2（500次/天），無 key 走 v1（25次/天）"""
    now = datetime.now()
    key = os.getenv("BLS_API_KEY", "").strip()

    if key:
        # v2：POST，額度 500次/天，可抓更長歷史
        url  = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
        body = {
            "seriesid":        [series_id],
            "startyear":       str(now.year - 3),
            "endyear":         str(now.year),
            "registrationkey": key,
        }
        resp = requests.post(url, json=body, headers=_HEADERS, timeout=10)
    else:
        # v1：GET，免費但每 IP 25次/天
        url  = f"https://api.bls.gov/publicAPI/v1/timeseries/data/{series_id}?startyear={now.year - 2}&endyear={now.year}"
        resp = requests.get(url, headers=_HEADERS, timeout=10)

    d = resp.json()
    if d.get("status") != "REQUEST_SUCCEEDED":
        raise ValueError(f"BLS API 失敗: {d.get('status')} {d.get('message', '')}")
    return d["Results"]["series"][0]["data"]

def _yoy(series: list, entry: dict) -> float | None:
    """計算某期的 YoY%（去年同期比較）"""
    base = next((d for d in series
                 if d["year"] == str(int(entry["year"]) - 1)
                 and d["period"] == entry["period"]), None)
    if not base:
        return None
    return round((float(entry["value"]) - float(base["value"])) / float(base["value"]) * 100, 1)

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
        prev_spread = None
        if len(irx) >= 2 and len(tnx) >= 2:
            prev_spread = round(float(irx["Close"].iloc[-2]) - float(tnx["Close"].iloc[-2]), 2)
        if spread > 0.75:   label, tone = "預期降息", "green"
        elif spread > 0.2:  label, tone = "降息預期升溫", "green"
        elif spread > -0.2: label, tone = "高息維持", "neutral"
        else:               label, tone = "高息持續", "red"
        return {"value": r3m, "unit": "%", "spread": spread, "label": label, "tone": tone,
                "note": f"3M-10Y 利差 {spread:+.2f}%", "prev_spread": prev_spread}
    try:
        return _cached("fed-rate", 120, _fetch)
    except Exception as e:
        print(f"[fed-rate] {str(e)[:80]}")
        return None

# ── 3. 核心 CPI 年增率 ────────────────────────────────────────────────────────

@router.get("/core-cpi")
def get_core_cpi():
    def _fetch():
        series = _bls_raw("CUSR0000SA0L1E")
        latest = series[0]
        prev_m = series[1] if len(series) > 1 else None
        yoy = _yoy(series, latest)
        if yoy is None: raise ValueError("找不到去年同期")
        prev_yoy = _yoy(series, prev_m) if prev_m else None
        label, tone = ("通膨降溫","green") if yoy<=2.5 else ("通膨頑強","amber") if yoy<=3.5 else ("通膨頑強","red")
        return {"value": yoy, "unit": "%", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}",
                "prev_value": prev_yoy,
                "prev_period": f"{prev_m['year']}-{prev_m['periodName']}" if prev_m else None}
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
        series = _bls_raw("LNS14000000")
        latest = series[0]
        prev_m = series[1] if len(series) > 1 else None
        val = float(latest["value"])
        prev_val = float(prev_m["value"]) if prev_m else None
        label, tone = ("就業強勁","green") if val<4 else ("就業趨緩","amber") if val<5 else ("衰退隱憂","red")
        return {"value": val, "unit": "%", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}",
                "prev_value": prev_val,
                "prev_period": f"{prev_m['year']}-{prev_m['periodName']}" if prev_m else None}
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
        series   = _bls_raw("CES3000000001")
        latest   = series[0]
        prev     = series[1] if len(series) > 1 else None
        pprev    = series[2] if len(series) > 2 else None
        val_now  = float(latest["value"])
        val_prev = float(prev["value"]) if prev else val_now
        val_pp   = float(pprev["value"]) if pprev else val_prev
        mom      = round(val_now - val_prev, 1)
        prev_mom = round(val_prev - val_pp, 1) if pprev else None
        label, tone = ("製造業擴張","green") if mom>=20 else ("製造業持平","neutral") if mom>=0 else ("製造業趨緩","amber") if mom>=-20 else ("製造業收縮","red")
        return {"value": mom, "unit": "K", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}",
                "prev_value": prev_mom,
                "prev_period": f"{prev['year']}-{prev['periodName']}" if prev else None}
    try:
        return _cached("ism-pmi", 3600, _fetch)
    except Exception as e:
        print(f"[ism-pmi] {str(e)[:80]}")
        return None

# ── 7. PPI 生產者物價指數（年增率） ────────────────────────────────────────────

@router.get("/ppi")
def get_ppi():
    """PPI Final Demand YoY（BLS WPSFD49116），CPI 的上游領先指標"""
    def _fetch():
        series = _bls_raw("WPSFD49116")
        latest = series[0]
        prev_m = series[1] if len(series) > 1 else None
        yoy = _yoy(series, latest)
        if yoy is None: raise ValueError("找不到去年同期")
        prev_yoy = _yoy(series, prev_m) if prev_m else None
        if yoy <= 1.0:   label, tone = "PPI 通縮壓力", "green"
        elif yoy <= 3.0: label, tone = "PPI 溫和", "green"
        elif yoy <= 5.0: label, tone = "PPI 偏高", "amber"
        else:            label, tone = "PPI 過熱", "red"
        return {"value": yoy, "unit": "%", "label": label, "tone": tone,
                "period": f"{latest['year']}-{latest['periodName']}",
                "prev_value": prev_yoy,
                "prev_period": f"{prev_m['year']}-{prev_m['periodName']}" if prev_m else None}
    try:
        return _cached("ppi", 3600, _fetch)
    except Exception as e:
        print(f"[ppi] {str(e)[:80]}")
        return None
