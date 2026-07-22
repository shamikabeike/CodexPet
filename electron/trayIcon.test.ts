import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const assetsDirectory = join(process.cwd(), "assets");

describe("Miao desktop icon assets", () => {
  it("contains a valid multi-size ICO file", () => {
    const icon = readFileSync(join(assetsDirectory, "miao.ico"));

    expect(icon.readUInt16LE(0)).toBe(0);
    expect(icon.readUInt16LE(2)).toBe(1);
    expect(icon.readUInt16LE(4)).toBeGreaterThanOrEqual(6);
  });

  it("contains transparent PNG fallbacks", () => {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    for (const fileName of ["miao-tray.png", "miao-app.png", "miao-mac.png"]) {
      const image = readFileSync(join(assetsDirectory, fileName));
      expect(image.subarray(0, 8)).toEqual(pngSignature);
    }
  });

  it("contains a 1024px macOS application icon", () => {
    const image = readFileSync(join(assetsDirectory, "miao-mac.png"));

    expect(image.readUInt32BE(16)).toBe(1024);
    expect(image.readUInt32BE(20)).toBe(1024);
  });
});
