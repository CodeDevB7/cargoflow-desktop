# CargoFlow 3D — Desktop (Windows EXE)

Aplikasi desktop simulasi pemuatan kargo ke dalam kontainer/truk secara 3D.
Dibangun dengan **Electron + React 19 + Vite + Three.js (react-three-fiber) + Tailwind CSS v4**.

## Fitur
- Visualisasi 3D penataan kargo (rotasi kamera, zoom, tooltip per item)
- Preset truk (CDE, CBE, Fuso, Engkel, dll.) + dimensi custom
- Algoritma packing 3D dengan validasi volume & berat (anti-overload)
- Kalkulator kapasitas barang
- **Export Manifest** — simpan hasil penataan sebagai file JSON asli (dialog native Windows)
- **Buka Manifest** — muat kembali sesi kerja yang pernah disimpan (khusus desktop)

## Menjalankan (mode pengembangan)
```bash
npm install
npm run dev        # Vite dev server + jendela Electron otomatis terbuka
```

## Membangun file .exe Windows
Jalankan di mesin **Windows**:
```bash
npm run build:win        # Installer NSIS + versi portable (.exe tunggal)
npm run build:portable   # Hanya portable .exe
```
Hasil berada di folder `release/`:
- `CargoFlow 3D-Setup-1.0.0.exe` → installer (shortcut desktop, bisa pilih folder instalasi)
- `CargoFlow 3D-Portable-1.0.0.exe` → cukup doble-klik, tanpa instalasi

> Catatan: membangun dari Linux/macOS juga bisa (via Wine untuk NSIS), tetapi
> membangun langsung di Windows adalah cara yang paling andal dan direkomendasikan.

## Struktur
```
electron/         # Proses utama & preload Electron (main.ts, preload.ts)
src/              # Aplikasi React (renderer)
dist/             # Hasil build renderer (Vite)
dist-electron/    # Hasil build proses utama (TypeScript → CommonJS)
release/          # Artefak .exe hasil electron-builder
```

## Skrip lain
- `npm run typecheck` — pemeriksaan tipe renderer + electron
- `npm run preview` — pratinjau build web biasa (tanpa Electron)
