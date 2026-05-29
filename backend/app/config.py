from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "dashboard.db"

CACHE_TTL = {
    "trending": 300,
    "stock_indices": 180,
    "stock_quotes": 180,
    "gold": 300,
    "ai_news": 1800,
    "deals": 900,
    "anime": 21600,
}

AI_RSS_FEEDS = [
    "https://36kr.com/feed",
    "https://hnrss.org/frontpage",
    "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
]

AI_KEYWORDS = [
    "AI", "LLM", "GPT", "Claude", "Gemini", "OpenAI", "Anthropic",
    "deep learning", "neural", "transformer", "AGI", "diffusion",
    "machine learning", "大模型", "人工智能", "深度学习",
    "DeepSeek", "Mistral", "Llama", "Sora", "ChatGPT", "Copilot",
    "机器人", "自动驾驶", "算力", "芯片",
]

BANGUMI_API_BASE = "https://api.bgm.tv"

DEALS_RSS_FEEDS = [
    "https://www.smzdm.com/dingyue",
]
