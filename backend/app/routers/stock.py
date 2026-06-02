import time
import random
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


async def _retry_akshare(fn, max_retries=3):
    """Retry akshare calls with exponential backoff."""
    import asyncio
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(random.uniform(1, 3) * (attempt + 1))


@router.get("/indices")
async def get_indices():
    cache_key = "stock_indices"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak

    # Try sina first, fall back to eastmoney
    for source_name, source_fn in [
        ("sina", lambda: ak.stock_zh_index_spot_sina()),
        ("em", lambda: ak.stock_zh_index_spot_em(symbol="上证系列指数")),
    ]:
        try:
            df = source_fn()
            if df.empty:
                continue
            indices = []
            for _, row in df.head(10).iterrows():
                indices.append({
                    "code": str(row.get("代码", row.get("股票代码", ""))),
                    "name": str(row.get("名称", row.get("股票名称", ""))),
                    "price": float(row.get("最新价", 0)),
                    "change": float(row.get("涨跌额", 0)),
                    "change_pct": float(row.get("涨跌幅", 0)),
                    "volume": float(row.get("成交量", 0)),
                    "amount": float(row.get("成交额", 0)),
                })
            if indices:
                ttl = CACHE_TTL["stock_indices"] if _is_trading_hours() else 1800
                set_cached(cache_key, indices, ttl)
                return indices
        except Exception:
            continue

    return {"error": "暂无行情数据（非交易时段或数据源不可用）"}


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

    codes = [r["code"] for r in rows]
    code_set = set(codes)

    # Try multiple data sources
    for source_name, source_fn in [
        ("qq", lambda: ak.stock_zh_a_spot_qq()),
        ("em", lambda: ak.stock_zh_a_spot_em()),
    ]:
        try:
            df = source_fn()
            if df.empty:
                continue
            # Try different code column names
            code_col = None
            for col_name in ["代码", "股票代码", "code"]:
                if col_name in df.columns:
                    code_col = col_name
                    break
            if not code_col:
                continue
            filtered = df[df[code_col].astype(str).isin(code_set)]
            quotes = []
            for _, row in filtered.iterrows():
                quotes.append({
                    "code": str(row.get(code_col, "")),
                    "name": str(row.get("名称", row.get("股票名称", row.get("name", "")))),
                    "price": float(row.get("最新价", 0)),
                    "change": float(row.get("涨跌额", 0)),
                    "change_pct": float(row.get("涨跌幅", 0)),
                    "volume": float(row.get("成交量", 0)),
                    "amount": float(row.get("成交额", 0)),
                })
            ttl = CACHE_TTL["stock_quotes"] if _is_trading_hours() else 1800
            set_cached(cache_key, quotes, ttl)
            return quotes
        except Exception:
            continue

    return {"error": "获取行情失败，请稍后重试"}


@router.get("/sectors")
async def get_sectors():
    """Get hot industry sectors."""
    cache_key = "stock_sectors"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak
    try:
        df = ak.stock_board_industry_name_em()
        sectors = []
        for _, row in df.head(15).iterrows():
            sectors.append({
                "name": str(row.get("板块名称", row.get("name", ""))),
                "change_pct": float(row.get("涨跌幅", 0)),
                "change": float(row.get("涨跌额", 0)),
                "price": float(row.get("最新价", 0)),
                "volume": float(row.get("成交量", 0)),
                "amount": float(row.get("成交额", 0)),
            })
        if sectors:
            set_cached(cache_key, sectors, 300)
            return sectors
    except Exception:
        pass
    return {"error": "获取板块数据失败"}


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
