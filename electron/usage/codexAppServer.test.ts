import { describe, expect, it } from "vitest";
import { parseAppServerRateLimits } from "./codexAppServer";

const observedAt = Date.UTC(2026, 6, 14, 12, 37, 0);

describe("Codex App Server 额度解析", () => {
  it("读取额度、套餐和可用重置次数", () => {
    const result = parseAppServerRateLimits({
      rateLimits: {
        primary: {
          usedPercent: 67,
          windowDurationMins: 10_080,
          resetsAt: 1_784_502_181,
        },
        secondary: null,
        planType: "plus",
      },
      rateLimitResetCredits: {
        availableCount: 3,
        credits: [{ id: "不会进入快照" }],
      },
    }, observedAt);

    expect(result).toEqual({
      source: "codex-app-server",
      planType: "plus",
      quotas: [{
        usedPercent: 67,
        remainingPercent: 33,
        windowMinutes: 10_080,
        resetsAt: 1_784_502_181,
      }],
      availableResetCount: 3,
      model: null,
      observedAt,
      message: null,
    });
  });

  it("兼容尚未返回重置次数的旧版 App Server", () => {
    const result = parseAppServerRateLimits({
      rateLimits: {
        primary: {
          usedPercent: 12.4,
          windowDurationMins: 300,
          resetsAt: 1_783_863_916,
        },
        planType: "pro",
      },
    }, observedAt);

    expect(result).toMatchObject({
      availableResetCount: null,
      quotas: [{ usedPercent: 12, remainingPercent: 88 }],
    });
  });

  it("拒绝没有合法额度窗口的响应", () => {
    expect(parseAppServerRateLimits({ rateLimits: {} }, observedAt)).toBeNull();
    expect(parseAppServerRateLimits(null, observedAt)).toBeNull();
  });
});
