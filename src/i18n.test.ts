import { describe, expect, it } from "vitest";
import { resolveLocale } from "./i18n";

describe("界面语言", () => {
  it.each(["zh", "zh-CN", "zh-TW"])("将 %s 识别为中文", (language) => {
    expect(resolveLocale(language)).toBe("zh-CN");
  });

  it.each(["en", "en-US", "fr-FR", undefined])(
    "将 %s 识别为英文",
    (language) => {
      expect(resolveLocale(language)).toBe("en-US");
    },
  );
});
