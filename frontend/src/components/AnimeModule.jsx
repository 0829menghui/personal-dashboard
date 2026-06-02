import { useState, useCallback } from "react";
import { Tv, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAnimeSchedule, followAnime, unfollowAnime } from "../api";
import ModuleCard from "./ModuleCard";

const CATEGORIES = [
  { key: 1, label: "日漫", types: 1 },
  { key: 4, label: "国产", types: 4 },
  { key: 3, label: "电影", types: 3 },
];

export default function AnimeModule() {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  const [category, setCategory] = useState(1);
  const [collapsed, setCollapsed] = useState({});
  const [tick, setTick] = useState(0);

  const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const fetcher = useCallback(() => fetchAnimeSchedule(cat.types), [cat.types, tick]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 21600000);

  const schedule = Array.isArray(data) ? data : [];

  // Default: collapse all days except today
  const getCollapsed = (idx) => {
    if (idx in collapsed) return collapsed[idx];
    return idx !== todayIdx;
  };

  const toggleDay = (idx) => {
    setCollapsed((prev) => ({ ...prev, [idx]: !getCollapsed(idx) }));
  };

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
      title="追番日历"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
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

      <div className="anime-days">
        {schedule.map((day, idx) => {
          const isToday = idx === todayIdx;
          const items = day.items || [];
          const isCollapsed = getCollapsed(idx);
          return (
            <div key={day.weekday} className={`anime-day ${isToday ? "anime-day-now" : ""}`}>
              <button className="anime-day-bar" onClick={() => toggleDay(idx)}>
                <span className="anime-day-label">
                  {day.weekday_cn}
                  {isToday && <span className="anime-tag-today">今天</span>}
                </span>
                <span className="anime-day-info">
                  {items.length > 0 ? `${items.length}部` : "暂无"}
                </span>
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              {!isCollapsed && items.length > 0 && (
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
                      ) : (
                        <div className="anime-cover anime-cover-pl" />
                      )}
                      <div className="anime-info">
                        <div className="anime-title">{item.name_cn || item.title}</div>
                        <div className="anime-meta">
                          {item.pub_index && <span>{item.pub_index}</span>}
                          {item.air_time && <span>{item.air_time}</span>}
                        </div>
                      </div>
                      <button
                        className={`anime-follow-btn ${item.followed ? "followed" : ""}`}
                        onClick={() => handleFollow(item)}
                        title={item.followed ? "取消追番" : "追番"}
                      >
                        <Heart size={15} fill={item.followed ? "currentColor" : "none"} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!isCollapsed && items.length === 0 && (
                <div className="anime-empty">暂无更新</div>
              )}
            </div>
          );
        })}
      </div>
    </ModuleCard>
  );
}
