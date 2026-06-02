from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, get_db
from .routers import trending, stock, gold, ai_news, deals, anime

app = FastAPI(title="Personal Dashboard API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trending.router, prefix="/api/v1/trending", tags=["trending"])
app.include_router(stock.router, prefix="/api/v1/stock", tags=["stock"])
app.include_router(gold.router, prefix="/api/v1/gold", tags=["gold"])
app.include_router(ai_news.router, prefix="/api/v1/ai-news", tags=["ai-news"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(anime.router, prefix="/api/v1/anime", tags=["anime"])


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/admin/clear-cache")
async def clear_cache(key: str = None):
    """Clear cache entries. If key is provided, clears matching keys. If not, clears all."""
    with get_db() as conn:
        if key:
            conn.execute("DELETE FROM cache WHERE key LIKE ?", (f"%{key}%",))
        else:
            conn.execute("DELETE FROM cache")
    return {"ok": True, "key": key or "all"}
