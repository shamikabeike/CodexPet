import { contextBridge, ipcRenderer } from "electron";
import { channels } from "./channels";
import type {
  CodexPetApi,
  CodexUsageSnapshot,
  WeatherSnapshot,
} from "../src/shared/contracts";

const api: CodexPetApi = {
  usage: {
    read: () => ipcRenderer.invoke(channels.usageRead),
    refresh: () => ipcRenderer.invoke(channels.usageRefresh),
    subscribe: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, snapshot: CodexUsageSnapshot) => {
        listener(snapshot);
      };
      ipcRenderer.on(channels.usageUpdated, handler);
      return () => ipcRenderer.removeListener(channels.usageUpdated, handler);
    },
  },
  weather: {
    read: () => ipcRenderer.invoke(channels.weatherRead),
    refresh: () => ipcRenderer.invoke(channels.weatherRefresh),
    setCity: (city) => ipcRenderer.invoke(channels.weatherSetCity, city),
    subscribe: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, snapshot: WeatherSnapshot) => {
        listener(snapshot);
      };
      ipcRenderer.on(channels.weatherUpdated, handler);
      return () => ipcRenderer.removeListener(channels.weatherUpdated, handler);
    },
  },
  window: {
    hide: () => ipcRenderer.send(channels.windowHide),
    quit: () => ipcRenderer.send(channels.windowQuit),
    resize: (width) => ipcRenderer.send(channels.windowResize, width),
  },
};

contextBridge.exposeInMainWorld("codexPet", Object.freeze(api));
