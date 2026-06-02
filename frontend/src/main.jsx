import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Header from "./components/Header";
import TrendingModule from "./components/TrendingModule";
import StockModule from "./components/StockModule";
import GoldModule from "./components/GoldModule";
import AiNewsModule from "./components/AiNewsModule";
import DealsModule from "./components/DealsModule";
import AnimeModule from "./components/AnimeModule";
import "./styles.css";

const TABS = [
  { key: "all", label: "全部" },
  { key: "trending", label: "热搜" },
  { key: "finance", label: "财经" },
  { key: "news", label: "资讯" },
  { key: "anime", label: "番剧" },
];

function App() {
  const [tab, setTab] = useState("all");

  const show = (key) => tab === "all" || tab === key;

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
        {show("trending") && <TrendingModule />}
        {show("finance") && <StockModule />}
        {show("finance") && <GoldModule />}
        {show("news") && <AiNewsModule />}
        {show("news") && <DealsModule />}
        {show("anime") && <AnimeModule />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
