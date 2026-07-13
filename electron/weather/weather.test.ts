import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  conditionFromWmoCode,
  normalizeCityQuery,
  WeatherService,
} from "./weather";

describe("天气适配器", () => {
  it.each([
    [0, "clear"],
    [3, "cloudy"],
    [45, "fog"],
    [61, "rain"],
    [75, "snow"],
    [96, "storm"],
    [120, "unknown"],
  ] as const)("WMO %s 映射为 %s", (code, expected) => {
    expect(conditionFromWmoCode(code)).toBe(expected);
  });

  it("清理城市输入并拒绝无效值", () => {
    expect(normalizeCityQuery("  杭州   西湖  ")).toBe("杭州 西湖");
    expect(() => normalizeCityQuery("杭")).toThrow("2–64");
  });

  it("读取体感温度、湿度和风速", async () => {
    const testDirectory = await mkdtemp(join(tmpdir(), "miao-weather-"));
    let requestIndex = 0;
    const fetcher = async () => {
      requestIndex += 1;
      if (requestIndex === 1) {
        return new Response(
          JSON.stringify({
            results: [{
              name: "杭州",
              latitude: 30.27,
              longitude: 120.15,
              timezone: "Asia/Shanghai",
            }],
          }),
        );
      }

      return new Response(
        JSON.stringify({
          current: {
            temperature_2m: 27.2,
            apparent_temperature: 29.4,
            relative_humidity_2m: 76,
            wind_speed_10m: 12.3,
            weather_code: 2,
            is_day: 1,
          },
        }),
      );
    };

    try {
      const service = new WeatherService(
        join(testDirectory, "weather-location.json"),
        fetcher,
      );
      const snapshot = await service.setCity("杭州");

      expect(snapshot.apparentTemperatureC).toBe(29);
      expect(snapshot.relativeHumidityPercent).toBe(76);
      expect(snapshot.windSpeedKmh).toBe(12);
    } finally {
      await rm(testDirectory, { recursive: true, force: true });
    }
  });
});
