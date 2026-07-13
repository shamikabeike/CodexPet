import type { QuotaWindow } from "../shared/contracts";

export type QuotaHealth = "safe" | "warning" | "critical";

export function quotaProgressPercent(
  quota: Pick<QuotaWindow, "remainingPercent">,
): number {
  return Math.min(100, Math.max(0, quota.remainingPercent));
}

export function quotaHealth(
  quota: Pick<QuotaWindow, "remainingPercent">,
): QuotaHealth {
  if (quota.remainingPercent >= 60) {
    return "safe";
  }

  if (quota.remainingPercent >= 30) {
    return "warning";
  }

  return "critical";
}
