import type { QuotaWindow } from "../shared/contracts";
import {
  formatRemainingDuration,
  formatResetTime,
  quotaLabel,
} from "../lib/formatters";
import { ClockIcon } from "./Icons";
import { quotaHealth, quotaProgressPercent } from "../lib/quotaHealth";
import { useI18n } from "../i18n";

interface QuotaMeterProps {
  quota: QuotaWindow;
  now: number;
  availableResetCount: number | null;
  showAvailableResets: boolean;
}

export function QuotaMeter({
  quota,
  now,
  availableResetCount,
  showAvailableResets,
}: QuotaMeterProps) {
  const { locale, messages } = useI18n();
  const health = quotaHealth(quota);
  const progressPercent = quotaProgressPercent(quota);
  return (
    <section
      className={`quota-meter quota-${health}`}
      data-quota-health={health}
      aria-label={quotaLabel(quota.windowMinutes, locale)}
    >
      <div className="quota-heading">
        <h2>{quotaLabel(quota.windowMinutes, locale)}</h2>
        <p>
          {messages.used}{" "}
          <strong className="used-value">{quota.usedPercent}%</strong>
          <span aria-hidden="true"> · </span>
          {messages.remaining}{" "}
          <strong className="remaining-value">{quota.remainingPercent}%</strong>
        </p>
      </div>
      <div
        className="quota-track"
        role="progressbar"
        aria-label={`${quotaLabel(quota.windowMinutes, locale)} ${messages.remainingPercentage}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span
          className="quota-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="reset-time">
        <ClockIcon width={17} height={17} />
        <span>
          {formatResetTime(quota, locale)} {messages.reset} ({
            formatRemainingDuration(quota.resetsAt, now, locale)
          })
        </span>
      </p>
      {showAvailableResets ? (
        <p className="reset-count">
          {messages.availableResets(availableResetCount)}
        </p>
      ) : null}
    </section>
  );
}
