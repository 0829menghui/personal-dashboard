import { RefreshCw, Loader2 } from "lucide-react";

export default function ModuleCard({ icon, title, loading, error, lastUpdated, onRefresh, children }) {
  const timeAgo = lastUpdated
    ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)}分钟前`
    : "";

  return (
    <div className="module-card">
      <div className="module-header">
        <div className="module-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="module-actions">
          {timeAgo && <span className="module-time">{timeAgo}</span>}
          <button className="icon-btn-sm" onClick={onRefresh} disabled={loading} title="刷新">
            {loading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>
      <div className="module-body">
        {error ? (
          <div className="module-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={onRefresh}>重试</button>
          </div>
        ) : loading && !children ? (
          <div className="skeleton-list">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton-item" />)}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
