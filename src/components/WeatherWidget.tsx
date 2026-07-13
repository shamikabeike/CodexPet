import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { WeatherSnapshot } from "../shared/contracts";
import { useI18n } from "../i18n";

const conditionIcon = {
  clear: "☀",
  cloudy: "☁",
  fog: "≋",
  rain: "☂",
  snow: "❄",
  storm: "ϟ",
  unknown: "○",
} as const;

interface WeatherWidgetProps {
  weather: WeatherSnapshot;
  loading: boolean;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetCity: (city: string) => Promise<WeatherSnapshot>;
}

export function WeatherWidget({
  weather,
  loading,
  error,
  open,
  onOpenChange,
  onSetCity,
}: WeatherWidgetProps) {
  const { locale, messages, setLocale } = useI18n();
  const [city, setCity] = useState(weather.city ?? "");

  useEffect(() => {
    if (open) setCity(weather.city ?? "");
  }, [open, weather.city]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSetCity(city).then(() => onOpenChange(false)).catch(() => undefined);
  };

  const summary = weather.configured
    ? `${weather.city ?? messages.weather.local} ${weather.temperatureC ?? "--"}° ${messages.weather.conditions[weather.condition]}`
    : messages.weather.setup;

  return (
    <>
      <button
        className="weather-trigger"
        type="button"
        aria-label={messages.weather.triggerAria(summary)}
        title={messages.weather.triggerTitle}
        onClick={() => onOpenChange(!open)}
      >
        <span className="weather-icon" aria-hidden="true">
          {conditionIcon[weather.condition]}
        </span>
        <span className="weather-summary">{summary}</span>
      </button>

      {open ? (
        <form className="weather-popover" onSubmit={submit}>
          <div className="weather-popover-title">
            <strong>{messages.weather.title}</strong>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={messages.weather.closeAria}
            >
              ×
            </button>
          </div>
          <div className="language-row">
            <span>{messages.language}</span>
            <div role="group" aria-label={messages.language}>
              <button
                type="button"
                className={locale === "zh-CN" ? "is-active" : ""}
                aria-pressed={locale === "zh-CN"}
                onClick={() => setLocale("zh-CN")}
              >
                中文
              </button>
              <button
                type="button"
                className={locale === "en-US" ? "is-active" : ""}
                aria-pressed={locale === "en-US"}
                onClick={() => setLocale("en-US")}
              >
                EN
              </button>
            </div>
          </div>
          <label htmlFor="weather-city">{messages.weather.cityLabel}</label>
          <div className="weather-city-row">
            <input
              id="weather-city"
              value={city}
              maxLength={64}
              placeholder={messages.weather.cityPlaceholder}
              autoFocus
              onChange={(event) => setCity(event.target.value)}
            />
            <button type="submit" disabled={loading || city.trim().length < 2}>
              {loading ? messages.weather.loading : messages.weather.save}
            </button>
          </div>
          <p className={error ? "weather-error" : "weather-credit"}>
            {error ?? messages.weather.credit}
          </p>
        </form>
      ) : null}
    </>
  );
}
