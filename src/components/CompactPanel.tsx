import { CatFace } from "./CatFace";
import { WeatherWidget } from "./WeatherWidget";
import { WeatherDetails } from "./WeatherDetails";
import type {
  CodexUsageSnapshot,
  QuotaWindow,
  WeatherSnapshot,
} from "../shared/contracts";
import { formatResetTime, quotaLabel } from "../lib/formatters";
import { quotaHealth, quotaProgressPercent } from "../lib/quotaHealth";
import { useI18n } from "../i18n";
import type { AppLocale } from "../i18n";

interface CompactPanelProps {
  snapshot: CodexUsageSnapshot;
  now: number;
  membershipStatus: string;
  weather: WeatherSnapshot;
  weatherLoading: boolean;
  weatherError: string | null;
  weatherOpen: boolean;
  onWeatherOpenChange: (open: boolean) => void;
  onSetCity: (city: string) => Promise<WeatherSnapshot>;
}

function shortQuotaLabel(windowMinutes: number, locale: AppLocale): string {
  return quotaLabel(windowMinutes, locale)
    .replace(locale === "zh-CN" ? "额度" : "quota", "")
    .trim();
}

function CompactQuota({ quota }: { quota: QuotaWindow }) {
  const { locale, messages } = useI18n();
  const health = quotaHealth(quota);
  const progressPercent = quotaProgressPercent(quota);

  return (
    <section
      className={`compact-quota quota-${health}`}
      data-quota-health={health}
      aria-label={quotaLabel(quota.windowMinutes, locale)}
    >
      <div className="compact-quota-heading">
        <h2>{shortQuotaLabel(quota.windowMinutes, locale)}</h2>
        <p>
          {messages.remaining} <strong>{quota.remainingPercent}%</strong>
        </p>
      </div>
      <div
        className="compact-quota-track"
        role="progressbar"
        aria-label={`${quotaLabel(quota.windowMinutes, locale)} ${messages.remainingPercentage}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="compact-reset">
        {formatResetTime(quota, locale)} {messages.reset}
      </p>
    </section>
  );
}

export function CompactPanel({
  snapshot,
  now,
  membershipStatus,
  weather,
  weatherLoading,
  weatherError,
  weatherOpen,
  onWeatherOpenChange,
  onSetCity,
}: CompactPanelProps) {
  const hasMultipleQuotas = snapshot.quotas.length > 1;

  return (
    <div
      className={`compact-content ${hasMultipleQuotas ? "has-multiple-quotas" : ""}`}
    >
      <header className="compact-titlebar">
        <div className="compact-brand">
          <span
            className={`connection-dot ${snapshot.source === "demo" ? "is-demo" : ""}`}
            aria-hidden="true"
          />
          <h1>Miao</h1>
          <span
            className={`compact-plan ${snapshot.source === "demo" ? "demo" : ""}`}
          >
            {membershipStatus}
          </span>
        </div>
      </header>

      <CatFace />

      <div className="compact-quota-panel">
        {snapshot.quotas.map((quota) => (
          <CompactQuota key={quota.windowMinutes} quota={quota} />
        ))}
      </div>

      <footer className="compact-footer">
        <WeatherWidget
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          open={weatherOpen}
          onOpenChange={onWeatherOpenChange}
          onSetCity={onSetCity}
        />
        <WeatherDetails weather={weather} compact />
      </footer>
    </div>
  );
}
