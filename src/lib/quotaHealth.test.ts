import { describe, expect, it } from "vitest";
import { quotaHealth, quotaProgressPercent } from "./quotaHealth";

describe("quotaProgressPercent", () => {
  it("使用剩余额度作为进度条占比", () => {
    expect(quotaProgressPercent({ remainingPercent: 75 })).toBe(75);
  });

  it.each([
    [-5, 0],
    [105, 100],
  ] as const)("把异常剩余值 %s 限制为 %s", (remainingPercent, expected) => {
    expect(quotaProgressPercent({ remainingPercent })).toBe(expected);
  });
});

describe("quotaHealth", () => {
  it.each([
    [100, "safe"],
    [60, "safe"],
    [59, "warning"],
    [30, "warning"],
    [29, "critical"],
    [0, "critical"],
  ] as const)("剩余 %s%% 时返回 %s", (remainingPercent, expected) => {
    expect(quotaHealth({ remainingPercent })).toBe(expected);
  });
});
