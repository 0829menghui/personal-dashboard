import { useCallback, useState } from "react";
import { TrendingUp, Plus, X } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchStockIndices, fetchStockQuotes, addToWatchlist, removeFromWatchlist } from "../api";
import ModuleCard from "./ModuleCard";

export default function StockModule() {
  const [tab, setTab] = useState("indices");
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [tick, setTick] = useState(0);

  const indicesFetcher = useCallback(() => fetchStockIndices(), []);
  const quotesFetcher = useCallback(() => fetchStockQuotes(), [tick]);

  const { data: indices, loading: idxLoading, error: idxError, refresh: idxRefresh, lastUpdated: idxUpdated } = useFetch(indicesFetcher, 180000);
  const { data: quotes, loading: qLoading, error: qError, refresh: qRefresh, lastUpdated: qUpdated } = useFetch(quotesFetcher, 180000);

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

  const isIndices = tab === "indices";
  const items = isIndices ? (indices || []) : (quotes || []);
  const loading = isIndices ? idxLoading : qLoading;
  const error = isIndices ? idxError : qError;
  const refresh = isIndices ? idxRefresh : qRefresh;
  const updated = isIndices ? idxUpdated : qUpdated;

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
        <button className={`tab ${isIndices ? "tab-active" : ""}`} onClick={() => setTab("indices")}>大盘</button>
        <button className={`tab ${!isIndices ? "tab-active" : ""}`} onClick={() => setTab("watchlist")}>自选</button>
      </div>
      <div className="stock-table">
        <div className="stock-row stock-header-row">
          <span>名称</span><span>最新价</span><span>涨跌幅</span>
          {!isIndices && <span></span>}
        </div>
        {Array.isArray(items) && items.map((item, i) => (
          <div key={i} className="stock-row">
            <span className="stock-name">{item.name}</span>
            <span className="stock-price">{item.price?.toFixed(2)}</span>
            <span className={`stock-change ${item.change_pct >= 0 ? "up" : "down"}`}>
              {item.change_pct >= 0 ? "+" : ""}{item.change_pct?.toFixed(2)}%
            </span>
            {!isIndices && (
              <button className="icon-btn-xs" onClick={() => handleRemove(item.code)} title="移除">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!isIndices && (
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
