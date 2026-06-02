import { useState, useCallback, useRef, useEffect } from "react";
import { Tv, Star, Heart, ExternalLink } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAnimeSchedule, followAnime, unfollowAnime } from "../api";
import ModuleCard from "./ModuleCard";

const WEEKDAYS_CN = ["一", "二", "三", "四", "五", "六", "日"];

const CATEGORIES = [
  { key: 1, label: "日漫", types: 1 },
  { key: 4, label: "国产", types: 4 },
  { key: 3, label: "电影", types: 3 },
];

export default function AnimeModule() {
  const today = new Date().getDay();
  const defaultDay = today === 0 ? 6 : today - 1;
  const [category, setCategory] = useState(1);
  const [day, setDay] = useState(defaultDay);
  const [tick, setTick] = useState(0);
  const weekRef = useRef(null);

  const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const fetcher = useCallback(() => fetchAnimeSchedule(cat.types), [cat.types, tick]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 21600000);

  const schedule = Array.isArray(data) ? data : [];
  const currentDay = schedule.find((d) => d.weekday === day + 1);
  const items = currentDay?.items || [];

  // Auto-scroll today into view
  useEffect(() => {
    if (schedule.length > 0 && weekRef.current) {
      const todayBtn = weekRef.current.children[defaultDay];
      if (todayBtn) todayBtn.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [schedule, defaultDay]);

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
      {/* Category + Weekday combined */}
      <div className="anime-header">
        <div className="tab-bar anime-cat-tabs">
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
        <div className="anime-week-tabs" ref={weekRef}>
          {WEEKDAYS_CN.map((label, i) => {
            const isToday = i === defaultDay;
            const isActive = day === i;
            const count = schedule[i]?.items.length || 0;
            return (
              <button
                key={i}
                className={`anime-day-tab ${isActive ? "anime-day-active" : ""} ${isToday ? "anime-day-today" : ""}`}
                onClick={() => setDay(i)}
              >
                <span className="anime-day-name">{isToday ? "今" : label}</span>
                {count > 0 && <span className="anime-day-num">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="anime-list">
        {items.map((item, i) => (
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
                  <span className="anime-rating"><Star size={12} />{item.rating.toFixed(1)}</span>
                )}
              </div>
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="anime-play-link" title="观看">
                <ExternalLink size={14} />
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
        {items.length === 0 && !loading && <li className="anime-empty">暂无更新</li>}
      </ul>
    </ModuleCard>
  );
}
