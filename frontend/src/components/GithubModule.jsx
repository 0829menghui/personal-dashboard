import { useState, useCallback } from "react";
import { Star, GitBranch } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchGithubTrending } from "../api";
import ModuleCard from "./ModuleCard";

const LANGUAGES = [
  { key: "", label: "全部" },
  { key: "python", label: "Python" },
  { key: "javascript", label: "JS" },
  { key: "typescript", label: "TS" },
  { key: "go", label: "Go" },
  { key: "rust", label: "Rust" },
  { key: "java", label: "Java" },
];

const SINCE_OPTIONS = [
  { key: "daily", label: "今日" },
  { key: "weekly", label: "本周" },
  { key: "monthly", label: "本月" },
];

export default function GithubModule() {
  const [language, setLanguage] = useState("");
  const [since, setSince] = useState("daily");

  const fetcher = useCallback(() => fetchGithubTrending(language, since), [language, since]);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 3600000);

  const items = Array.isArray(data) ? data : [];

  return (
    <ModuleCard
      icon={<GitBranch size={18} />}
      title="GitHub 热榜"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      <div className="tab-bar">
        {SINCE_OPTIONS.map((s) => (
          <button
            key={s.key}
            className={`tab ${since === s.key ? "tab-active" : ""}`}
            onClick={() => setSince(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="tab-bar">
        {LANGUAGES.map((l) => (
          <button
            key={l.key}
            className={`tab ${language === l.key ? "tab-active" : ""}`}
            onClick={() => setLanguage(l.key)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <ul className="news-list">
        {items.map((item, i) => (
          <li key={i} className="news-item">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-title">
              {item.full_name}
            </a>
            {item.description && <p className="news-summary">{item.description}</p>}
            <div className="news-meta">
              {item.language && <span className="news-source">{item.language}</span>}
              {item.stars_today && (
                <span className="github-stars">
                  <Star size={11} /> {item.stars_today} stars today
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
