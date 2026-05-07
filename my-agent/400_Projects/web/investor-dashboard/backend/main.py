from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 — registers ORM models before create_all
from routers import portfolio, financials, sentiment, calendar, watchlist, market

Base.metadata.create_all(bind=engine)

app = FastAPI(title="投資儀表板 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "投資儀表板 API 運行中"}

app.include_router(portfolio.router, prefix="/api/portfolio")
app.include_router(financials.router, prefix="/api/financials")
app.include_router(sentiment.router, prefix="/api/sentiment")
app.include_router(calendar.router, prefix="/api/calendar")
app.include_router(watchlist.router, prefix="/api/watchlist")
app.include_router(market.router, prefix="/api/market")
