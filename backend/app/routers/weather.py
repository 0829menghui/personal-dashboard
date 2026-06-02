import httpx
from fastapi import APIRouter, Query
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL

router = APIRouter()

WEATHER_URL = "https://wttr.in"


@router.get("")
async def get_weather(city: str = Query(default="Shanghai", description="City name")):
    cache_key = f"weather_{city}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(f"{WEATHER_URL}/{city}", params={"format": "j1"})
            data = resp.json()

        current = data.get("current_condition", [{}])[0]
        forecast = data.get("weather", [])

        result = {
            "city": city,
            "current": {
                "temp_c": current.get("temp_C", ""),
                "feels_like": current.get("FeelsLikeC", ""),
                "humidity": current.get("humidity", ""),
                "weather_desc": current.get("weatherDesc", [{}])[0].get("value", ""),
                "weather_code": current.get("weatherCode", ""),
                "wind_speed": current.get("windspeedKmph", ""),
                "wind_dir": current.get("winddir16Point", ""),
            },
            "forecast": [
                {
                    "date": f.get("date", ""),
                    "max_c": f.get("maxtempC", ""),
                    "min_c": f.get("mintempC", ""),
                    "weather_desc": f.get("weatherDesc", [{}])[0].get("value", ""),
                    "weather_code": f.get("weatherCode", ""),
                }
                for f in forecast[:4]
            ],
        }
        set_cached(cache_key, result, 1800)  # 30 min
        return result
    except Exception as e:
        return {"error": f"获取天气失败: {str(e)}"}
