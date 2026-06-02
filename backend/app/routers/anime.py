import httpx
from datetime import datetime
from fastapi import APIRouter, Query
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL
from ..database import get_db

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://www.bilibili.com/",
}

BILIBILI_TIMELINE_URL = "https://bangumi.bilibili.com/web_api/timeline_global"

TYPE_MAP = {
    "bangumi": 1,   # 番剧 (日本动画)
    "guochuang": 4,  # 国创 (国产动画)
    "movie": 3,      # 电影 (动画电影)
}

WEEKDAYS_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


def _day_to_weekday(date_str: str) -> int:
    """Convert '6-2' to weekday number (1=Mon, 7=Sun)."""
    try:
        parts = date_str.split("-")
        month, day = int(parts[0]), int(parts[1])
        now = datetime.now()
        year = now.year
        if month < now.month or (month == now.month and day < now.day):
            year += 1
        dt = datetime(year, month, day)
        return dt.isoweekday()
    except Exception:
        return 1


@router.get("/schedule")
async def get_anime_schedule(types: int = Query(default=1, description="1=番剧, 4=国创, 3=电影")):
    cache_key = f"anime_schedule_{types}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                BILIBILI_TIMELINE_URL,
                headers=HEADERS,
                params={"types": types},
            )
            data = resp.json()
    except Exception as e:
        return {"error": f"获取番剧日程失败: {str(e)}", "items": []}

    if data.get("code") != 0:
        return {"error": f"API 返回错误: {data.get('message', '未知错误')}", "items": []}

    with get_db() as conn:
        rows = conn.execute("SELECT anime_id FROM anime_following").fetchall()
    following_ids = {r["anime_id"] for r in rows}

    # Group episodes by day_of_week
    days_map = {}
    for day_data in data.get("result", []):
        dow = day_data.get("day_of_week", 0)  # 1=Mon, 7=Sun in bilibili
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
            "weekday_cn": WEEKDAYS_CN[dow - 1] if dow <= 7 else "",
            "weekday_en": "",
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
