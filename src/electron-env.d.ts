// Deklarasi tipe untuk window.electronAPI (diinjeksikan oleh preload Electron)
import type { ElectronAPI } from "../electron/preload";

declare global {
  interface Window {
    /** Tersedia hanya saat dijalankan di dalam Electron. */
    electronAPI?: ElectronAPI;
  }
}

export {};
