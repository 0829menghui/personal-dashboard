import React, { useState, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import Header from "./components/Header";
import "./styles.css";

const TrendingModule = lazy(() => import("./components/TrendingModule"));
const StockModule = lazy(() => import("./components/StockModule"));
const GoldModule = lazy(() => import("./components/GoldModule"));
const AiNewsModule = lazy(() => import("./components/AiNewsModule"));
const DealsModule = lazy(() => import("./components/DealsModule"));
const AnimeModule = lazy(() => import("./components/AnimeModule"));

const TABS = [
  { key: "trending", label: "热搜" },
  { key: "finance", label: "财经" },
  { key: "news", label: "资讯" },
  { key: "anime", label: "番剧" },
];

function Skeleton() {
  return <div className="skeleton-card"><div className="skeleton-line" /><div className="skeleton-line short" /><div className="skeleton-line" /></div>;
}

function App() {
  const [tab, setTab] = useState("trending");

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

      <main className="dashboard-grid">
        <Suspense fallback={<Skeleton />}>
          {tab === "trending" && <TrendingModule />}
          {tab === "finance" && <><StockModule /><GoldModule /></>}
          {tab === "news" && <><AiNewsModule /><DealsModule /></>}
          {tab === "anime" && <AnimeModule />}
        </Suspense>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
