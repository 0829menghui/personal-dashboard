from fastapi import APIRouter
from datetime import datetime
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL
from ..database import get_db

router = APIRouter()


def _is_trading_hours() -> bool:
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    hour_min = now.hour * 100 + now.minute
    return (925 <= hour_min <= 1130) or (1300 <= hour_min <= 1500)


@router.get("/indices")
async def get_indices():
    cache_key = "stock_indices"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak
    try:
        df = ak.stock_zh_index_spot_em(symbol="上证系列指数")
        if df.empty:
            return {"error": "暂无行情数据（非交易时段）"}
        indices = []
        for _, row in df.head(10).iterrows():
            indices.append({
                "code": str(row.get("代码", "")),
                "name": str(row.get("名称", "")),
                "price": float(row.get("最新价", 0)),
                "change": float(row.get("涨跌额", 0)),
                "change_pct": float(row.get("涨跌幅", 0)),
                "volume": float(row.get("成交量", 0)),
                "amount": float(row.get("成交额", 0)),
            })
        ttl = CACHE_TTL["stock_indices"] if _is_trading_hours() else 1800
        set_cached(cache_key, indices, ttl)
        return indices
    except Exception as e:
        return {"error": f"获取行情失败: {str(e)}"}


@router.get("/quotes")
async def get_quotes():
    cache_key = "stock_quotes"
    cached = get_cached(cache_key)
    if cached:
        return cached

    with get_db() as conn:
        rows = conn.execute("SELECT code, name FROM watchlist").fetchall()

    if not rows:
        return []

    import akshare as ak
    try:
        df = ak.stock_zh_a_spot_em()
        if df.empty:
            return {"error": "暂无行情数据（非交易时段）"}
        codes = [r["code"] for r in rows]
        filtered = df[df["代码"].isin(codes)]
        quotes = []
        for _, row in filtered.iterrows():
            quotes.append({
                "code": str(row.get("代码", "")),
                "name": str(row.get("名称", "")),
                "price": float(row.get("最新价", 0)),
                "change": float(row.get("涨跌额", 0)),
                "change_pct": float(row.get("涨跌幅", 0)),
                "volume": float(row.get("成交量", 0)),
                "amount": float(row.get("成交额", 0)),
            })
        ttl = CACHE_TTL["stock_quotes"] if _is_trading_hours() else 1800
        set_cached(cache_key, quotes, ttl)
        return quotes
    except Exception as e:
        return {"error": f"获取行情失败: {str(e)}"}


@router.get("/watchlist")
async def get_watchlist():
    with get_db() as conn:
        rows = conn.execute("SELECT code, name, added_at FROM watchlist ORDER BY added_at DESC").fetchall()
    return [dict(r) for r in rows]


@router.post("/watchlist")
async def add_to_watchlist(item: dict):
    code = item.get("code", "").strip()
    name = item.get("name", code).strip()
    if not code:
        return {"error": "code is required"}
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO watchlist (code, name, added_at) VALUES (?, ?, ?)",
            (code, name, datetime.now().isoformat()),
        )
    return {"ok": True, "code": code}


@router.delete("/watchlist/{code}")
async def remove_from_watchlist(code: str):
    with get_db() as conn:
        conn.execute("DELETE FROM watchlist WHERE code = ?", (code,))
    return {"ok": True}
