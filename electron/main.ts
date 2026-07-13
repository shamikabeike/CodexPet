import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  session,
  Tray,
} from "electron";
import { join } from "node:path";
import { channels } from "./channels";
import { CodexUsageMonitor } from "./usage/codexUsage";
import { WeatherService } from "./weather/weather";
import type {
  CodexUsageSnapshot,
  WeatherSnapshot,
} from "../src/shared/contracts";
import {
  PANEL_DEFAULT_HEIGHT,
  PANEL_DEFAULT_WIDTH,
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  clampPanelWidth,
  panelHeightForWidth,
} from "../src/shared/windowSizing";

const WINDOW_SIZE = { width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT };
const usageMonitor = new CodexUsageMonitor();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let weatherService: WeatherService | null = null;
let quitting = false;

function isChineseLocale(): boolean {
  return app.getLocale().toLowerCase().startsWith("zh");
}

function trayLabels() {
  return isChineseLocale()
    ? { show: "显示 Miao", alwaysOnTop: "始终置顶", quit: "退出 Miao" }
    : { show: "Show Miao", alwaysOnTop: "Always on top", quit: "Quit Miao" };
}

function rendererUrl(): string | null {
  return process.env.VITE_DEV_SERVER_URL ?? null;
}

function preloadPath(): string {
  return join(__dirname, "preload.js");
}

function safeTrayImage(): Electron.NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M5 11 4 3l8 5c2-.6 6-.6 8 0l8-5-1 8c2 2 3 5 3 8 0 7-5 11-14 11S2 26 2 19c0-3 1-6 3-8Z" fill="#031a18" stroke="#61e8ad" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="11" cy="17" rx="2.4" ry="3" fill="#8bf4c7"/>
      <ellipse cx="21" cy="17" rx="2.4" ry="3" fill="#8bf4c7"/>
      <path d="M14.5 22c1 1.4 2 1.4 3 0" fill="none" stroke="#8bf4c7" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const image = nativeImage.createFromDataURL(dataUrl);
  return image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 32, height: 32 });
}

function showWindow(): void {
  if (mainWindow === null) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function syncTrayMenu(): void {
  if (tray === null) {
    return;
  }

  const labels = trayLabels();
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: labels.show,
        type: "checkbox",
        checked: mainWindow?.isVisible() ?? false,
        click: (item) => {
          if (item.checked) {
            showWindow();
          } else {
            mainWindow?.hide();
          }
        },
      },
      {
        label: labels.alwaysOnTop,
        type: "checkbox",
        checked: mainWindow?.isAlwaysOnTop() ?? true,
        click: (item) => mainWindow?.setAlwaysOnTop(item.checked, "floating"),
      },
      { type: "separator" },
      {
        label: labels.quit,
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...WINDOW_SIZE,
    minWidth: PANEL_MIN_WIDTH,
    minHeight: panelHeightForWidth(PANEL_MIN_WIDTH),
    maxWidth: PANEL_MAX_WIDTH,
    maxHeight: panelHeightForWidth(PANEL_MAX_WIDTH),
    transparent: true,
    frame: false,
    resizable: false,
    show: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  window.setBackgroundColor("#00000000");
  window.setAlwaysOnTop(true, "floating");
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.on("ready-to-show", () => window.showInactive());
  window.on("show", syncTrayMenu);
  window.on("hide", syncTrayMenu);
  window.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      window.hide();
    }
  });

  const devServer = rendererUrl();
  if (devServer !== null) {
    void window.loadURL(devServer);
  } else {
    void window.loadFile(join(__dirname, "../dist/index.html"));
  }

  return window;
}

function createTray(): void {
  tray = new Tray(safeTrayImage());
  tray.setToolTip("Miao");
  syncTrayMenu();
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });
}

function registerIpc(): void {
  ipcMain.handle(channels.usageRead, () => usageMonitor.read());
  ipcMain.handle(channels.usageRefresh, () => usageMonitor.refresh());
  ipcMain.handle(channels.weatherRead, () => weatherService?.read());
  ipcMain.handle(channels.weatherRefresh, () => weatherService?.refresh());
  ipcMain.handle(channels.weatherSetCity, (_event, city: unknown) => {
    if (typeof city !== "string" || weatherService === null) {
      throw new Error("城市名称无效");
    }
    return weatherService.setCity(city);
  });
  ipcMain.on(channels.windowHide, () => mainWindow?.hide());
  ipcMain.on(channels.windowResize, (event, width: unknown) => {
    if (
      mainWindow === null ||
      mainWindow.isDestroyed() ||
      event.sender !== mainWindow.webContents ||
      typeof width !== "number"
    ) {
      return;
    }

    const safeWidth = clampPanelWidth(width);
    mainWindow.setContentSize(safeWidth, panelHeightForWidth(safeWidth));
  });
  ipcMain.on(channels.windowQuit, () => {
    quitting = true;
    app.quit();
  });
}

function publishUsage(snapshot: CodexUsageSnapshot): void {
  if (mainWindow !== null && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channels.usageUpdated, snapshot);
  }
}

function publishWeather(snapshot: WeatherSnapshot): void {
  if (mainWindow !== null && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channels.weatherUpdated, snapshot);
  }
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", showWindow);

  app.whenReady().then(async () => {
    app.setAppUserModelId("io.github.shamikabeike.codexpet");
    session.defaultSession.setPermissionRequestHandler(
      (_webContents, _permission, callback) => callback(false),
    );

    weatherService = new WeatherService(
      join(app.getPath("userData"), "weather-location.json"),
    );
    registerIpc();
    mainWindow = createWindow();
    createTray();
    usageMonitor.on("update", publishUsage);
    weatherService.on("update", publishWeather);
    await Promise.all([usageMonitor.start(), weatherService.start()]);

    app.on("activate", showWindow);
  });
}

app.on("before-quit", () => {
  quitting = true;
  usageMonitor.dispose();
  weatherService?.dispose();
});

app.on("window-all-closed", () => {
  // 常驻托盘；由用户在托盘菜单或应用内明确退出。
});
