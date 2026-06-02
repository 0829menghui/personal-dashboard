import re
import time
import asyncio
import httpx
import feedparser
from fastapi import APIRouter, Query
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL, NEWS_RSS_FEEDS

router = APIRouter()


async def _fetch_and_parse(url: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        resp = await client.get(url)
        content = resp.text

    feed = await asyncio.to_thread(feedparser.parse, content)
    source = feed.feed.get("title", url)
    items = []
    for entry in feed.entries:
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        ts = time.mktime(published) if published else 0
        summary = re.sub(r"<[^>]+>", "", entry.get("summary", ""))[:300]
        items.append({
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "summary": summary,
            "source": source,
            "published_at": ts,
        })
    return items


@router.get("")
async def get_deals(source: str = Query(default="36kr", description="News source key")):
    urls = NEWS_RSS_FEEDS.get(source)
    if not urls:
        return {"error": f"Unknown source: {source}", "available": list(NEWS_RSS_FEEDS.keys())}

    cache_key = f"deals_{source}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    all_items = []
    for url in urls:
        try:
            all_items.extend(await _fetch_and_parse(url))
        except Exception:
            continue

    all_items.sort(key=lambda x: x["published_at"], reverse=True)
    result = all_items[:30]
    set_cached(cache_key, result, CACHE_TTL["deals"])
    return result
