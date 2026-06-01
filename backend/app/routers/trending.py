import httpx
from fastapi import APIRouter
from ..cache import get_cached, set_cached, get_stale
from ..config import CACHE_TTL

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
}


async def fetch_weibo() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://weibo.com/ajax/side/hotSearch",
            headers=HEADERS,
        )
        data = resp.json()
        items = data.get("data", {}).get("realtime", [])
        return [
            {
                "rank": i + 1,
                "title": item.get("word", ""),
                "url": f"https://s.weibo.com/weibo?q=%23{item.get('word', '')}%23",
                "hot_value": item.get("num", 0),
                "source": "weibo",
                "tag": item.get("label_name", ""),
            }
            for i, item in enumerate(items[:30])
        ]


async def fetch_zhihu() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://www.zhihu.com/api/v4/search/top_search",
            headers={**HEADERS, "Referer": "https://www.zhihu.com/hot"},
        )
        data = resp.json()
        words = data.get("top_search", {}).get("words", [])
        return [
            {
                "rank": i + 1,
                "title": item.get("display_query", item.get("query", "")),
                "url": f"https://www.zhihu.com/search?q={item.get('query', '')}",
                "hot_value": 0,
                "source": "zhihu",
                "tag": "",
            }
            for i, item in enumerate(words[:30])
        ]


async def fetch_bilibili() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.bilibili.com/x/web-interface/ranking/v2",
            headers=HEADERS,
            params={"rid": 0, "type": "all"},
        )
        data = resp.json()
        items = data.get("data", {}).get("list", [])
        return [
            {
                "rank": i + 1,
                "title": item.get("title", ""),
                "url": f"https://www.bilibili.com/video/{item.get('bvid', '')}",
                "hot_value": item.get("stat", {}).get("view", 0),
                "source": "bilibili",
                "tag": "",
            }
            for i, item in enumerate(items[:30])
        ]


SOURCE_MAP = {
    "weibo": fetch_weibo,
    "zhihu": fetch_zhihu,
    "bilibili": fetch_bilibili,
}


@router.get("")
async def get_all_trending():
    cache_key = "trending_all"
    cached = get_cached(cache_key)
    if cached:
        return cached

    results = {}
    for name, fetcher in SOURCE_MAP.items():
        try:
            results[name] = await fetcher()
        except Exception:
            stale = get_stale(f"trending_{name}")
            results[name] = stale if stale else []

    set_cached(cache_key, results, CACHE_TTL["trending"])
    for name, items in results.items():
        set_cached(f"trending_{name}", items, CACHE_TTL["trending"])
    return results


@router.get("/{source}")
async def get_trending(source: str):
    if source not in SOURCE_MAP:
        return {"error": f"Unknown source: {source}", "available": list(SOURCE_MAP.keys())}

    cache_key = f"trending_{source}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        items = await SOURCE_MAP[source]()
    except Exception as e:
        stale = get_stale(cache_key)
        if stale:
            return stale
        return {"error": str(e), "source": source}

    set_cached(cache_key, items, CACHE_TTL["trending"])
    return items
