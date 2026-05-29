import re
import time
import feedparser
from fastapi import APIRouter
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL, AI_RSS_FEEDS, AI_KEYWORDS

router = APIRouter()

KEYWORD_PATTERN = re.compile(
    "|".join(re.escape(kw) for kw in AI_KEYWORDS),
    re.IGNORECASE,
)


def _match(entry) -> bool:
    text = f"{entry.get('title', '')} {entry.get('summary', '')}"
    return bool(KEYWORD_PATTERN.search(text))


def _parse_feed(url: str) -> list[dict]:
    feed = feedparser.parse(url)
    source = feed.feed.get("title", url)
    items = []
    for entry in feed.entries:
        if not _match(entry):
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


@router.get("/")
async def get_ai_news():
    cache_key = "ai_news"
    cached = get_cached(cache_key)
    if cached:
        return cached

    all_items = []
    for url in AI_RSS_FEEDS:
        try:
            all_items.extend(_parse_feed(url))
        except Exception:
            continue

    all_items.sort(key=lambda x: x["published_at"], reverse=True)
    result = all_items[:50]
    set_cached(cache_key, result, CACHE_TTL["ai_news"])
    return result
