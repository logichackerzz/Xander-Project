from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import portfolio, financials, sentiment

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
