import { useState } from "react";
import { RefreshCw, Sun, Moon } from "lucide-react";

export default function Header() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <header className="header">
      <h1 className="header-title">Dashboard</h1>
      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} title={dark ? "亮色模式" : "暗色模式"}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-btn" onClick={() => window.location.reload()} title="刷新">
          <RefreshCw size={18} />
        </button>
      </div>
    </header>
  );
}
