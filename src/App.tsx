import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { CatFace } from "./components/CatFace";
import { CatOutline } from "./components/CatOutline";
import { CompactPanel } from "./components/CompactPanel";
import { QuotaMeter } from "./components/QuotaMeter";
import { ResizeHandle } from "./components/ResizeHandle";
import { WeatherLayer } from "./components/WeatherLayer";
import { WeatherDetails } from "./components/WeatherDetails";
import { WeatherWidget } from "./components/WeatherWidget";
import { useCodexUsage } from "./hooks/useCodexUsage";
import { useWeather } from "./hooks/useWeather";
import { useI18n } from "./i18n";
import { formatMembershipStatus, quotaLabel } from "./lib/formatters";
import {
  PANEL_BASE_HEIGHT,
  PANEL_BASE_WIDTH,
  usesCompactLayout,
} from "./shared/windowSizing";

function panelScale(): number {
  return Math.min(
    window.innerWidth / PANEL_BASE_WIDTH,
    window.innerHeight / PANEL_BASE_HEIGHT,
  );
}

export default function App() {
  const { locale, messages } = useI18n();
  const { snapshot, loading } = useCodexUsage();
  const weather = useWeather();
  const [earTwitch, setEarTwitch] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [scale, setScale] = useState(panelScale);

  useEffect(() => {
    const handleResize = () => setScale(panelScale());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let timer = 0;
    let stopTimer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setEarTwitch(true);
        stopTimer = window.setTimeout(() => {
          setEarTwitch(false);
          schedule();
        }, 520);
      }, 6_500 + Math.random() * 7_500);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(stopTimer);
    };
  }, []);

  const membershipStatus = formatMembershipStatus(
    snapshot.planType,
    snapshot.source,
    locale,
  );
  const compactLayout = usesCompactLayout(scale);

  return (
    <main className="stage">
      <section
        className={`cat-window ${earTwitch ? "ear-twitch" : ""} ${loading ? "is-refreshing" : ""}`}
        data-ear-twitch={earTwitch}
        data-layout={compactLayout ? "compact" : "full"}
        data-panel-scale={scale.toFixed(3)}
        style={{ "--panel-scale": scale } as CSSProperties}
        aria-label={messages.panelAria}
      >
        <CatOutline twitch={earTwitch} />
        <WeatherLayer weather={weather.snapshot} />

        {compactLayout ? (
          <CompactPanel
            snapshot={snapshot}
            now={now}
            membershipStatus={membershipStatus}
            weather={weather.snapshot}
            weatherLoading={weather.loading}
            weatherError={weather.error}
            weatherOpen={weatherOpen}
            onWeatherOpenChange={setWeatherOpen}
            onSetCity={weather.setCity}
          />
        ) : (
          <div className="cat-content">
            <header className="titlebar">
              <div className="brand-line">
                <span
                  className={`connection-dot ${snapshot.source === "demo" ? "is-demo" : ""}`}
                  aria-hidden="true"
                />
                <h1>
                  Miao
                </h1>
                <span
                  className={`plan-badge ${snapshot.source === "demo" ? "demo" : ""}`}
                >
                  {membershipStatus}
                </span>
              </div>
            </header>

            <CatFace />

            <div
              className={`quota-panel ${snapshot.quotas.length === 1 ? "is-single" : ""}`}
            >
              {snapshot.quotas.map((quota, index) => (
                <div key={quota.windowMinutes}>
                  {index > 0 ? (
                    <div className="quota-divider" aria-hidden="true" />
                  ) : null}
                  <QuotaMeter
                    quota={quota}
                    now={now}
                    availableResetCount={snapshot.availableResetCount}
                    showAvailableResets={index === snapshot.quotas.length - 1}
                  />
                </div>
              ))}
            </div>

            <footer className="status-footer">
              <WeatherWidget
                weather={weather.snapshot}
                loading={weather.loading}
                error={weather.error}
                open={weatherOpen}
                onOpenChange={setWeatherOpen}
                onSetCity={weather.setCity}
              />
              <WeatherDetails weather={weather.snapshot} />
            </footer>

            <span className="sr-only">
              {snapshot.quotas
                .map(
                  (quota) =>
                    `${quotaLabel(quota.windowMinutes, locale)} ${messages.remaining} ${quota.remainingPercent}%`,
                )
                .join(locale === "zh-CN" ? "，" : ", ")}
              {`. ${messages.availableResets(snapshot.availableResetCount)}`}
            </span>
          </div>
        )}

        <ResizeHandle />
      </section>
    </main>
  );
}
