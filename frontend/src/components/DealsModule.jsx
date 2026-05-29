import { useCallback } from "react";
import { Tag } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchDeals } from "../api";
import ModuleCard from "./ModuleCard";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

export default function DealsModule() {
  const fetcher = useCallback(() => fetchDeals(), []);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 900000);

  const items = Array.isArray(data) ? data : [];

  return (
    <ModuleCard
      icon={<Tag size={18} />}
      title="折扣"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
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
