const API_BASE = import.meta.env.VITE_API_BASE || "/personal-dashboard/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const fetchTrending = (source) =>
  request(source ? `/v1/trending/${source}` : "/v1/trending");

export const fetchStockIndices = () => request("/v1/stock/indices");
export const fetchStockQuotes = () => request("/v1/stock/quotes");
export const fetchWatchlist = () => request("/v1/stock/watchlist");
export const addToWatchlist = (code, name) =>
  request("/v1/stock/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name }),
  });
export const removeFromWatchlist = (code) =>
  request(`/v1/stock/watchlist/${code}`, { method: "DELETE" });

export const fetchGoldPrice = () => request("/v1/gold/price");
export const fetchAiNews = () => request("/v1/ai-news");
export const fetchDeals = () => request("/v1/deals");

export const fetchAnimeSchedule = () => request("/v1/anime/schedule");
export const fetchAnimeFollowing = () => request("/v1/anime/following");
export const followAnime = (item) =>
  request("/v1/anime/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
export const unfollowAnime = (id) =>
  request(`/v1/anime/follow/${id}`, { method: "DELETE" });
