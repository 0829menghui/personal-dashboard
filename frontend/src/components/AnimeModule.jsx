import { useState, useCallback, useRef, useEffect } from "react";
import { Tv, Star, Heart } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAnimeSchedule, followAnime, unfollowAnime } from "../api";
import ModuleCard from "./ModuleCard";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const CATEGORIES = [
  { key: 1, label: "日漫", types: 1 },
  { key: 4, label: "国产", types: 4 },
  { key: 3, label: "电影", types: 3 },
];

export default function AnimeModule() {
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  const [category, setCategory] = useState(1);
  const [tick, setTick] = useState(0);
  const scrollRef = useRef(null);

  const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const fetcher = useCallback(() => fetchAnimeSchedule(cat.types), [cat.types, tick]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 21600000);

  const schedule = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (schedule.length > 0 && scrollRef.current) {
      const todayCol = scrollRef.current.querySelector(`[data-day="${todayIdx}"]`);
      if (todayCol) todayCol.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [schedule, todayIdx]);

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

      <div className="calendar-scroll" ref={scrollRef}>
        {schedule.map((day, idx) => {
          const isToday = idx === todayIdx;
          const items = day.items || [];
          return (
            <div key={day.weekday} className={`cal-col ${isToday ? "cal-col-today" : ""}`} data-day={idx}>
              <div className="cal-day">
                <span>{day.weekday_cn}</span>
                {isToday && <span className="cal-today-dot" />}
              </div>
              {items.length === 0 ? (
                <div className="cal-empty">—</div>
              ) : (
                items.map((item, i) => (
                  <div key={`${item.id}-${i}`} className={`cal-card ${item.followed ? "cal-followed" : ""}`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="cal-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="cal-cover-pl" />
                    )}
                    <div className="cal-info">
                      <div className="cal-title">{item.name_cn || item.title}</div>
                      <div className="cal-meta">
                        {item.pub_index && <span>{item.pub_index}</span>}
                        {item.air_time && <span>{item.air_time}</span>}
                      </div>
                    </div>
                    <button
                      className={`anime-follow-btn ${item.followed ? "followed" : ""}`}
                      onClick={() => handleFollow(item)}
                      title={item.followed ? "取消追番" : "追番"}
                    >
                      <Heart size={13} fill={item.followed ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </ModuleCard>
  );
}
