import re
import time
import feedparser
from fastapi import APIRouter
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL, DEALS_RSS_FEEDS

router = APIRouter()


def _parse_deals_feed(url: str) -> list[dict]:
    feed = feedparser.parse(url)
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


@router.get("/")
async def get_deals():
    cache_key = "deals"
    cached = get_cached(cache_key)
    if cached:
        return cached

    all_items = []
    for url in DEALS_RSS_FEEDS:
        try:
            all_items.extend(_parse_deals_feed(url))
        except Exception:
            continue

    all_items.sort(key=lambda x: x["published_at"], reverse=True)
    result = all_items[:30]
    set_cached(cache_key, result, CACHE_TTL["deals"])
    return result
