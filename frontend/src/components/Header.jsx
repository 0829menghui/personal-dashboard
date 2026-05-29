import { RefreshCw } from "lucide-react";

export default function Header({ onRefresh }) {
  return (
    <header className="header">
      <h1 className="header-title">Dashboard</h1>
      <button className="icon-btn" onClick={onRefresh} title="刷新全部">
        <RefreshCw size={20} />
      </button>
    </header>
  );
}
