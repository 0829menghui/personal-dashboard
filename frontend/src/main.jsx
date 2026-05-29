import React from "react";
import ReactDOM from "react-dom/client";
import Header from "./components/Header";
import TrendingModule from "./components/TrendingModule";
import StockModule from "./components/StockModule";
import GoldModule from "./components/GoldModule";
import AiNewsModule from "./components/AiNewsModule";
import DealsModule from "./components/DealsModule";
import AnimeModule from "./components/AnimeModule";
import "./styles.css";

function App() {
  const handleRefreshAll = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      <Header onRefresh={handleRefreshAll} />
      <main className="dashboard-grid">
        <TrendingModule />
        <StockModule />
        <GoldModule />
        <AiNewsModule />
        <DealsModule />
        <AnimeModule />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
