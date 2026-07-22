import { describe, expect, it } from "vitest";
import {
  buildCodexExecutableCandidates,
  parseAppServerRateLimits,
} from "./codexAppServer";

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

describe("Codex 可执行文件候选路径", () => {
  it("覆盖 macOS 应用包、用户应用目录和 PATH", () => {
    const candidates = buildCodexExecutableCandidates({
      codexHome: "/Users/miao/.codex",
      platform: "darwin",
      homeDirectory: "/Users/miao",
      pathValue: "/opt/homebrew/bin:/usr/local/bin",
    });

    expect(candidates).toContain(
      "/Applications/Codex.app/Contents/Resources/codex",
    );
    expect(candidates).toContain(
      "/Applications/ChatGPT.app/Contents/Resources/codex",
    );
    expect(candidates).toContain(
      "/Users/miao/Applications/Codex.app/Contents/Resources/codex",
    );
    expect(candidates).toContain("/opt/homebrew/bin/codex");
    expect(candidates).toContain("/usr/local/bin/codex");
    expect(candidates).toContain("/Users/miao/.local/bin/codex");
  });

  it("保留 Windows Codex 桌面版和插件路径", () => {
    const candidates = buildCodexExecutableCandidates({
      codexHome: "C:\\Users\\miao\\.codex",
      platform: "win32",
      homeDirectory: "C:\\Users\\miao",
      localAppData: "C:\\Users\\miao\\AppData\\Local",
      pathValue: "C:\\tools;\"C:\\Program Files\\Codex\"",
    });

    expect(candidates).toContain(
      "C:\\Users\\miao\\AppData\\Local\\OpenAI\\Codex\\bin\\codex.exe",
    );
    expect(candidates).toContain(
      "C:\\Users\\miao\\.codex\\plugins\\.plugin-appserver\\codex.exe",
    );
    expect(candidates).toContain("C:\\Program Files\\Codex\\codex.exe");
  });
});
