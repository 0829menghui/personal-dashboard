import { useState, useCallback } from "react";
import { Tv, Star, Heart } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAnimeSchedule, followAnime, unfollowAnime } from "../api";
import ModuleCard from "./ModuleCard";

const WEEKDAYS_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const ANIME_TYPES = [
  { key: 1, label: "番剧" },
  { key: 4, label: "国创" },
  { key: 3, label: "电影" },
];

export default function AnimeModule() {
  const today = new Date().getDay();
  const defaultDay = today === 0 ? 6 : today - 1;
  const [day, setDay] = useState(defaultDay);
  const [animeType, setAnimeType] = useState(1);
  const [tick, setTick] = useState(0);

  const fetcher = useCallback(() => fetchAnimeSchedule(animeType), [animeType, tick]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 21600000);

  const schedule = Array.isArray(data) ? data : [];
  const currentDay = schedule.find((d) => d.weekday === day + 1);
  const items = currentDay?.items || [];

  const handleFollow = async (item) => {
    if (item.followed) {
      await unfollowAnime(item.id);
    } else {
      await followAnime({ id: item.id, title: item.name_cn || item.title, image: item.image });
    }
    setTick((t) => t + 1);
  };

  return (
    <ModuleCard
      icon={<Tv size={18} />}
      title="番剧"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      <div className="tab-bar">
        {ANIME_TYPES.map((t) => (
          <button
            key={t.key}
            className={`tab ${animeType === t.key ? "tab-active" : ""}`}
            onClick={() => setAnimeType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-bar">
        {WEEKDAYS_CN.map((label, i) => (
          <button
            key={i}
            className={`tab ${day === i ? "tab-active" : ""}`}
            onClick={() => setDay(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="anime-list">
        {items.map((item) => (
          <li key={item.id} className={`anime-item ${item.followed ? "anime-followed" : ""}`}>
            {item.image && (
              <img src={item.image} alt={item.title} className="anime-cover" loading="lazy" />
            )}
            <div className="anime-info">
              <div className="anime-title">
                {item.pub_index && <span className="anime-ep">{item.pub_index}</span>}
                {item.name_cn || item.title}
              </div>
              <div className="anime-meta">
                {item.rating > 0 && (
                  <span className="anime-rating">
                    <Star size={12} /> {item.rating.toFixed(1)}
                  </span>
                )}
                {item.air_time && <span className="anime-time">{item.air_time}</span>}
              </div>
            </div>
            <button
              className={`anime-follow-btn ${item.followed ? "followed" : ""}`}
              onClick={() => handleFollow(item)}
              title={item.followed ? "取消追番" : "追番"}
            >
              <Heart size={14} fill={item.followed ? "currentColor" : "none"} />
            </button>
          </li>
        ))}
        {items.length === 0 && !loading && (
          <li className="anime-empty">暂无更新</li>
        )}
      </ul>
    </ModuleCard>
  );
}
