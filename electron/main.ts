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

function iconPath(fileName: string): string {
  const baseDirectory = app.isPackaged
    ? process.resourcesPath
    : join(__dirname, "..");
  return join(baseDirectory, "assets", fileName);
}

function safeTrayImage(): Electron.NativeImage {
  for (const fileName of ["miao.ico", "miao-tray.png"]) {
    const image = nativeImage.createFromPath(iconPath(fileName));
    if (!image.isEmpty()) {
      return image;
    }
  }

  throw new Error("Miao tray icon assets could not be loaded");
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
    icon: iconPath("miao.ico"),
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
