import type { QuotaWindow, UsageSource } from "../shared/contracts";
import type { AppLocale } from "../i18n";

const supportedPlans = new Set([
  "free",
  "plus",
  "pro",
  "team",
  "business",
  "enterprise",
  "edu",
]);

const dateTimeFormatters: Record<AppLocale, Intl.DateTimeFormat> = {
  "zh-CN": new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  "en-US": new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
};

const timeFormatters: Record<AppLocale, Intl.DateTimeFormat> = {
  "zh-CN": new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  "en-US": new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
};

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatMembershipStatus(
  planType: string,
  source: UsageSource,
  locale: AppLocale = "zh-CN",
): string {
  if (source === "demo") {
    return locale === "zh-CN" ? "演示账号" : "Demo account";
  }

  const normalized = planType.trim().toLowerCase();
  if (normalized.length === 0 || normalized === "unknown") {
    return locale === "zh-CN" ? "会员状态未知" : "Membership unknown";
  }

  const plan = supportedPlans.has(normalized)
    ? normalized.toUpperCase()
    : planType.trim().toUpperCase();
  return locale === "zh-CN" ? `${plan} 会员` : `${plan} member`;
}

export function quotaLabel(
  windowMinutes: number,
  locale: AppLocale = "zh-CN",
): string {
  if (locale === "en-US") {
    if (windowMinutes % 1_440 === 0) {
      return `${windowMinutes / 1_440}-day quota`;
    }

    if (windowMinutes % 60 === 0) {
      return `${windowMinutes / 60}-hour quota`;
    }

    return `${windowMinutes}-minute quota`;
  }

  if (windowMinutes === 300) {
    return "5 小时额度";
  }

  if (windowMinutes === 10_080) {
    return "7 天额度";
  }

  if (windowMinutes % 1_440 === 0) {
    return `${windowMinutes / 1_440} 天额度`;
  }

  if (windowMinutes % 60 === 0) {
    return `${windowMinutes / 60} 小时额度`;
  }

  return `${windowMinutes} 分钟额度`;
}

export function formatResetTime(
  quota: QuotaWindow,
  locale: AppLocale = "zh-CN",
): string {
  const resetDate = new Date(quota.resetsAt * 1_000);
  return quota.windowMinutes <= 1_440
    ? timeFormatters[locale].format(resetDate)
    : dateTimeFormatters[locale]
        .format(resetDate)
        .replace(",", "")
        .replaceAll("/", "-");
}

export function formatRemainingDuration(
  resetsAt: number,
  now = Date.now(),
  locale: AppLocale = "zh-CN",
): string {
  const remainingMs = resetsAt * 1_000 - now;
  if (remainingMs <= 0) {
    return locale === "zh-CN" ? "即将刷新" : "refreshing soon";
  }

  const remainingMinutes = Math.max(1, Math.round(remainingMs / 60_000));
  if (remainingMinutes < 60) {
    return locale === "zh-CN"
      ? `约 ${remainingMinutes} 分钟`
      : `about ${plural(remainingMinutes, "minute")}`;
  }

  const remainingHours = Math.round(remainingMinutes / 60);
  if (remainingHours < 36) {
    return locale === "zh-CN"
      ? `约 ${remainingHours} 小时`
      : `about ${plural(remainingHours, "hour")}`;
  }

  const remainingDays = Math.max(1, Math.round(remainingHours / 24));
  return locale === "zh-CN"
    ? `约 ${remainingDays} 天`
    : `about ${plural(remainingDays, "day")}`;
}
