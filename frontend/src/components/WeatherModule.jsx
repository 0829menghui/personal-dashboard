import { useCallback } from "react";
import { Cloud } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchWeather } from "../api";
import ModuleCard from "./ModuleCard";

const WEATHER_ICONS = {
  "113": "☀️", "116": "⛅", "119": "☁️", "122": "☁️",
  "143": "🌫️", "176": "🌦️", "179": "🌨️", "182": "🌨️",
  "185": "🌨️", "200": "⛈️", "227": "🌨️", "230": "🌨️",
  "248": "🌫️", "260": "🌫️", "263": "🌧️", "266": "🌧️",
  "281": "🌧️", "284": "🌧️", "293": "🌧️", "296": "🌧️",
  "299": "🌧️", "302": "🌧️", "305": "🌧️", "308": "🌧️",
  "311": "🌧️", "314": "🌧️", "317": "🌧️", "320": "🌨️",
  "323": "🌨️", "326": "🌨️", "329": "🌨️", "332": "🌨️",
  "335": "🌨️", "338": "🌨️", "350": "🌨️", "353": "🌧️",
  "356": "🌧️", "359": "🌧️", "362": "🌨️", "365": "🌨️",
  "368": "🌨️", "371": "🌨️", "374": "🌨️", "377": "🌨️",
  "386": "⛈️", "389": "⛈️", "392": "⛈️", "395": "🌨️",
};

export default function WeatherModule() {
  const fetcher = useCallback(() => fetchWeather("Shanghai"), []);
  const { data, loading, error, refresh, lastUpdated } = useFetch(fetcher, 1800000);

  const icon = (code) => WEATHER_ICONS[code] || "🌤️";

  return (
    <ModuleCard
      icon={<Cloud size={18} />}
      title="天气 · 上海"
      loading={loading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
    >
      {data && !data.error && (
        <div className="weather-card">
          <div className="weather-now">
            <span className="weather-icon">{icon(data.current?.weather_code)}</span>
            <div className="weather-temp">
              <span className="weather-temp-num">{data.current?.temp_c}</span>
              <span className="weather-temp-unit">°C</span>
            </div>
            <div className="weather-desc">{data.current?.weather_desc}</div>
            <div className="weather-details-row">
              <span>体感 {data.current?.feels_like}°</span>
              <span>湿度 {data.current?.humidity}%</span>
              <span>{data.current?.wind_dir} {data.current?.wind_speed}km/h</span>
            </div>
          </div>
          <div className="weather-forecast">
            {data.forecast?.map((f, i) => (
              <div key={i} className="weather-fc-item">
                <span className="weather-fc-date">{f.date}</span>
                <span className="weather-fc-icon">{icon(f.weather_code)}</span>
                <span className="weather-fc-temp">{f.max_c}° / {f.min_c}°</span>
                <span className="weather-fc-desc">{f.weather_desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data?.error && <div className="module-error"><p>{data.error}</p></div>}
    </ModuleCard>
  );
}
