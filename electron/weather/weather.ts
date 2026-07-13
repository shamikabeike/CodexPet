import { EventEmitter } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  WeatherCondition,
  WeatherSnapshot,
} from "../../src/shared/contracts";

const WEATHER_REFRESH_MS = 30 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 8_000;

type JsonRecord = Record<string, unknown>;
type Fetcher = typeof fetch;

interface StoredLocation {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeCityQuery(city: string): string {
  const normalized = city.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 64) {
    throw new Error("MIAO_WEATHER_CITY_LENGTH: 请输入 2–64 个字符的城市名称");
  }
  return normalized;
}

export function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "storm";
  return "unknown";
}

function emptySnapshot(message: string | null = null): WeatherSnapshot {
  return {
    configured: false,
    city: null,
    temperatureC: null,
    apparentTemperatureC: null,
    relativeHumidityPercent: null,
    windSpeedKmh: null,
    weatherCode: null,
    condition: "unknown",
    isDay: true,
    observedAt: null,
    message,
  };
}

export class WeatherService extends EventEmitter {
  private readonly configPath: string;
  private readonly fetcher: Fetcher;
  private location: StoredLocation | null = null;
  private current: WeatherSnapshot = emptySnapshot();
  private timer: NodeJS.Timeout | null = null;
  private inFlight: Promise<WeatherSnapshot> | null = null;

  constructor(configPath: string, fetcher: Fetcher = fetch) {
    super();
    this.configPath = configPath;
    this.fetcher = fetcher;
  }

  async start(): Promise<WeatherSnapshot> {
    this.location = await this.readLocation();
    if (this.location !== null) {
      await this.refresh();
    }
    this.timer = setInterval(() => void this.refresh(), WEATHER_REFRESH_MS);
    this.timer.unref();
    return this.current;
  }

  read(): WeatherSnapshot {
    return this.current;
  }

  async setCity(cityQuery: string): Promise<WeatherSnapshot> {
    const city = normalizeCityQuery(cityQuery);
    const location = await this.searchLocation(city);
    if (this.inFlight !== null) {
      await this.inFlight;
    }
    this.location = location;
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(location, null, 2), "utf8");
    return this.refresh();
  }

  refresh(): Promise<WeatherSnapshot> {
    if (this.location === null) {
      this.current = emptySnapshot("点击设置所在城市");
      return Promise.resolve(this.current);
    }

    if (this.inFlight !== null) {
      return this.inFlight;
    }

    this.inFlight = this.fetchCurrent(this.location)
      .then((snapshot) => {
        this.current = snapshot;
        this.emit("update", snapshot);
        return snapshot;
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error
          ? cause.message
          : "MIAO_WEATHER_UPDATE: 天气暂时无法更新";
        this.current = {
          ...this.current,
          configured: true,
          city: this.location?.city ?? this.current.city,
          message,
        };
        this.emit("update", this.current);
        return this.current;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  dispose(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async readLocation(): Promise<StoredLocation | null> {
    try {
      const parsed = asRecord(JSON.parse(await readFile(this.configPath, "utf8")));
      const latitude = asFiniteNumber(parsed?.latitude);
      const longitude = asFiniteNumber(parsed?.longitude);
      if (
        parsed === null ||
        typeof parsed.city !== "string" ||
        typeof parsed.timezone !== "string" ||
        latitude === null ||
        longitude === null
      ) {
        return null;
      }
      return { city: parsed.city, timezone: parsed.timezone, latitude, longitude };
    } catch {
      return null;
    }
  }

  private async searchLocation(city: string): Promise<StoredLocation> {
    const query = new URLSearchParams({
      name: city,
      count: "1",
      language: "zh",
      format: "json",
    });
    const response = await this.fetcher(
      `https://geocoding-api.open-meteo.com/v1/search?${query}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
    if (!response.ok) {
      throw new Error("MIAO_WEATHER_CITY_LOOKUP: 城市查询暂时不可用");
    }

    const root = asRecord(await response.json());
    const result = Array.isArray(root?.results) ? asRecord(root.results[0]) : null;
    const latitude = asFiniteNumber(result?.latitude);
    const longitude = asFiniteNumber(result?.longitude);
    if (
      result === null ||
      typeof result.name !== "string" ||
      latitude === null ||
      longitude === null
    ) {
      throw new Error("MIAO_WEATHER_CITY_NOT_FOUND: 没有找到这个城市，请换个写法");
    }

    return {
      city: result.name,
      latitude,
      longitude,
      timezone: typeof result.timezone === "string" ? result.timezone : "auto",
    };
  }

  private async fetchCurrent(location: StoredLocation): Promise<WeatherSnapshot> {
    const query = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
      timezone: location.timezone || "auto",
      forecast_days: "1",
    });
    const response = await this.fetcher(`https://api.open-meteo.com/v1/forecast?${query}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error("MIAO_WEATHER_UPDATE: 天气暂时无法更新");
    }

    const root = asRecord(await response.json());
    const current = asRecord(root?.current);
    const temperature = asFiniteNumber(current?.temperature_2m);
    const apparentTemperature = asFiniteNumber(current?.apparent_temperature);
    const relativeHumidity = asFiniteNumber(current?.relative_humidity_2m);
    const windSpeed = asFiniteNumber(current?.wind_speed_10m);
    const weatherCode = asFiniteNumber(current?.weather_code);
    const isDay = asFiniteNumber(current?.is_day);
    if (temperature === null || weatherCode === null || isDay === null) {
      throw new Error("MIAO_WEATHER_FORMAT: 天气数据格式暂时无法识别");
    }

    return {
      configured: true,
      city: location.city,
      temperatureC: Math.round(temperature),
      apparentTemperatureC:
        apparentTemperature === null ? null : Math.round(apparentTemperature),
      relativeHumidityPercent:
        relativeHumidity === null ? null : Math.round(relativeHumidity),
      windSpeedKmh: windSpeed === null ? null : Math.round(windSpeed),
      weatherCode: Math.round(weatherCode),
      condition: conditionFromWmoCode(Math.round(weatherCode)),
      isDay: isDay === 1,
      observedAt: Date.now(),
      message: null,
    };
  }
}
