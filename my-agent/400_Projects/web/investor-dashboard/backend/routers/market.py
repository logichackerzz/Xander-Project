from fastapi import APIRouter
import yfinance as yf
import math
import requests as _requests
from datetime import datetime, timezone

router = APIRouter(tags=["market"])
_HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

INDICES = [
    {"symbol": "^TWII", "name": "台股加權", "region": "TW"},
    {"symbol": "^GSPC", "name": "S&P 500",  "region": "US"},
    {"symbol": "^IXIC", "name": "NASDAQ",   "region": "US"},
]


def _safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return None


@router.get("/indices")
def get_indices():
    result = []
    for idx in INDICES:
        price = None
        change_pct = None
        try:
            fi = yf.Ticker(idx["symbol"]).fast_info
            price = _safe(getattr(fi, "last_price", None))
            prev  = _safe(getattr(fi, "previous_close", None))
            change_pct = round((price - prev) / prev * 100, 2) if price and prev else None
        except Exception:
            pass
        result.append({
            "symbol":     idx["symbol"],
            "name":       idx["name"],
            "region":     idx["region"],
            "price":      price,
            "change_pct": change_pct,
        })
    return result


MACRO_RSS_FEEDS = [
    {
        "url":       "https://www.cnbc.com/id/20910258/device/rss/rss.html",
        "publisher": "CNBC",
        "region":    "US",
        "lang":      "en",
    },
    {
        "url":       "https://www.investing.com/rss/news_14.rss",
        "publisher": "Investing.com",
        "region":    "GLOBAL",
        "lang":      "en",
    },
    {
        "url":       "https://feeds.npr.org/1017/rss.xml",
        "publisher": "NPR",
        "region":    "US",
        "lang":      "en",
    },
    {
        # Google News 搜尋：台灣總經 — 央行、利率、通膨、景氣（30 天內）
        "url":       "https://news.google.com/rss/search?q=%E5%88%A9%E7%8E%87+%E9%80%9A%E8%86%A8+%E6%99%AF%E6%B0%A3+%E7%B6%93%E6%BF%9F+when%3A30d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant",
        "publisher": None,   # 從 entry.source 取
        "region":    "TW",
        "lang":      "zh",
    },
]

def _parse_date(date_str: str) -> str:
    if not date_str:
        return ""
    from email.utils import parsedate_to_datetime
    try:
        return parsedate_to_datetime(date_str).isoformat()
    except Exception:
        pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).isoformat()
    except Exception:
        return date_str


def _strip_html(text: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", text).strip()


def _fetch_feed(source: dict) -> list[dict]:
    import feedparser
    import re

    try:
        r = _requests.get(source["url"], timeout=8, headers=_HTTP_HEADERS)
        feed = feedparser.parse(r.content)
    except Exception:
        return []

    items = []
    for entry in feed.entries:
        raw_title = entry.get("title", "").strip()
        if not raw_title:
            continue

        # Google News 標題格式：「新聞標題 - 來源名稱」，拆出乾淨標題和 publisher
        if source["publisher"] is None:
            src = entry.get("source", {})
            publisher = src.get("title", "") if isinstance(src, dict) else ""
            title = re.sub(r"\s*-\s*" + re.escape(publisher) + r"\s*$", "", raw_title).strip() if publisher else raw_title
        else:
            publisher = source["publisher"]
            title = raw_title

        items.append({
            "id":        entry.get("id", title),
            "title":     title,
            "summary":   _strip_html(entry.get("summary", "")),
            "publisher": publisher,
            "pub_date":  _parse_date(entry.get("published", entry.get("updated", ""))),
            "url":       entry.get("link", ""),
            "region":    source["region"],
            "lang":      source.get("lang", "en"),
        })
    return items


@router.get("/news")
def get_news(limit: int = 12):
    per_source = max(1, limit // len(MACRO_RSS_FEEDS))
    seen: set[str] = set()
    buckets: list[list[dict]] = []

    for source in MACRO_RSS_FEEDS:
        bucket: list[dict] = []
        for item in _fetch_feed(source):
            if len(bucket) >= per_source:
                break
            if item["title"] in seen:
                continue
            seen.add(item["title"])
            bucket.append(item)
        buckets.append(bucket)

    # 每輪各來源取一篇，確保來源均衡
    result: list[dict] = []
    for round_items in zip(*buckets):
        result.extend(round_items)

    result.sort(key=lambda x: x["pub_date"], reverse=True)
    return {"news": result[:limit]}
