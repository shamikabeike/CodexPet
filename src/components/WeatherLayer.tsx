import type { WeatherSnapshot } from "../shared/contracts";

export function WeatherLayer({ weather }: { weather: WeatherSnapshot }) {
  if (!weather.configured) {
    return null;
  }

  return (
    <div
      className={`weather-layer weather-${weather.condition} ${weather.isDay ? "is-day" : "is-night"}`}
      data-weather-condition={weather.condition}
      aria-hidden="true"
    >
      <span className="weather-orb" />
      <span className="weather-cloud cloud-one" />
      <span className="weather-cloud cloud-two" />
      <span className="weather-particles" />
      <span className="weather-stars" />
    </div>
  );
}
