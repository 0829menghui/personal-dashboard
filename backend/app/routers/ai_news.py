import re
import time
import asyncio
import httpx
import feedparser
from fastapi import APIRouter, Query
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL, AI_NEWS_SOURCES, AI_KEYWORDS

router = APIRouter()

KEYWORD_PATTERN = re.compile(
    "|".join(re.escape(kw) for kw in AI_KEYWORDS),
    re.IGNORECASE,
)


def _match(entry) -> bool:
    text = f"{entry.get('title', '')} {entry.get('summary', '')}"
    return bool(KEYWORD_PATTERN.search(text))


async def _fetch_and_parse(url: str, filter_ai: bool = True) -> list[dict]:
    async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
        resp = await client.get(url)
        content = resp.text

    feed = await asyncio.to_thread(feedparser.parse, content)
    source = feed.feed.get("title", url)
    items = []
    for entry in feed.entries:
        if filter_ai and not _match(entry):
            continue
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        ts = time.mktime(published) if published else 0
        items.append({
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "summary": re.sub(r"<[^>]+>", "", entry.get("summary", ""))[:200],
            "source": source,
            "published_at": ts,
        })
    return items


@router.get("")
async def get_ai_news(source: str = Query(default="all", description="AI news source key")):
    urls = AI_NEWS_SOURCES.get(source)
    if not urls:
        return {"error": f"Unknown source: {source}", "available": list(AI_NEWS_SOURCES.keys())}

    cache_key = f"ai_news_{source}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    filter_ai = (source == "all" or source == "36kr_ai")
    all_items = []
    for url in urls:
        try:
            all_items.extend(await _fetch_and_parse(url, filter_ai=filter_ai))
        except Exception:
            continue

    all_items.sort(key=lambda x: x["published_at"], reverse=True)
    result = all_items[:50]
    set_cached(cache_key, result, CACHE_TTL["ai_news"])
    return result
