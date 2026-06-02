import { useState, useCallback } from "react";
import { Gem } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchGoldPrice, fetchLondonGold, fetchSilver } from "../api";
import ModuleCard from "./ModuleCard";

const TYPES = [
  { key: "sge", label: "上海金" },
  { key: "london", label: "伦敦金" },
  { key: "silver", label: "白银" },
];

const FETCHERS = {
  sge: fetchGoldPrice,
  london: fetchLondonGold,
  silver: fetchSilver,
};

export default function GoldModule() {
  const [metalType, setMetalType] = useState("sge");
  const fetcher = useCallback(() => FETCHERS[metalType](), [metalType]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 300000);

  return (
    <ModuleCard
      icon={<Gem size={18} />}
      title="贵金属"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      <div className="tab-bar">
        {TYPES.map((t) => (
          <button
            key={t.key}
            className={`tab ${metalType === t.key ? "tab-active" : ""}`}
            onClick={() => setMetalType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {data && !data.error && (
        <div className="gold-card">
          <div className="gold-price-main">
            <span className="gold-label">{data.label || "金价"}</span>
            <span className="gold-value">{data.price_cny?.toFixed(2) || "—"}</span>
            <span className="gold-unit">元/克</span>
          </div>
          <div className="gold-details">
            <div className="gold-detail">
              <span>开盘</span><span>{data.open_cny?.toFixed(2) || "—"}</span>
            </div>
            <div className="gold-detail">
              <span>最高</span><span className="up">{data.high_cny?.toFixed(2) || "—"}</span>
            </div>
            <div className="gold-detail">
              <span>最低</span><span className="down">{data.low_cny?.toFixed(2) || "—"}</span>
            </div>
          </div>
          {data.date && <div className="gold-date">日期: {data.date}</div>}
        </div>
      )}
      {data?.error && <div className="module-error"><p>{data.error}</p></div>}
    </ModuleCard>
  );
}
