import { useCallback, useEffect, useState } from "react";
import type { WeatherSnapshot } from "../shared/contracts";
import { useI18n } from "../i18n";
import type { AppLocale } from "../i18n";

function previewWeather(city = "杭州"): WeatherSnapshot {
  return {
    configured: true,
    city,
    temperatureC: 27,
    apparentTemperatureC: 29,
    relativeHumidityPercent: 76,
    windSpeedKmh: 12,
    weatherCode: 2,
    condition: "cloudy",
    isDay: true,
    observedAt: Date.now(),
    message: "浏览器预览天气",
  };
}

function friendlyError(
  cause: unknown,
  locale: AppLocale,
  fallback: string,
  localizedErrors: Record<string, string>,
): string {
  if (!(cause instanceof Error)) {
    return fallback;
  }

  const message = cause.message.split("Error:").at(-1)?.trim();
  const matchedCode = Object.keys(localizedErrors).find((code) =>
    message?.includes(code),
  );
  if (matchedCode !== undefined) {
    return localizedErrors[matchedCode];
  }

  if (locale === "en-US" && message !== undefined && /\p{Script=Han}/u.test(message)) {
    return fallback;
  }
  return message || fallback;
}

export function useWeather() {
  const { locale, messages } = useI18n();
  const localizedErrors = {
    MIAO_WEATHER_CITY_LENGTH: messages.weather.errorCityLength,
    MIAO_WEATHER_CITY_LOOKUP: messages.weather.errorLookup,
    MIAO_WEATHER_CITY_NOT_FOUND: messages.weather.errorNotFound,
    MIAO_WEATHER_UPDATE: messages.weather.errorFallback,
    MIAO_WEATHER_FORMAT: messages.weather.errorFormat,
  };
  const [snapshot, setSnapshot] = useState<WeatherSnapshot>(() =>
    previewWeather(locale === "zh-CN" ? "杭州" : "Seattle"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = window.codexPet?.weather;
    if (api === undefined) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const unsubscribe = api.subscribe((next) => {
      if (!cancelled) {
        setSnapshot(next);
        setError(null);
        setLoading(false);
      }
    });

    void api
      .read()
      .then((next) => {
        if (!cancelled && next !== undefined) {
          setSnapshot(next);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            friendlyError(
              cause,
              locale,
              messages.weather.errorFallback,
              localizedErrors,
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [locale, messages.weather.errorFallback]);

  const setCity = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const next = window.codexPet?.weather
        ? await window.codexPet.weather.setCity(city)
        : await new Promise<WeatherSnapshot>((resolve) =>
            window.setTimeout(() => resolve(previewWeather(city.trim())), 280),
          );
      setSnapshot(next);
      return next;
    } catch (cause) {
      const message = friendlyError(
        cause,
        locale,
        messages.weather.errorFallback,
        localizedErrors,
      );
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [locale, messages.weather.errorFallback]);

  const refresh = useCallback(async () => {
    if (window.codexPet?.weather === undefined) return snapshot;
    setLoading(true);
    try {
      const next = await window.codexPet.weather.refresh();
      setSnapshot(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  return { snapshot, loading, error, setCity, refresh };
}
