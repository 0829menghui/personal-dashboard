import React, { useState, lazy, Suspense, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import Header from "./components/Header";
import "./styles.css";

const TrendingModule = lazy(() => import("./components/TrendingModule"));
const StockModule = lazy(() => import("./components/StockModule"));
const GoldModule = lazy(() => import("./components/GoldModule"));
const AiNewsModule = lazy(() => import("./components/AiNewsModule"));
const DealsModule = lazy(() => import("./components/DealsModule"));
const AnimeModule = lazy(() => import("./components/AnimeModule"));
const WeatherModule = lazy(() => import("./components/WeatherModule"));
const GithubModule = lazy(() => import("./components/GithubModule"));

const TABS = [
  { key: "trending", label: "热搜" },
  { key: "finance", label: "财经" },
  { key: "news", label: "资讯" },
  { key: "anime", label: "番剧" },
  { key: "dev", label: "开发者" },
];

function Skeleton() {
  return <div className="skeleton-card"><div className="skeleton-line" /><div className="skeleton-line short" /><div className="skeleton-line" /></div>;
}

function App() {
  const [tab, setTab] = useState("trending");
  const [refreshing, setRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);

  // Pull-to-refresh
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) setPullStart(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (pullStart > 0) {
      const dist = e.changedTouches[0].clientY - pullStart;
      if (dist > 80) {
        setRefreshing(true);
        setTimeout(() => setRefreshing((r) => { if (r) window.location.reload(); return r; }), 100);
        setTimeout(() => setRefreshing(false), 2000);
      }
      setPullStart(0);
    }
  }, [pullStart]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div className="app">
      <Header />

      <nav className="top-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`nav-tab ${tab === t.key ? "nav-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {refreshing && <div className="pull-indicator">刷新中...</div>}

      <main className="dashboard-grid">
        <Suspense fallback={<Skeleton />}>
          {tab === "trending" && <><TrendingModule /><WeatherModule /></>}
          {tab === "finance" && <><StockModule /><GoldModule /></>}
          {tab === "news" && <><AiNewsModule /><DealsModule /></>}
          {tab === "anime" && <AnimeModule />}
          {tab === "dev" && <GithubModule />}
        </Suspense>
      </main>
    </div>
  );
}

// Dark mode init
const saved = localStorage.getItem("theme");
if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
else if (saved === "light") document.documentElement.setAttribute("data-theme", "light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
