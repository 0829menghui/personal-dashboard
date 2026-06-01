import httpx
from datetime import datetime
from fastapi import APIRouter
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL, BANGUMI_API_BASE
from ..database import get_db

router = APIRouter()

HEADERS = {
    "User-Agent": "PersonalDashboard/1.0",
}


@router.get("/schedule")
async def get_anime_schedule():
    cache_key = "anime_schedule"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BANGUMI_API_BASE}/calendar",
                headers=HEADERS,
            )
            data = resp.json()
    except Exception as e:
        return {"error": f"获取动漫日程失败: {str(e)}", "items": []}

    with get_db() as conn:
        rows = conn.execute("SELECT anime_id FROM anime_following").fetchall()
    following_ids = {r["anime_id"] for r in rows}

    schedule = []
    for day in data:
        weekday = day.get("weekday", {})
        items = []
        for anime in day.get("items", []):
            anime_id = anime.get("id", 0)
            items.append({
                "id": anime_id,
                "title": anime.get("name", ""),
                "name_cn": anime.get("name_cn", ""),
                "image": anime.get("images", {}).get("large", ""),
                "rating": anime.get("rating", {}).get("score", 0),
                "air_date": anime.get("air_date", ""),
                "air_time": anime.get("air_time", ""),
                "followed": anime_id in following_ids,
            })
        schedule.append({
            "weekday": weekday.get("id", 0),
            "weekday_cn": weekday.get("cn", ""),
            "weekday_en": weekday.get("en", ""),
            "items": items,
        })

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
