from fastapi import APIRouter
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL

router = APIRouter()


@router.get("/price")
async def get_gold_price():
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
        }
        set_cached(cache_key, result, CACHE_TTL["gold"])
        return result
    except Exception as e:
        return {"error": f"获取金价失败: {str(e)}"}
