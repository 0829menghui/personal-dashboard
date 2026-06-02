import httpx
import asyncio
from datetime import datetime
from fastapi import APIRouter, Query, BackgroundTasks
from ..cache import get_cached, set_cached, get_stale
from ..config import CACHE_TTL
from ..database import get_db

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://www.bilibili.com/",
}

BILIBILI_TIMELINE_URL = "https://api.bilibili.com/pgc/web/timeline"
WEEKDAYS_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


def _build_schedule(data: dict, following_ids: set) -> list:
    days_map = {}
    for day_data in data.get("result", []):
        dow = day_data.get("day_of_week", 0)
        if dow not in days_map:
            days_map[dow] = []
        for ep in day_data.get("episodes", []):
            season_id = ep.get("season_id", 0)
            days_map[dow].append({
                "id": season_id,
                "title": ep.get("title", ""),
                "name_cn": ep.get("title", ""),
                "image": ep.get("cover", ""),
                "rating": float(ep.get("rating", 0) or 0),
                "air_date": day_data.get("date", ""),
                "air_time": ep.get("pub_time", ""),
                "pub_index": ep.get("pub_index", ""),
                "url": ep.get("url", ""),
                "followed": season_id in following_ids,
            })
    schedule = []
    for dow in range(1, 8):
        items = days_map.get(dow, [])
        schedule.append({
            "weekday": dow,
            "weekday_cn": WEEKDAYS_CN[dow - 1],
            "weekday_en": "",
            "items": items,
        })
    return schedule


async def _refresh_cache(types: int):
    """Fetch fresh data and update cache in background."""
    cache_key = f"anime_schedule_{types}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                BILIBILI_TIMELINE_URL,
                headers=HEADERS,
                params={"types": types, "before": 3, "after": 7},
            )
            data = resp.json()
        if data.get("code") != 0:
            return
        with get_db() as conn:
            rows = conn.execute("SELECT anime_id FROM anime_following").fetchall()
        following_ids = {r["anime_id"] for r in rows}
        schedule = _build_schedule(data, following_ids)
        set_cached(cache_key, schedule, CACHE_TTL["anime"])
    except Exception:
        pass


@router.get("/schedule")
async def get_anime_schedule(
    types: int = Query(default=1, description="1=番剧, 4=国创, 3=电影"),
    background_tasks: BackgroundTasks = None,
):
    cache_key = f"anime_schedule_{types}"

    # Return fresh cache if available
    cached = get_cached(cache_key)
    if cached:
        return cached

    # Return stale cache immediately, refresh in background
    stale = get_stale(cache_key)
    if stale and background_tasks is not None:
        background_tasks.add_task(_refresh_cache, types)
        return stale

    # No cache at all — must fetch synchronously
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                BILIBILI_TIMELINE_URL,
                headers=HEADERS,
                params={"types": types, "before": 3, "after": 7},
            )
            data = resp.json()
    except Exception as e:
        return {"error": f"获取番剧日程失败: {str(e)}", "items": []}

    if data.get("code") != 0:
        return {"error": f"API 返回错误: {data.get('message', '未知错误')}", "items": []}

    with get_db() as conn:
        rows = conn.execute("SELECT anime_id FROM anime_following").fetchall()
    following_ids = {r["anime_id"] for r in rows}

    schedule = _build_schedule(data, following_ids)
    set_cached(cache_key, schedule, CACHE_TTL["anime"])
    return schedule


@router.get("/following")
async def get_following():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT anime_id, title, image, added_at FROM anime_following ORDER BY added_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("/follow")
async def follow_anime(item: dict):
    anime_id = item.get("id")
    title = item.get("title", "")
    image = item.get("image", "")
    if not anime_id:
        return {"error": "id is required"}
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO anime_following (anime_id, title, image, added_at) VALUES (?, ?, ?, ?)",
            (anime_id, title, image, datetime.now().isoformat()),
        )
    return {"ok": True}


@router.delete("/follow/{anime_id}")
async def unfollow_anime(anime_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM anime_following WHERE anime_id = ?", (anime_id,))
    return {"ok": True}
