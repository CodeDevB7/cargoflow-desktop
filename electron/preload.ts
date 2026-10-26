import { contextBridge, ipcRenderer } from "electron";

// API aman yang tersedia untuk renderer (React) via window.electronAPI
const electronAPI = {
  platform: process.platform,
  saveManifest: (defaultName: string, json: string): Promise<SaveResult> =>
    ipcRenderer.invoke("save-manifest", defaultName, json),
  openManifest: (): Promise<OpenResult> =>
    ipcRenderer.invoke("open-manifest"),
  revealPath: (targetPath: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke("reveal-path", targetPath),
};

type SaveResult =
  | { ok: true; filePath: string }
  | { ok: false; canceled?: boolean; error?: string };

type OpenResult =
  | { ok: true; filePath: string; content: string }
  | { ok: false; canceled?: boolean; error?: string };

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
