import { describe, expect, it } from "vitest";
import {
  clampPercent,
  formatMembershipStatus,
  formatRemainingDuration,
  quotaLabel,
} from "./formatters";

describe("额度格式化", () => {
  it("展示账号会员状态", () => {
    expect(formatMembershipStatus("plus", "local-session")).toBe("PLUS 会员");
    expect(formatMembershipStatus("business", "local-session")).toBe(
      "BUSINESS 会员",
    );
    expect(formatMembershipStatus("demo", "demo")).toBe("演示账号");
    expect(formatMembershipStatus("unknown", "local-session")).toBe(
      "会员状态未知",
    );
  });

  it("展示英文账号会员状态", () => {
    expect(formatMembershipStatus("plus", "local-session", "en-US")).toBe(
      "PLUS member",
    );
    expect(formatMembershipStatus("demo", "demo", "en-US")).toBe(
      "Demo account",
    );
    expect(formatMembershipStatus("unknown", "local-session", "en-US")).toBe(
      "Membership unknown",
    );
  });

  it("限制百分比在合法范围内", () => {
    expect(clampPercent(-8)).toBe(0);
    expect(clampPercent(42.6)).toBe(43);
    expect(clampPercent(108)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it("识别 Codex 常见窗口", () => {
    expect(quotaLabel(300)).toBe("5 小时额度");
    expect(quotaLabel(10_080)).toBe("7 天额度");
    expect(quotaLabel(120)).toBe("2 小时额度");
  });

  it("生成英文额度周期", () => {
    expect(quotaLabel(300, "en-US")).toBe("5-hour quota");
    expect(quotaLabel(10_080, "en-US")).toBe("7-day quota");
    expect(quotaLabel(30, "en-US")).toBe("30-minute quota");
  });

  it("以适合人的粒度展示倒计时", () => {
    const now = Date.UTC(2026, 6, 12, 9, 0, 0);
    expect(formatRemainingDuration(now / 1_000 + 42 * 60, now)).toBe(
      "约 42 分钟",
    );
    expect(formatRemainingDuration(now / 1_000 + 3 * 60 * 60, now)).toBe(
      "约 3 小时",
    );
    expect(formatRemainingDuration(now / 1_000 + 6 * 24 * 60 * 60, now)).toBe(
      "约 6 天",
    );
    expect(formatRemainingDuration(now / 1_000 - 1, now)).toBe("即将刷新");
  });

  it("生成自然的英文倒计时", () => {
    const now = Date.UTC(2026, 6, 12, 9, 0, 0);
    expect(
      formatRemainingDuration(now / 1_000 + 42 * 60, now, "en-US"),
    ).toBe("about 42 minutes");
    expect(
      formatRemainingDuration(now / 1_000 + 60 * 60, now, "en-US"),
    ).toBe("about 1 hour");
    expect(formatRemainingDuration(now / 1_000 - 1, now, "en-US")).toBe(
      "refreshing soon",
    );
  });

});
