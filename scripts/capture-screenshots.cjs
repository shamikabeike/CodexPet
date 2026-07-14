const { app, BrowserWindow } = require("electron");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const entryFile = path.join(projectRoot, "dist", "index.html");
const outputDirectory = path.join(projectRoot, "docs", "screenshots");

const shots = [
  { fileName: "miao-zh-cn.png", width: 520, height: 460, lang: "zh" },
  { fileName: "miao-en-us.png", width: 520, height: 460, lang: "en" },
  { fileName: "miao-compact.png", width: 240, height: 160, lang: "zh" },
];

async function captureShot(shot) {
  const window = new BrowserWindow({
    width: shot.width,
    height: shot.height,
    useContentSize: true,
    show: false,
    frame: false,
    backgroundColor: "#0d1117",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      offscreen: true,
    },
  });

  await window.loadFile(entryFile, { query: { lang: shot.lang } });
  await window.webContents.executeJavaScript(
    "document.fonts.ready.then(() => new Promise((resolve) => setTimeout(resolve, 250)))",
  );
  const image = await window.webContents.capturePage();
  await writeFile(path.join(outputDirectory, shot.fileName), image.toPNG());
  return window;
}

app.whenReady().then(async () => {
  const windows = [];
  try {
    for (const shot of shots) {
      windows.push(await captureShot(shot));
    }
    windows.forEach((window) => window.destroy());
    app.quit();
  } catch (error) {
    console.error(error);
    windows.forEach((window) => window.destroy());
    process.exitCode = 1;
    app.quit();
  }
});
