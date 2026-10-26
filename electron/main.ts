import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import fs from "node:fs";

// Direktori penting
const DIST = path.join(__dirname, "..", "..", "dist");
const PRELOAD = path.join(__dirname, "preload.js");

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "CargoFlow 3D",
    backgroundColor: "#0a0a12",
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  if (isDev) {
    // Mode pengembangan: gunakan dev server Vite
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // Mode produksi: muat hasil build statis
    mainWindow.loadFile(path.join(DIST, "index.html"));
  }

  // Buka link eksternal di browser default, bukan di dalam aplikasi
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => (mainWindow = null));
}

// ===== IPC: Simpan manifest sebagai file JSON asli =====
ipcMain.handle("save-manifest", async (_evt, defaultName: string, json: string) => {
  if (!mainWindow) return { ok: false, canceled: true };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Simpan Manifest Kargo",
    defaultPath: defaultName,
    filters: [{ name: "JSON Manifest", extensions: ["json"] }],
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(filePath, json, "utf-8");
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// ===== IPC: Buka folder tempat file disimpan =====
ipcMain.handle("reveal-path", async (_evt, targetPath: string) => {
  shell.showItemInFolder(targetPath);
  return { ok: true };
});

// ===== IPC: Muat manifest yang sudah disimpan =====
ipcMain.handle("open-manifest", async () => {
  if (!mainWindow) return { ok: false, canceled: true };
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Buka Manifest Kargo",
    filters: [{ name: "JSON Manifest", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0) return { ok: false, canceled: true };
  try {
    const content = fs.readFileSync(filePaths[0], "utf-8");
    return { ok: true, filePath: filePaths[0], content };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
