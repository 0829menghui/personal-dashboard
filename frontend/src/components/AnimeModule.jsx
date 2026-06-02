import { useState, useCallback } from "react";
import { Tv, Star, Heart, ExternalLink } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAnimeSchedule, followAnime, unfollowAnime } from "../api";
import ModuleCard from "./ModuleCard";

const WEEKDAYS_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const PLATFORMS = [
  { key: "bilibili", label: "B站" },
  { key: "tencent", label: "腾讯" },
];

const CATEGORIES = [
  { key: 1, label: "日漫", types: 1 },
  { key: 4, label: "国产", types: 4 },
  { key: 3, label: "电影", types: 3 },
];

export default function AnimeModule() {
  const [platform, setPlatform] = useState("bilibili");
  const [category, setCategory] = useState(1);
  const [tick, setTick] = useState(0);

  const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const fetcher = useCallback(() => {
    if (platform !== "bilibili") return Promise.resolve(null);
    return fetchAnimeSchedule(cat.types);
  }, [platform, cat.types, tick]);

  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 21600000);

  const schedule = Array.isArray(data) ? data : [];

  const handleFollow = async (item) => {
    if (item.followed) {
      await unfollowAnime(item.id);
    } else {
      await followAnime({ id: item.id, title: item.name_cn || item.title, image: item.image });
    }
    setTick((t) => t + 1);
  };

  // Check if today
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

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
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            className={`tab ${platform === p.key ? "tab-active" : ""}`}
            onClick={() => setPlatform(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="tab-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`tab ${category === c.key ? "tab-active" : ""}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {platform === "tencent" ? (
        <div className="module-placeholder">
          <p>腾讯视频暂未开放追番API</p>
          <a
            href="https://v.qq.com/channel/cartoon"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <ExternalLink size={14} /> 前往腾讯视频动漫频道
          </a>
        </div>
      ) : (
        <div className="anime-weekly">
          {schedule.map((day) => {
            const isToday = day.weekday - 1 === todayIdx;
            return (
              <div key={day.weekday} className={`anime-day-group ${isToday ? "anime-day-today" : ""}`}>
                <div className="anime-day-header">
                  <span className="anime-day-label">{day.weekday_cn}</span>
                  {isToday && <span className="anime-today-badge">今天</span>}
                  <span className="anime-day-count">{day.items.length}部</span>
                </div>
                {day.items.length === 0 ? (
                  <div className="anime-day-empty">暂无</div>
                ) : (
                  <ul className="anime-list">
                    {day.items.map((item, i) => (
                      <li key={`${item.id}-${i}`} className={`anime-item ${item.followed ? "anime-followed" : ""}`}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="anime-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : null}
                        <div className="anime-info">
                          <div className="anime-title">
                            {item.pub_index && <span className="anime-ep">{item.pub_index}</span>}
                            {item.name_cn || item.title}
                          </div>
                          <div className="anime-meta">
                            {item.air_time && <span className="anime-time">{item.air_time}</span>}
                            {item.rating > 0 && (
                              <span className="anime-rating">
                                <Star size={12} /> {item.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="anime-play-link"
                            title="观看"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          className={`anime-follow-btn ${item.followed ? "followed" : ""}`}
                          onClick={() => handleFollow(item)}
                          title={item.followed ? "取消追番" : "追番"}
                        >
                          <Heart size={14} fill={item.followed ? "currentColor" : "none"} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ModuleCard>
  );
}
