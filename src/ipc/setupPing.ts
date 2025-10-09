import { ipcMain } from "electron";

export function registerPing() {
  ipcMain.handle("ping", () => "pong");
}
