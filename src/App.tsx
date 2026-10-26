import React, { useState, useCallback } from 'react';
import { Download, FolderOpen } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { ControlPanel } from './components/ControlPanel';
import { CalculatorPanel } from './components/CalculatorPanel';
import { DEFAULT_DIMENSIONS, ITEM_COLORS } from './constants';
import { ContainerDimensions, CargoItem, PlacedItem } from './types';
import { packCargo } from './utils/packingAlgorithm';

const buildManifest = (dimensions: ContainerDimensions, placedItems: PlacedItem[]) => ({
  app: 'CargoFlow 3D',
  version: 1,
  generatedAt: new Date().toISOString(),
  container: dimensions,
  totalWeightKg: placedItems.reduce((acc, i) => acc + i.weight, 0),
  items: placedItems.map(({ id, name, x, y, z, length, width, height, weight }) => ({
    id, name, x, y, z, length, width, height, weight,
  })),
});

const App: React.FC = () => {
  // Container State
  const [dimensions, setDimensions] = useState<ContainerDimensions>(DEFAULT_DIMENSIONS);
  
  // Cargo State
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [hasPacked, setHasPacked] = useState(false);

  // New Item State (Lifted from ControlPanel to share with Calculator)
  const [newItem, setNewItem] = useState<Omit<CargoItem, 'id'>>({
    name: 'Box A',
    length: 1000,
    width: 1000,
    height: 1000,
    weight: 100,
    quantity: 1,
    color: ITEM_COLORS[5]
  });

  // Packing Action
  const handlePack = useCallback(() => {
    const result = packCargo(dimensions, cargoItems);
    setPlacedItems(result);
    setHasPacked(true);
  }, [dimensions, cargoItems]);

  // Reset Action
  const handleReset = useCallback(() => {
    setCargoItems([]);
    setPlacedItems([]);
    setHasPacked(false);
  }, []);

  // Direct Add Item (Quick Add from Calculator)
  const handleDirectAddItem = useCallback((item: Omit<CargoItem, 'id'>) => {
    setCargoItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  // Export packed manifest — pakai dialog native saat di Electron, fallback download di browser
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);

  const handleExportJson = useCallback(async () => {
    const manifest = buildManifest(dimensions, placedItems);
    const json = JSON.stringify(manifest, null, 2);

    if (window.electronAPI) {
      const res = await window.electronAPI.saveManifest('cargoflow-manifest.json', json);
      if (res.ok) setLastSavedPath(res.filePath);
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cargoflow-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [dimensions, placedItems]);

  // Buka manifest yang pernah disimpan (Electron only)
  const handleOpenManifest = useCallback(async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.openManifest();
    if (res.ok) {
      try {
        const data = JSON.parse(res.content);
        if (data?.container) setDimensions(data.container as ContainerDimensions);
        if (Array.isArray(data?.items)) {
          setPlacedItems(data.items as PlacedItem[]);
          setHasPacked(true);
        }
      } catch {
        /* file tidak valid — abaikan */
      }
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Left UI Overlay */}
      <ControlPanel 
        dimensions={dimensions} 
        setDimensions={setDimensions}
        cargoItems={cargoItems}
        setCargoItems={setCargoItems}
        onPack={handlePack}
        onReset={handleReset}
        placedItems={placedItems}
        hasPacked={hasPacked}
        newItem={newItem}
        setNewItem={setNewItem}
      />

      {/* Right UI Overlay (Helper Tool) */}
      <CalculatorPanel 
        containerDimensions={dimensions}
        onAddItem={handleDirectAddItem}
      />

      {/* 3D Canvas */}
      <div className="w-full h-full">
        <Canvas
          shadows
          camera={{ position: [8, 6, 10], fov: 35 }}
          dpr={[1, 2]}
        >
          <Scene 
            dimensions={dimensions} 
            placedItems={placedItems} 
          />
        </Canvas>
      </div>

      {/* Action bar bawah-kanan */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {placedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg shadow-xl transition-colors"
              title="Simpan daftar muatan sebagai JSON"
            >
              <Download className="w-4 h-4" /> Export Manifest
            </button>
            {window.electronAPI && (
              <button
                onClick={handleOpenManifest}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg shadow-xl transition-colors"
                title="Buka manifest yang pernah disimpan"
              >
                <FolderOpen className="w-4 h-4" /> Buka Manifest
              </button>
            )}
          </div>
        )}
        {lastSavedPath && (
          <button
            onClick={() => window.electronAPI?.revealPath(lastSavedPath)}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline decoration-dotted truncate max-w-72 pointer-events-auto"
            title={`Klik untuk membuka lokasi file: ${lastSavedPath}`}
          >
            Tersimpan di: {lastSavedPath}
          </button>
        )}
        <div className="text-slate-500 text-[10px] pointer-events-none select-none">
          CargoFlow 3D • Drag to Rotate • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};

export default App;