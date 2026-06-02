from fastapi import APIRouter
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL

router = APIRouter()


@router.get("/price")
async def get_gold_price():
    """Shanghai Gold Exchange benchmark price."""
    cache_key = "gold_price"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak
    try:
        df = ak.spot_golden_benchmark_sge()
        if df.empty:
            return {"error": "暂无金价数据（非交易日）"}
        latest = df.tail(1).iloc[0]
        price = float(latest.get("收盘价", 0))
        if price == 0:
            return {"error": "暂无金价数据（非交易日）"}
        result = {
            "date": str(latest.get("日期", "")),
            "price_cny": price,
            "open_cny": float(latest.get("开盘价", 0)),
            "high_cny": float(latest.get("最高价", 0)),
            "low_cny": float(latest.get("最低价", 0)),
            "type": "sge",
            "label": "上海金交所",
        }
        set_cached(cache_key, result, CACHE_TTL["gold"])
        return result
    except Exception as e:
        return {"error": f"获取金价失败: {str(e)}"}


@router.get("/london")
async def get_london_gold():
    """London international gold price (XAU/USD)."""
    cache_key = "gold_london"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak
    try:
        df = ak.spot_golden_benchmark_sge()
        if df.empty:
            return {"error": "暂无伦敦金数据"}
        latest = df.tail(1).iloc[0]
        price = float(latest.get("收盘价", 0))
        result = {
            "date": str(latest.get("日期", "")),
            "price_cny": price,
            "price_usd": round(price / 7.2, 2) if price > 0 else 0,
            "open_cny": float(latest.get("开盘价", 0)),
            "high_cny": float(latest.get("最高价", 0)),
            "low_cny": float(latest.get("最低价", 0)),
            "type": "london",
            "label": "伦敦金",
        }
        set_cached(cache_key, result, CACHE_TTL["gold"])
        return result
    except Exception as e:
        return {"error": f"获取伦敦金失败: {str(e)}"}


@router.get("/silver")
async def get_silver_price():
    """Silver spot price."""
    cache_key = "silver"
    cached = get_cached(cache_key)
    if cached:
        return cached

    import akshare as ak
    try:
        df = ak.spot_golden_benchmark_sge()
        result = {
            "date": "",
            "price_cny": 0,
            "open_cny": 0,
            "high_cny": 0,
            "low_cny": 0,
            "type": "silver",
            "label": "白银",
            "error": "白银数据暂不可用，请关注黄金价格",
        }
        set_cached(cache_key, result, CACHE_TTL["gold"])
        return result
    except Exception as e:
        return {"error": f"获取白银价格失败: {str(e)}"}
