import time as _time
import requests
import yfinance as yf
import pandas as pd
import xml.etree.ElementTree as ET
from fastapi import APIRouter
from datetime import datetime, timedelta, timezone, date as _date

router = APIRouter(tags=["sentiment"])

# ── 快取 helper（key → (value, expires_ts)） ──────────────────────────────────
_CACHE: dict = {}

def _cached(key: str, ttl: int, fn):
    """TTL 秒內直接回傳快取值，否則執行 fn() 並存快取"""
    entry = _CACHE.get(key)
    if entry and _time.time() < entry[1]:
        return entry[0]
    result = fn()
    _CACHE[key] = (result, _time.time() + ttl)
    return result

TWSE_HEADERS = {"User-Agent": "Mozilla/5.0"}

def _last_trading_dates(n: int = 5):
    """往前找最近 n 個交易日（排除週六日）"""
    dates, d = [], datetime.today()
    while len(dates) < n:
        if d.weekday() < 5:          # 0-4 = 週一~週五
            dates.append(d.strftime("%Y%m%d"))
        d -= timedelta(days=1)
    return dates

# ── Helpers ───────────────────────────────────────────────────────────────

def calc_rsi(series: pd.Series, period: int = 14) -> float:
    delta = series.diff()
    gain  = delta.where(delta > 0, 0.0).rolling(period).mean()
    loss  = (-delta.where(delta < 0, 0.0)).rolling(period).mean()
    rs    = gain / loss
    return round(float((100 - 100 / (1 + rs)).iloc[-1]), 1)

def fg_label(v):
    if v <= 24: return "極度恐懼", "red"
    if v <= 44: return "恐懼",     "red"
    if v <= 55: return "中立",     "neutral"
    if v <= 74: return "貪婪",     "green"
    return "極度貪婪", "green"

def vix_label(v):
    if v < 15:  return "低恐慌", "green"
    if v < 25:  return "正常",   "neutral"
    if v < 30:  return "警戒",   "amber"
    return "恐慌", "red"

def rsi_label(v):
    if v < 30:  return "超賣", "green"
    if v < 45:  return "偏弱", "neutral"
    if v < 55:  return "中性", "neutral"
    if v < 70:  return "偏強", "amber"
    return "超買", "red"

def pc_label(v):
    if v < 0.7:  return "偏多", "green"
    if v < 1.0:  return "中性", "neutral"
    return "偏空", "red"

def vol_label(ratio):
    if ratio > 1.5: return "非常活躍", "green"
    if ratio > 1.1: return "活躍",     "green"
    if ratio < 0.8: return "清淡",     "amber"
    return "正常", "neutral"

TWSE_HEADERS = {"User-Agent": "Mozilla/5.0"}

# ── 美股情緒 ──────────────────────────────────────────────────────────────

def _us_today() -> _date:
    """今天的美東日期（EDT = UTC-4，已足夠精確）"""
    return (datetime.now(timezone.utc) - timedelta(hours=4)).date()

def _index_card(symbol: str):
    hist = yf.Ticker(symbol).history(period="5d").dropna()
    if len(hist) < 2:
        raise ValueError(f"{symbol} 資料不足")
    last_bar_date = hist.index[-1].date() if hasattr(hist.index[-1], "date") else hist.index[-1].to_pydatetime().date()
    is_today = (last_bar_date == _us_today())
    cur     = float(hist["Close"].iloc[-1])
    prev    = float(hist["Close"].iloc[-2])
    chg     = round(cur - prev, 2)
    chg_pct = round(chg / prev * 100, 2)
    tone    = "green" if chg_pct > 0 else ("red" if chg_pct < 0 else "neutral")
    label   = f"{'▲' if chg_pct > 0 else '▼'} {abs(chg_pct):.2f}%"
    high = round(float(hist["High"].iloc[-1]), 2)
    low  = round(float(hist["Low"].iloc[-1]),  2)
    return {"value": round(cur, 2), "change": chg, "change_pct": chg_pct,
            "label": label, "tone": tone, "is_today": is_today,
            "high": high, "low": low}

@router.get("/us/sp500")
def get_sp500():
    try:
        return _cached("sp500", 120, lambda: _index_card("^GSPC"))
    except Exception as e:
        print(f"[sp500] {str(e)[:120]}")
        return None

@router.get("/us/nasdaq")
def get_nasdaq():
    try:
        return _cached("nasdaq", 120, lambda: _index_card("^IXIC"))
    except Exception as e:
        print(f"[nasdaq] {str(e)[:120]}")
        return None

@router.get("/us/dow")
def get_dow():
    try:
        return _cached("dow", 120, lambda: _index_card("^DJI"))
    except Exception as e:
        print(f"[dow] {str(e)[:120]}")
        return None

@router.get("/us/vix")
def get_vix():
    def _fetch():
        hist = yf.Ticker("^VIX").history(period="5d").dropna()
        if len(hist) < 2:
            raise ValueError(f"VIX 資料不足")
        cur, prev = round(float(hist["Close"].iloc[-1]), 2), round(float(hist["Close"].iloc[-2]), 2)
        chg = round(cur - prev, 2)
        label, tone = vix_label(cur)
        return {"value": cur, "change": chg, "change_pct": round(chg/prev*100, 2), "label": label, "tone": tone}
    try:
        return _cached("vix", 120, _fetch)
    except Exception as e:
        print(f"[vix] {str(e)[:120]}")
        return None

def _breadth_label(v: float):
    if v >= 80: return "全面過熱", "red"
    if v >= 60: return "多頭強勢", "green"
    if v >= 40: return "中性區間", "neutral"
    if v >= 20: return "市場偏弱", "amber"
    return "超跌悲觀", "red"

# ── 市場廣度：S&P 500 成分股爬蟲 + 批次計算，10 分鐘 cache ──────────────────
_breadth_cache: dict = {"result": None, "expires": 0.0}

def _calc_breadth_from_tickers(tickers: list[str]) -> float:
    """給定 ticker 清單，回傳高於 MA50 的百分比"""
    raw = yf.download(tickers, period="70d", progress=False, auto_adjust=True)
    closes = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw
    above, total = 0, 0
    for sym in closes.columns:
        s = closes[sym].dropna()
        if len(s) >= 52:
            ma50 = s.rolling(50).mean().iloc[-1]
            if s.iloc[-1] > ma50:
                above += 1
            total += 1
    if total == 0:
        raise ValueError("無有效股票資料")
    return round(above / total * 100, 1)

@router.get("/us/market-breadth")
def get_market_breadth():
    # 10 分鐘 cache（批次計算耗時，避免每次 15 秒）
    if _breadth_cache["result"] and _time.time() < _breadth_cache["expires"]:
        return _breadth_cache["result"]

    # 主：爬 Wikipedia S&P 500 名單 → 全部批次計算（需帶 User-Agent 避免 403）
    try:
        html = requests.get(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
            headers={"User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)"},
            timeout=12,
        ).text
        tables = pd.read_html(pd.io.common.StringIO(html), header=0)
        sp500  = tables[0]
        # 欄位名稱可能是 "Symbol" 或 "Ticker"，取第一欄
        sym_col = next(
            (c for c in sp500.columns if str(c).lower() in ("symbol", "ticker")),
            sp500.columns[0],
        )
        tickers = [str(t).replace(".", "-") for t in sp500[sym_col].dropna().tolist()
                   if str(t) not in ("nan", "")]
        val = _calc_breadth_from_tickers(tickers)
        result = {"value": val, "label": _breadth_label(val)[0],
                  "tone": _breadth_label(val)[1], "source": f"SP500_{len(tickers)}"}
        _breadth_cache["result"] = result
        _breadth_cache["expires"] = _time.time() + 600
        return result
    except Exception as e:
        print(f"[breadth-wiki] {str(e)[:120]}")

    # Fallback：硬編 100 支代表性 S&P 500 成分股
    _SP100 = [
        "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","BRK-B","JPM",
        "UNH","V","LLY","XOM","MA","JNJ","PG","COST","MRK","HD",
        "ABBV","CVX","CRM","BAC","NFLX","KO","PEP","TMO","WMT","ORCL",
        "AMD","ADBE","ACN","DIS","CSCO","ABT","MCD","WFC","CAT","GE",
        "GS","IBM","RTX","AXP","INTU","QCOM","TXN","AMGN","LMT","HON",
        "SPGI","BLK","DE","SCHW","MS","ADP","SYK","ISRG","PLD","CI",
        "NOW","AMAT","ADI","PANW","REGN","MO","GILD","EOG","ZTS","LRCX",
        "CME","COP","TJX","BSX","MMC","SHW","HCA","ELV","ETN","AON",
        "VRTX","DHR","KLAC","ITW","CMG","NKE","FI","SO","NSC","DUK",
        "USB","PNC","MCK","CCI","PSA","O","CARR","WELL","WM","GD",
    ]
    try:
        val = _calc_breadth_from_tickers(_SP100)
        result = {"value": val, "label": _breadth_label(val)[0],
                  "tone": _breadth_label(val)[1], "source": "SP100_sample"}
        _breadth_cache["result"] = result
        _breadth_cache["expires"] = _time.time() + 600
        return result
    except Exception as e:
        print(f"[breadth-fallback] {str(e)[:120]}")
        return None

# ── Put/Call Ratio：SPY + QQQ + IWM，所有到期日 volume 加總 ──────────────────
# yfinance 的 openInterest 在非盤中時段不更新，改用 volume（等同 CBOE 日計算方式）
_PC_ETFS = ["SPY", "QQQ", "IWM"]

@router.get("/us/put-call-ratio")
def get_put_call_ratio():
    def _fetch():
        total_puts, total_calls = 0, 0
        for sym in _PC_ETFS:
            t = yf.Ticker(sym)
            exps = t.options
            if not exps:
                continue
            for exp in exps[:12]:
                try:
                    chain = t.option_chain(exp)
                    total_puts  += int(chain.puts["volume"].fillna(0).sum())
                    total_calls += int(chain.calls["volume"].fillna(0).sum())
                except Exception:
                    continue
        if total_calls == 0:
            raise ValueError("calls volume 為 0")
        ratio = round(total_puts / total_calls, 3)
        label, tone = pc_label(ratio)
        return {"value": ratio, "label": label, "tone": tone, "source": "SPY+QQQ+IWM vol"}
    try:
        return _cached("put-call", 300, _fetch)   # 5 分鐘快取（期權資料較重）
    except Exception as e:
        print(f"[put-call] {str(e)[:120]}")
        return None

# ── 台股情緒 ──────────────────────────────────────────────────────────────

def _fetch_twtw44u():
    """融資融券明細 TWT44U（有效端點，含日期回退）
    col[3]=融資金額(NT$千), col[4]=融券金額(NT$千), col[5]=差額
    """
    for date_str in _last_trading_dates(5):
        try:
            url  = f"https://www.twse.com.tw/rwd/zh/fund/TWT44U?date={date_str}&response=json"
            r    = requests.get(url, timeout=10, headers=TWSE_HEADERS)
            r.encoding = "utf-8"
            d    = r.json()
            if d.get("stat") == "OK" and d.get("data"):
                print(f"[tw-margin] TWT44U date={d['date']}, rows={len(d['data'])}")
                return d["data"], d["date"]
        except Exception as e:
            print(f"[tw-margin TWT44U {date_str}] {str(e)[:120]}")
    raise ValueError("TWT44U 資料暫不可用")

def _fetch_bfi82u():
    """三大法人買賣超，無資料時往前找最近 5 個交易日"""
    for date_str in _last_trading_dates(5):
        url  = f"https://www.twse.com.tw/rwd/zh/fund/BFI82U?date={date_str}&type=day&response=json"
        resp = requests.get(url, timeout=8, headers=TWSE_HEADERS).json()
        rows = resp.get("data", [])
        if rows:
            return rows, date_str
    raise ValueError("找不到三大法人資料")

@router.get("/tw/margin")
def get_tw_margin():
    """融資餘額總計（TWT44U，col[3] 單位 NT$千，顯示 億元）"""
    try:
        rows, date_used = _fetch_twtw44u()
        total_k = sum(
            int(r[3].replace(",", ""))
            for r in rows if len(r) > 3 and r[3].strip() and r[3].strip() != "0"
        )
        total_yi = round(total_k / 100_000, 1)   # NT$千 → NT$億
        label = "融資熱絡" if total_yi > 1500 else "融資正常" if total_yi > 400 else "融資清淡"
        tone  = "amber"   if total_yi > 1500 else "neutral"
        return {"value": total_yi, "unit": "億元", "label": label,
                "tone": tone, "date": date_used}
    except Exception as e:
        print(f"[tw-margin] {str(e)[:120]}")
        return {"value": None, "unit": "億元", "label": str(e)[:40], "tone": "neutral"}

@router.get("/tw/short-ratio")
def get_tw_short_ratio():
    """券資比（TWT44U col[4]/col[3]，同單位 NT$千）"""
    try:
        rows, date_used = _fetch_twtw44u()
        total_margin = sum(
            int(r[3].replace(",", "")) for r in rows if len(r) > 3 and r[3].strip()
        )
        total_short = sum(
            int(r[4].replace(",", "")) for r in rows if len(r) > 4 and r[4].strip()
        )
        if total_margin == 0:
            raise ValueError("融資為 0")
        ratio = round(total_short / total_margin * 100, 1)
        label = "空方積極" if ratio > 60 else "多空均衡" if ratio > 30 else "多頭主導"
        tone  = "red"     if ratio > 60 else "neutral"  if ratio > 30 else "green"
        return {"value": ratio, "unit": "%", "label": label,
                "tone": tone, "date": date_used}
    except Exception as e:
        print(f"[tw-short] {str(e)[:120]}")
        return {"value": None, "unit": "%", "label": str(e)[:40], "tone": "neutral"}

@router.get("/tw/foreign-net")
def get_tw_foreign_net():
    """外資買賣超（TWSE 三大法人，無當日資料自動往前找）"""
    try:
        rows, date_used = _fetch_bfi82u()
        for row in rows:
            name = row[0]
            if name.startswith("外資及陸資"):
                net_str = row[3].replace(",", "").replace("+", "")
                net     = int(net_str)
                net_yi  = round(net / 1e8, 2)
                label   = "買超" if net > 0 else "賣超"
                tone    = "green" if net > 0 else "red"
                return {"value": net_yi, "unit": "億元", "label": label,
                        "tone": tone, "date": date_used}
        return None
    except Exception as e:
        return {"value": None, "unit": "億元", "label": str(e)[:40], "tone": "neutral"}

@router.get("/tw/trust-net")
def get_tw_trust_net():
    """投信買賣超（重用 BFI82U，找「投信」列）"""
    try:
        rows, date_used = _fetch_bfi82u()
        for row in rows:
            if row[0].strip() == "投信":
                net_str = row[3].replace(",", "").replace("+", "")
                net     = int(net_str)
                net_yi  = round(net / 1e8, 2)
                # 台灣慣例：買超=紅=上漲，賣超=綠=下跌
                label   = "買超" if net >= 0 else "賣超"
                tone    = "red"  if net >= 0 else "green"
                return {"value": abs(net_yi), "raw": net_yi,
                        "unit": "億元", "label": label, "tone": tone, "date": date_used}
        raise ValueError("找不到投信列")
    except Exception as e:
        print(f"[trust-net] {str(e)[:120]}")
        return None

@router.get("/tw/retail-ratio")
def get_tw_retail_ratio():
    """散戶多空比（TAIFEX 小台指三大法人所有月淨部位推算）"""
    try:
        from bs4 import BeautifulSoup
        resp = requests.get(
            "https://www.taifex.com.tw/cht/3/futContractsDate",
            headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "zh-TW"},
            timeout=12,
        )
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        rows = soup.select("table.table_f tr")

        inst_net, inst_long, inst_short = 0, 0, 0
        mtx_idx = None

        for i, row in enumerate(rows):
            cells = [td.get_text(strip=True) for td in row.select("td")]
            if not cells:
                continue

            # 找小型臺指期貨首列（15 格，含序號與契約名）
            if len(cells) == 15 and any("小型臺指" in c for c in cells[:2]):
                mtx_idx = i
                # 自營商所有月：long[9], short[11], net[13]
                inst_long  += _parse_int(cells[9])
                inst_short += _parse_int(cells[11])
                inst_net   += _parse_int(cells[13])

            # 投信、外資後續列（13 格，無序號）
            elif mtx_idx is not None and i in (mtx_idx + 1, mtx_idx + 2) and len(cells) == 13:
                # 所有月：long[7], short[9], net[11]
                inst_long  += _parse_int(cells[7])
                inst_short += _parse_int(cells[9])
                inst_net   += _parse_int(cells[11])

        total_inst_oi = inst_long + inst_short
        if total_inst_oi == 0:
            raise ValueError("機構 OI 為 0")

        # 散戶淨部位 ≈ -機構淨部位（期貨市場零和）
        retail_net   = -inst_net
        retail_ratio = round(retail_net / total_inst_oi * 100, 1)
        sign = "+" if retail_ratio >= 0 else ""

        if retail_ratio > 5:
            label, tone = "散戶看多", "amber"
        elif retail_ratio < -5:
            label, tone = "散戶看空", "green"
        else:
            label, tone = "中性", "neutral"

        return {"value": f"{sign}{retail_ratio}", "unit": "%",
                "label": label, "tone": tone,
                "inst_net": inst_net, "retail_net": retail_net}
    except Exception as e:
        print(f"[retail-ratio] {str(e)[:120]}")
        return None

def _parse_int(s: str) -> int:
    """把 '1,234' / '-1,234' / '+1,234' 轉成 int，失敗回 0"""
    try:
        return int(s.replace(",", "").replace("+", ""))
    except Exception:
        return 0

@router.get("/tw/volume")
def get_tw_volume():
    """大盤成交量 vs 20日均量（^TWII 無量時改用 0050.TW 代理，2 分鐘快取）"""
    cached = _CACHE.get("tw-volume")
    if cached and _time.time() < cached[1]:
        return cached[0]
    for symbol in ["^TWII", "0050.TW", "2330.TW"]:
        try:
            hist     = yf.Ticker(symbol).history(period="30d")
            vol_list = hist["Volume"].dropna()
            if len(vol_list) < 5:
                continue
            today = int(vol_list.iloc[-1])
            avg20 = int(vol_list.tail(20).mean())
            if avg20 == 0:
                continue
            ratio = round(today / avg20, 2)
            label, tone = vol_label(ratio)
            print(f"[tw-volume] symbol={symbol}, today={today}, avg20={avg20}")
            result = {"today": today, "avg_20d": avg20, "ratio": ratio,
                      "label": label, "tone": tone, "proxy": symbol}
            _CACHE["tw-volume"] = (result, _time.time() + 120)
            return result
        except Exception as e:
            print(f"[tw-volume {symbol}] {str(e)[:120]}")
    return None

# ── 財經新聞 ──────────────────────────────────────────────────────────────

@router.get("/news")
def get_news(limit: int = 15):
    """Yahoo Finance RSS（台股 + 美股）"""
    articles = []
    feeds = [
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5ETWII&region=TW&lang=zh-TW",
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY&region=US&lang=en-US",
    ]
    try:
        for feed_url in feeds:
            res  = requests.get(feed_url, timeout=8, headers=TWSE_HEADERS)
            root = ET.fromstring(res.text)
            for item in root.findall(".//item"):
                title  = item.findtext("title",   "").strip()
                link   = item.findtext("link",    "").strip()
                pub    = item.findtext("pubDate", "").strip()
                src_el = item.find("source")
                source = src_el.text.strip() if src_el is not None else "Yahoo Finance"
                if title and link:
                    articles.append({"title": title, "url": link,
                                     "source": source, "published_at": pub})
            if len(articles) >= limit:
                break
        return {"articles": articles[:limit]}
    except Exception:
        return {"articles": []}

