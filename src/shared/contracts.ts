export type UsageSource = "local-session" | "demo";

export interface QuotaWindow {
  usedPercent: number;
  remainingPercent: number;
  windowMinutes: number;
  resetsAt: number;
}

export interface CodexUsageSnapshot {
  source: UsageSource;
  planType: string;
  quotas: QuotaWindow[];
  model: string | null;
  observedAt: number;
  message: string | null;
}

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";

export interface WeatherSnapshot {
  configured: boolean;
  city: string | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
  condition: WeatherCondition;
  isDay: boolean;
  observedAt: number | null;
  message: string | null;
}

export interface CodexPetApi {
  usage: {
    read: () => Promise<CodexUsageSnapshot>;
    refresh: () => Promise<CodexUsageSnapshot>;
    subscribe: (listener: (snapshot: CodexUsageSnapshot) => void) => () => void;
  };
  weather: {
    read: () => Promise<WeatherSnapshot>;
    refresh: () => Promise<WeatherSnapshot>;
    setCity: (city: string) => Promise<WeatherSnapshot>;
    subscribe: (listener: (snapshot: WeatherSnapshot) => void) => () => void;
  };
  window: {
    hide: () => void;
    quit: () => void;
    resize: (width: number) => void;
  };
}
