import re
import httpx
from fastapi import APIRouter, Query
from ..cache import get_cached, set_cached
from ..config import CACHE_TTL

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
}

GITHUB_TRENDING_URL = "https://github.com/trending"


@router.get("")
async def get_github_trending(
    language: str = Query(default="", description="Language filter, empty=all"),
    since: str = Query(default="daily", description="daily, weekly, monthly"),
):
    cache_key = f"github_trending_{language}_{since}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        params = {"since": since}
        if language:
            params["language"] = language
        # Build URL with language path
        url = GITHUB_TRENDING_URL
        if language:
            url = f"{GITHUB_TRENDING_URL}/{language}"
        url = f"{url}?since={since}"

        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            html = resp.text

        # Parse trending repos from HTML
        repos = []
        # Match repo blocks: h2 with link to /owner/repo
        repo_blocks = re.split(r'<article\s+class="Box-row"', html)[1:]

        for block in repo_blocks[:25]:
            # Repo name
            name_match = re.search(r'href="(/[^/]+/[^"]+)"', block)
            if not name_match:
                continue
            full_name = name_match.group(1).strip("/")

            # Description
            desc_match = re.search(r'<p\s+class="col-9[^"]*">\s*(.*?)\s*</p>', block, re.DOTALL)
            description = ""
            if desc_match:
                description = re.sub(r"<[^>]+>", "", desc_match.group(1)).strip()[:200]

            # Language
            lang_match = re.search(r'itemprop="programmingLanguage"[^>]*>([^<]+)<', block)
            language_name = lang_match.group(1).strip() if lang_match else ""

            # Stars
            stars_match = re.search(r'(\d[\d,]*)\s*stars\s+(today|this week|this month)', block, re.IGNORECASE)
            stars_today = ""
            if stars_match:
                stars_today = stars_match.group(1)

            # Total stars
            total_stars_match = re.search(r'(\d[\d,]*)\s*</svg>\s*</a>\s*$', block, re.MULTILINE)
            if not total_stars_match:
                total_stars_match = re.search(r'(\d[\d,k]+)</a>', block)

            repos.append({
                "full_name": full_name,
                "name": full_name.split("/")[-1] if "/" in full_name else full_name,
                "owner": full_name.split("/")[0] if "/" in full_name else "",
                "description": description,
                "language": language_name,
                "stars_today": stars_today,
                "url": f"https://github.com/{full_name}",
            })

        set_cached(cache_key, repos, 3600)  # 1 hour
        return repos
    except Exception as e:
        return {"error": f"获取GitHub热榜失败: {str(e)}"}
