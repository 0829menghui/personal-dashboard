import { useCallback } from "react";
import { Brain } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchAiNews } from "../api";
import ModuleCard from "./ModuleCard";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export default function AiNewsModule() {
  const fetcher = useCallback(() => fetchAiNews(), []);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 1800000);

  const items = Array.isArray(data) ? data : [];

  return (
    <ModuleCard
      icon={<Brain size={18} />}
      title="AI 资讯"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      <ul className="news-list">
        {items.map((item, i) => (
          <li key={i} className="news-item">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-title">
              {item.title}
            </a>
            <div className="news-meta">
              <span className="news-source">{item.source}</span>
              <span className="news-time">{timeAgo(item.published_at)}</span>
            </div>
            {item.summary && <p className="news-summary">{item.summary}</p>}
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
