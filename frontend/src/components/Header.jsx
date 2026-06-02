import { RefreshCw } from "lucide-react";

export default function Header() {
  return (
    <header className="header">
      <h1 className="header-title">Dashboard</h1>
      <button className="icon-btn" onClick={() => window.location.reload()} title="刷新">
        <RefreshCw size={18} />
      </button>
    </header>
  );
}
