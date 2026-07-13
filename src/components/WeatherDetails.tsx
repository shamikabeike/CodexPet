import type { WeatherSnapshot } from "../shared/contracts";
import { useI18n } from "../i18n";

interface WeatherDetailsProps {
  weather: WeatherSnapshot;
  compact?: boolean;
}

interface WeatherDetail {
  label: string;
  shortLabel: string;
  value: string;
}

export function WeatherDetails({
  weather,
  compact = false,
}: WeatherDetailsProps) {
  const { locale, messages } = useI18n();
  if (!weather.configured) {
    return null;
  }

  const details: WeatherDetail[] = [
    {
      label: messages.weather.feelsLike,
      shortLabel: messages.weather.feelsLikeShort,
      value: `${weather.apparentTemperatureC ?? "--"}°`,
    },
    {
      label: messages.weather.humidity,
      shortLabel: messages.weather.humidityShort,
      value: `${weather.relativeHumidityPercent ?? "--"}%`,
    },
    {
      label: messages.weather.wind,
      shortLabel: messages.weather.windShort,
      value: `${weather.windSpeedKmh ?? "--"} km/h`,
    },
  ];
  const visibleDetails = compact ? details.slice(1) : details;

  return (
    <div
      className={`weather-details ${compact ? "is-compact" : ""}`}
      aria-label={details
        .map((item) => `${item.label} ${item.value}`)
        .join(locale === "zh-CN" ? "，" : ", ")}
    >
      {visibleDetails.map((item) => (
        <span className="weather-detail" key={item.label}>
          <i>
            {compact && locale === "zh-CN"
              ? item.shortLabel.slice(0, 1)
              : item.shortLabel}
          </i>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}
