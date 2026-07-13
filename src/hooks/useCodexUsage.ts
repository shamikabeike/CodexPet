import { useCallback, useEffect, useRef, useState } from "react";
import type { CodexUsageSnapshot } from "../shared/contracts";
import { useI18n } from "../i18n";

function previewSnapshot(now = Date.now()): CodexUsageSnapshot {
  const nowSeconds = Math.floor(now / 1_000);
  const showLegacyFiveHour =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("with-5h");
  const quotas = [
    ...(showLegacyFiveHour
      ? [{
          usedPercent: 76,
          remainingPercent: 24,
          windowMinutes: 300,
          resetsAt: nowSeconds + 3 * 60 * 60,
        }]
      : []),
    {
      usedPercent: 48,
      remainingPercent: 52,
      windowMinutes: 10_080,
      resetsAt: nowSeconds + 6 * 24 * 60 * 60,
    },
  ];

  return {
    source: "demo",
    planType: "demo",
    quotas,
    model: "gpt-5.6-sol",
    observedAt: now,
    message: "浏览器预览使用演示数据",
  };
}

export function useCodexUsage() {
  const { messages } = useI18n();
  const [snapshot, setSnapshot] = useState<CodexUsageSnapshot>(() =>
    previewSnapshot(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<CodexUsageSnapshot> | null>(null);

  useEffect(() => {
    const api = window.codexPet;
    if (api === undefined) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const unsubscribe = api.usage.subscribe((next) => {
      if (!cancelled) {
        setSnapshot(next);
        setError(null);
        setLoading(false);
      }
    });

    void api.usage
      .read()
      .then((next) => {
        if (!cancelled) {
          setSnapshot(next);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(messages.quotaReadError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [messages.quotaReadError]);

  const refresh = useCallback(() => {
    if (inFlight.current !== null) {
      return inFlight.current;
    }

    setLoading(true);
    const request =
      window.codexPet?.usage.refresh() ??
      new Promise<CodexUsageSnapshot>((resolve) => {
        window.setTimeout(() => resolve(previewSnapshot()), 320);
      });
    inFlight.current = request
      .then((next) => {
        setSnapshot(next);
        setError(null);
        return next;
      })
      .catch((cause: unknown) => {
        setError(messages.quotaRefreshError);
        throw cause;
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });

    return inFlight.current;
  }, [messages.quotaRefreshError]);

  return { snapshot, loading, error, refresh };
}
