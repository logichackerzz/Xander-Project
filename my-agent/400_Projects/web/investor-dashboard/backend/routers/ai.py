import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

class AiRequest(BaseModel):
    symbol: str
    name: str
    revenue_b: float | None = None
    revenue_yoy_pct: float | None = None
    net_margin_pct: float | None = None
    roe_pct: float | None = None
    pe_trailing: float | None = None
    debt_to_equity: float | None = None
    fcf_b: float | None = None
    gross_margin_pct: float | None = None

def build_prompt(d: AiRequest) -> str:
    def fmt(v, unit=""):
        return f"{v}{unit}" if v is not None else "無資料"
    return f"""你是一位財務顧問，用繁體中文、朋友說話的語氣，針對以下數據給出剛好 3 句話的快速解讀。
第 1 句：成長與獲利能力。第 2 句：估值貴不貴。第 3 句：風險或結論。
可以引用關鍵數字當佐證，但重點是說「這代表什麼」。不用條列、不用標題。

公司：{d.name}（{d.symbol}）
- 營收年增率 {fmt(d.revenue_yoy_pct, "%")}，淨利率 {fmt(d.net_margin_pct, "%")}，毛利率 {fmt(d.gross_margin_pct, "%")}
- ROE {fmt(d.roe_pct, "%")}，P/E {fmt(d.pe_trailing, "x")}，D/E {fmt(d.debt_to_equity)}，FCF {fmt(d.fcf_b, "B USD")}
"""

@router.post("/summary")
async def ai_summary(req: AiRequest):
    load_dotenv(override=True)
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY 未設定")

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": build_prompt(req)}],
        "max_tokens": 500,
        "temperature": 0.7,
        "stream": True,
    }

    async def stream():
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                async with client.stream(
                    "POST",
                    GROQ_URL,
                    json=payload,
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                ) as resp:
                    if resp.status_code == 429:
                        yield "Groq 額度暫時達上限，請稍後再試。"
                        return
                    if resp.status_code != 200:
                        body = await resp.aread()
                        yield f"[API 錯誤 {resp.status_code}] {body.decode()}"
                        return
                    async for line in resp.aiter_lines():
                        if line.startswith("data:"):
                            data = line[5:].strip()
                            if not data or data == "[DONE]":
                                continue
                            try:
                                obj = json.loads(data)
                                text = obj["choices"][0]["delta"].get("content", "")
                                if text:
                                    yield text
                            except Exception:
                                continue
        except Exception as e:
            yield f"[連線錯誤：{str(e)}]"

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")
