import { useState, useCallback } from "react";
import { Flame } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchTrending } from "../api";
import ModuleCard from "./ModuleCard";

const SOURCES = [
  { key: "weibo", label: "微博" },
  { key: "zhihu", label: "知乎" },
  { key: "bilibili", label: "B站" },
];

export default function TrendingModule() {
  const [source, setSource] = useState("weibo");
  const fetcher = useCallback(() => fetchTrending(source), [source]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 300000);

  const items = Array.isArray(data) ? data : [];

  return (
    <ModuleCard
      icon={<Flame size={18} />}
      title="热搜"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      <div className="tab-bar">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            className={`tab ${source === s.key ? "tab-active" : ""}`}
            onClick={() => setSource(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ul className="trending-list">
        {items.map((item, i) => (
          <li key={i} className="trending-item">
            <span className={`trending-rank ${i < 3 ? "rank-hot" : ""}`}>{item.rank}</span>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="trending-title">
              {item.title}
            </a>
            {item.tag && <span className="trending-tag">{item.tag}</span>}
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
