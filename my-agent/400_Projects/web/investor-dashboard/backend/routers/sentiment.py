from fastapi import APIRouter

router = APIRouter(tags=["sentiment"])

@router.get("/fear-greed")
def get_fear_greed():
    # TODO: 串接 alternative.me API
    pass

@router.get("/news")
def get_news(symbol: str = None):
    # TODO: RSS 爬取財經新聞
    pass

@router.get("/indicators/{symbol}")
def get_indicators(symbol: str):
    # TODO: RSI、MACD 計算
    pass
