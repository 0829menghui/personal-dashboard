import json
from datetime import datetime, timezone
from typing import Optional
from .database import get_db


def get_cached(key: str) -> Optional[dict]:
    with get_db() as conn:
        row = conn.execute(
            "SELECT data, fetched_at, ttl_seconds FROM cache WHERE key = ?", (key,)
        ).fetchone()
    if not row:
        return None
    fetched = datetime.fromisoformat(row["fetched_at"])
    now = datetime.now(timezone.utc)
    if (now - fetched).total_seconds() > row["ttl_seconds"]:
        return None
    return json.loads(row["data"])


def set_cached(key: str, data: dict, ttl: int):
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (key, data, fetched_at, ttl_seconds) VALUES (?, ?, ?, ?)",
            (key, json.dumps(data, ensure_ascii=False), datetime.now(timezone.utc).isoformat(), ttl),
        )


def get_stale(key: str) -> Optional[dict]:
    with get_db() as conn:
        row = conn.execute(
            "SELECT data FROM cache WHERE key = ?", (key,)
        ).fetchone()
    if not row:
        return None
    return json.loads(row["data"])
