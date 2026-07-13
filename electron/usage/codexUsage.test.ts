import { describe, expect, it } from "vitest";
import { buildDemoSnapshot, parseRolloutTail } from "./codexUsage";

const fallbackObservedAt = Date.UTC(2026, 6, 12, 9, 0, 0);

describe("Codex 本地额度事件解析", () => {
  it("提取最近额度、套餐和模型", () => {
    const lines = [
      JSON.stringify({
        timestamp: "2026-07-12T08:59:00Z",
        type: "turn_context",
        payload: { model: "gpt-5.6-sol" },
      }),
      JSON.stringify({
        timestamp: "2026-07-12T09:00:00Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          rate_limits: {
            primary: {
              used_percent: 17,
              window_minutes: 300,
              resets_at: 1_783_863_916,
            },
            secondary: {
              used_percent: 3,
              window_minutes: 10_080,
              resets_at: 1_784_450_716,
            },
            plan_type: "plus",
          },
        },
      }),
    ].join("\n");

    const result = parseRolloutTail(lines, fallbackObservedAt);
    expect(result).toMatchObject({
      source: "local-session",
      planType: "plus",
      model: "gpt-5.6-sol",
      quotas: [
        {
          usedPercent: 17,
          remainingPercent: 83,
          windowMinutes: 300,
        },
        {
          usedPercent: 3,
          remainingPercent: 97,
          windowMinutes: 10_080,
        },
      ],
    });
  });

  it("从尾部选择更新的额度事件并忽略坏行", () => {
    const lines = [
      "not-json",
      JSON.stringify({
        type: "event_msg",
        payload: {
          rate_limits: {
            primary: {
              used_percent: 8,
              window_minutes: 300,
              resets_at: 1_783_863_916,
            },
            secondary: {
              used_percent: 1,
              window_minutes: 10_080,
              resets_at: 1_784_450_716,
            },
            plan_type: "plus",
          },
        },
      }),
      JSON.stringify({
        type: "event_msg",
        payload: {
          rate_limits: {
            primary: {
              used_percent: 12,
              window_minutes: 300,
              resets_at: 1_783_863_916,
            },
            secondary: {
              used_percent: 2,
              window_minutes: 10_080,
              resets_at: 1_784_450_716,
            },
            plan_type: "plus",
          },
        },
      }),
    ].join("\n");

    expect(parseRolloutTail(lines, fallbackObservedAt)?.quotas[0]?.usedPercent).toBe(12);
  });

  it("只有 7 天 primary 时仍返回真实额度", () => {
    const lines = JSON.stringify({
      timestamp: "2026-07-13T00:29:40Z",
      type: "event_msg",
      payload: {
        rate_limits: {
          primary: {
            used_percent: 74,
            window_minutes: 10_080,
            resets_at: 1_784_450_716,
          },
          plan_type: "plus",
        },
      },
    });

    expect(parseRolloutTail(lines, fallbackObservedAt)).toMatchObject({
      source: "local-session",
      quotas: [
        {
          usedPercent: 74,
          remainingPercent: 26,
          windowMinutes: 10_080,
        },
      ],
    });
  });

  it("缺少额度事件时不伪造本地结果", () => {
    expect(
      parseRolloutTail(
        JSON.stringify({ type: "turn_context", payload: { model: "gpt-5" } }),
        fallbackObservedAt,
      ),
    ).toBeNull();
  });

  it("演示快照必须明确标记来源", () => {
    const demo = buildDemoSnapshot(fallbackObservedAt);
    expect(demo.source).toBe("demo");
    expect(demo.message).toContain("演示数据");
  });
});
