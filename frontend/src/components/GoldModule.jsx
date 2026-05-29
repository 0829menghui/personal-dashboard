import { useCallback } from "react";
import { Gem } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchGoldPrice } from "../api";
import ModuleCard from "./ModuleCard";

export default function GoldModule() {
  const fetcher = useCallback(() => fetchGoldPrice(), []);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 300000);

  return (
    <ModuleCard
      icon={<Gem size={18} />}
      title="金价"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      {data && !data.error && (
        <div className="gold-card">
          <div className="gold-price-main">
            <span className="gold-label">上海金交所基准价</span>
            <span className="gold-value">{data.price_cny?.toFixed(2)}</span>
            <span className="gold-unit">元/克</span>
          </div>
          <div className="gold-details">
            <div className="gold-detail">
              <span>开盘</span><span>{data.open_cny?.toFixed(2)}</span>
            </div>
            <div className="gold-detail">
              <span>最高</span><span className="up">{data.high_cny?.toFixed(2)}</span>
            </div>
            <div className="gold-detail">
              <span>最低</span><span className="down">{data.low_cny?.toFixed(2)}</span>
            </div>
          </div>
          <div className="gold-date">日期: {data.date}</div>
        </div>
      )}
      {data?.error && <div className="module-error"><p>{data.error}</p></div>}
    </ModuleCard>
  );
}
