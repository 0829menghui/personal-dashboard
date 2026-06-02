import { useCallback, useState } from "react";
import { TrendingUp, Plus, X } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchStockIndices, fetchStockQuotes, fetchStockSectors, addToWatchlist, removeFromWatchlist } from "../api";
import ModuleCard from "./ModuleCard";

export default function StockModule() {
  const [tab, setTab] = useState("indices");
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [tick, setTick] = useState(0);

  const indicesFetcher = useCallback(() => fetchStockIndices(), []);
  const quotesFetcher = useCallback(() => fetchStockQuotes(), [tick]);
  const sectorsFetcher = useCallback(() => fetchStockSectors(), []);

  const { data: indices, loading: idxLoading, error: idxError, refresh: idxRefresh, lastUpdated: idxUpdated } = useFetch(indicesFetcher, 180000);
  const { data: quotes, loading: qLoading, error: qError, refresh: qRefresh, lastUpdated: qUpdated } = useFetch(quotesFetcher, 180000);
  const { data: sectors, loading: sLoading, error: sError, refresh: sRefresh, lastUpdated: sUpdated } = useFetch(sectorsFetcher, 300000);

  const handleAdd = async () => {
    if (!addCode.trim()) return;
    await addToWatchlist(addCode.trim(), addName.trim() || addCode.trim());
    setAddCode("");
    setAddName("");
    setTick((t) => t + 1);
  };

  const handleRemove = async (code) => {
    await removeFromWatchlist(code);
    setTick((t) => t + 1);
  };

  const getTabData = () => {
    switch (tab) {
      case "indices": return { items: indices || [], loading: idxLoading, error: idxError, refresh: idxRefresh, updated: idxUpdated };
      case "watchlist": return { items: quotes || [], loading: qLoading, error: qError, refresh: qRefresh, updated: qUpdated };
      case "sectors": return { items: sectors || [], loading: sLoading, error: sError, refresh: sRefresh, updated: sUpdated };
      default: return { items: [], loading: false, error: null, refresh: () => {}, updated: null };
    }
  };

  const { items, loading, error, refresh, updated } = getTabData();

  return (
    <ModuleCard
      icon={<TrendingUp size={18} />}
      title="股市"
      loading={loading}
      error={error}
      lastUpdated={updated}
      onRefresh={refresh}
    >
      <div className="tab-bar">
        <button className={`tab ${tab === "indices" ? "tab-active" : ""}`} onClick={() => setTab("indices")}>大盘</button>
        <button className={`tab ${tab === "sectors" ? "tab-active" : ""}`} onClick={() => setTab("sectors")}>板块</button>
        <button className={`tab ${tab !== "indices" && tab !== "sectors" ? "tab-active" : ""}`} onClick={() => setTab("watchlist")}>自选</button>
      </div>
      <div className="stock-table">
        <div className="stock-row stock-header-row">
          <span>名称</span><span>最新价</span><span>涨跌幅</span>
          {tab === "watchlist" && <span></span>}
        </div>
        {Array.isArray(items) && items.map((item, i) => (
          <div key={i} className="stock-row">
            <span className="stock-name">{item.name}</span>
            <span className="stock-price">{item.price?.toFixed(2)}</span>
            <span className={`stock-change ${item.change_pct >= 0 ? "up" : "down"}`}>
              {item.change_pct >= 0 ? "+" : ""}{item.change_pct?.toFixed(2)}%
            </span>
            {tab === "watchlist" && (
              <button className="icon-btn-xs" onClick={() => handleRemove(item.code)} title="移除">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      {tab === "watchlist" && (
        <div className="stock-add">
          <input
            className="stock-input"
            placeholder="代码"
            value={addCode}
            onChange={(e) => setAddCode(e.target.value)}
          />
          <input
            className="stock-input"
            placeholder="名称"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
          <button className="icon-btn-sm" onClick={handleAdd} title="添加">
            <Plus size={14} />
          </button>
        </div>
      )}
    </ModuleCard>
  );
}
