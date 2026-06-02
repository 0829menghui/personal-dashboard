import { useState, useCallback } from "react";
import { Zap } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchDeals } from "../api";
import ModuleCard from "./ModuleCard";

const SOURCES = [
  { key: "36kr", label: "36氪" },
  { key: "huxiu", label: "虎嗅" },
  { key: "sspai", label: "少数派" },
];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export default function DealsModule() {
  const [source, setSource] = useState("36kr");
  const fetcher = useCallback(() => fetchDeals(source), [source]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 900000);

  const items = Array.isArray(data) ? data : [];

  return (
    <ModuleCard
      icon={<Zap size={18} />}
      title="快讯"
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
      <ul className="deals-list">
        {items.map((item, i) => (
          <li key={i} className="deal-item">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="deal-title">
              {item.title}
            </a>
            <div className="deal-meta">
              <span className="deal-source">{item.source}</span>
              <span className="deal-time">{timeAgo(item.published_at)}</span>
            </div>
            {item.summary && <p className="deal-summary">{item.summary}</p>}
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
