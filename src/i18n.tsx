import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { WeatherCondition } from "./shared/contracts";

export type AppLocale = "zh-CN" | "en-US";

interface Messages {
  documentTitle: string;
  panelAria: string;
  catFaceAria: string;
  used: string;
  remaining: string;
  reset: string;
  availableResets: (count: number | null) => string;
  remainingPercentage: string;
  language: string;
  resizeAria: string;
  resizeTitle: string;
  quotaReadError: string;
  quotaRefreshError: string;
  weather: {
    conditions: Record<WeatherCondition, string>;
    local: string;
    setup: string;
    triggerTitle: string;
    triggerAria: (summary: string) => string;
    title: string;
    closeAria: string;
    cityLabel: string;
    cityPlaceholder: string;
    loading: string;
    save: string;
    credit: string;
    feelsLike: string;
    feelsLikeShort: string;
    humidity: string;
    humidityShort: string;
    wind: string;
    windShort: string;
    errorFallback: string;
    errorCityLength: string;
    errorLookup: string;
    errorNotFound: string;
    errorFormat: string;
  };
}

export const messages: Record<AppLocale, Messages> = {
  "zh-CN": {
    documentTitle: "Miao · Codex 额度",
    panelAria: "Miao Codex 额度面板",
    catFaceAria: "会自然眨眼的 Miao 猫脸",
    used: "已用",
    remaining: "剩余",
    reset: "重置",
    availableResets: (count) =>
      count === null ? "可用重置次数 —" : `${count} 次可用重置`,
    remainingPercentage: "剩余百分比",
    language: "界面语言",
    resizeAria: "拖动调整 Miao 窗口大小",
    resizeTitle: "拖动调整大小",
    quotaReadError: "暂时读不到 Codex 额度",
    quotaRefreshError: "刷新失败，Miao 稍后再试",
    weather: {
      conditions: {
        clear: "晴",
        cloudy: "多云",
        fog: "雾",
        rain: "雨",
        snow: "雪",
        storm: "雷雨",
        unknown: "天气",
      },
      local: "当地",
      setup: "设置天气",
      triggerTitle: "点击设置天气城市",
      triggerAria: (summary) => `${summary}，点击设置城市`,
      title: "当地天气",
      closeAria: "关闭天气设置",
      cityLabel: "城市名称",
      cityPlaceholder: "例如：杭州",
      loading: "查询中",
      save: "保存",
      credit: "天气数据：Open-Meteo · 每 30 分钟刷新",
      feelsLike: "体感温度",
      feelsLikeShort: "体感",
      humidity: "相对湿度",
      humidityShort: "湿度",
      wind: "风速",
      windShort: "风速",
      errorFallback: "天气设置失败，请稍后重试",
      errorCityLength: "请输入 2–64 个字符的城市名称",
      errorLookup: "城市查询暂时不可用",
      errorNotFound: "没有找到这个城市，请换个写法",
      errorFormat: "天气数据格式暂时无法识别",
    },
  },
  "en-US": {
    documentTitle: "Miao · Codex Usage",
    panelAria: "Miao Codex usage panel",
    catFaceAria: "Miao cat face with natural blinking",
    used: "Used",
    remaining: "Left",
    reset: "resets",
    availableResets: (count) =>
      count === null ? "Available resets —" : `${count} resets available`,
    remainingPercentage: "remaining percentage",
    language: "Language",
    resizeAria: "Drag to resize the Miao window",
    resizeTitle: "Drag to resize",
    quotaReadError: "Codex usage is temporarily unavailable",
    quotaRefreshError: "Refresh failed. Miao will try again later",
    weather: {
      conditions: {
        clear: "Clear",
        cloudy: "Cloudy",
        fog: "Fog",
        rain: "Rain",
        snow: "Snow",
        storm: "Storm",
        unknown: "Weather",
      },
      local: "Local",
      setup: "Set weather",
      triggerTitle: "Set weather city",
      triggerAria: (summary) => `${summary}. Select to set the city`,
      title: "Local weather",
      closeAria: "Close weather settings",
      cityLabel: "City",
      cityPlaceholder: "For example: Seattle",
      loading: "Searching",
      save: "Save",
      credit: "Weather: Open-Meteo · refreshed every 30 minutes",
      feelsLike: "Feels-like temperature",
      feelsLikeShort: "Feels",
      humidity: "Relative humidity",
      humidityShort: "RH",
      wind: "Wind speed",
      windShort: "Wind",
      errorFallback: "Weather setup failed. Please try again later",
      errorCityLength: "Enter a city name between 2 and 64 characters",
      errorLookup: "City search is temporarily unavailable",
      errorNotFound: "City not found. Try a different spelling",
      errorFormat: "The weather data format is not recognized",
    },
  },
};

const STORAGE_KEY = "miao.locale.v1";

export function resolveLocale(language: string | null | undefined): AppLocale {
  return language?.trim().toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en-US";
}

function initialLocale(): AppLocale {
  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale !== null) {
    return resolveLocale(queryLocale);
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  if (storedLocale === "zh-CN" || storedLocale === "en-US") {
    return storedLocale;
  }

  return resolveLocale(window.navigator.language);
}

interface I18nContextValue {
  locale: AppLocale;
  messages: Messages;
  setLocale: (locale: AppLocale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages[locale].documentTitle;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo(
    () => ({ locale, messages: messages[locale], setLocale }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error("useI18n 必须在 I18nProvider 内使用");
  }
  return context;
}
