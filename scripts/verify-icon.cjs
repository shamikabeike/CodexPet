const { app, nativeImage } = require("electron");
const { join } = require("node:path");

app.whenReady().then(() => {
  const assetsDirectory = join(__dirname, "..", "assets");
  const results = ["miao.ico", "miao-tray.png", "miao-app.png", "miao-mac.png"].map(
    (fileName) => {
      const image = nativeImage.createFromPath(join(assetsDirectory, fileName));
      if (image.isEmpty()) {
        throw new Error(`图标无法由 Electron 加载：${fileName}`);
      }

      const size = image.getSize();
      const bitmap = image.toBitmap();
      const alphaAt = (x, y) => bitmap[(y * size.width + x) * 4 + 3];
      const cornerAlpha = [
        alphaAt(0, 0),
        alphaAt(size.width - 1, 0),
        alphaAt(0, size.height - 1),
        alphaAt(size.width - 1, size.height - 1),
      ];
      if (cornerAlpha.some((alpha) => alpha !== 0)) {
        throw new Error(`图标四角不是全透明：${fileName}`);
      }

      return { fileName, size, cornerAlpha };
    },
  );

  process.stdout.write(`${JSON.stringify(results)}\n`);
  app.quit();
});
