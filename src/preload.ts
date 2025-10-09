import { contextBridge, ipcRenderer } from "electron";

// Example secure channel exposure
contextBridge.exposeInMainWorld("appApi", {
  ping: () => ipcRenderer.invoke("ping"),
});
