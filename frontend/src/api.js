const API_BASE = import.meta.env.VITE_API_BASE || "/personal-dashboard/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Trending
export const fetchTrending = (source) =>
  request(source ? `/v1/trending/${source}` : "/v1/trending");

// Stock
export const fetchStockIndices = () => request("/v1/stock/indices");
export const fetchStockQuotes = () => request("/v1/stock/quotes");
export const fetchStockSectors = () => request("/v1/stock/sectors");
export const fetchWatchlist = () => request("/v1/stock/watchlist");
export const addToWatchlist = (code, name) =>
  request("/v1/stock/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name }),
  });
export const removeFromWatchlist = (code) =>
  request(`/v1/stock/watchlist/${code}`, { method: "DELETE" });

// Gold
export const fetchGoldPrice = () => request("/v1/gold/price");
export const fetchLondonGold = () => request("/v1/gold/london");
export const fetchSilver = () => request("/v1/gold/silver");

// AI News
export const fetchAiNews = (source = "all") => request(`/v1/ai-news?source=${source}`);

// Deals / News
export const fetchDeals = (source = "36kr") => request(`/v1/deals?source=${source}`);

// Anime
export const fetchAnimeSchedule = (types = 1) => request(`/v1/anime/schedule?types=${types}`);
export const fetchAnimeFollowing = () => request("/v1/anime/following");
export const followAnime = (item) =>
  request("/v1/anime/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
export const unfollowAnime = (id) =>
  request(`/v1/anime/follow/${id}`, { method: "DELETE" });

// Weather
export const fetchWeather = (city = "Shanghai") => request(`/v1/weather?city=${city}`);

// GitHub
export const fetchGithubTrending = (language = "", since = "daily") =>
  request(`/v1/github?language=${language}&since=${since}`);
