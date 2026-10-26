import React, { useState, useMemo } from 'react';
import { ContainerDimensions, CargoItem, PlacedItem } from '../types';
import { Box, Move, Settings, Package, Plus, Trash2, Play, RotateCcw, BarChart3, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Scale, Truck } from 'lucide-react';
import { ITEM_COLORS, TRUCK_PRESETS } from '../constants';

interface ControlPanelProps {
  dimensions: ContainerDimensions;
  setDimensions: React.Dispatch<React.SetStateAction<ContainerDimensions>>;
  cargoItems: CargoItem[];
  setCargoItems: React.Dispatch<React.SetStateAction<CargoItem[]>>;
  onPack: () => void;
  onReset: () => void;
  placedItems: PlacedItem[];
  hasPacked: boolean;
  newItem: Omit<CargoItem, 'id'>;
  setNewItem: React.Dispatch<React.SetStateAction<Omit<CargoItem, 'id'>>>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  dimensions, 
  setDimensions,
  cargoItems,
  setCargoItems,
  onPack,
  onReset,
  placedItems,
  hasPacked,
  newItem,
  setNewItem
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'setup' | 'cargo'>('cargo');
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [formError, setFormError] = useState<string | null>(null);


  
  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    // Volume Stats
    const containerVol = dimensions.length * dimensions.width * dimensions.height;
    const usedVol = placedItems.reduce((acc, item) => acc + (item.length * item.width * item.height), 0);
    const utilization = containerVol > 0 ? (usedVol / containerVol) * 100 : 0;
    
    // Weight Stats
    const totalWeight = placedItems.reduce((acc, item) => acc + item.weight, 0);
    const maxWeight = dimensions.maxWeight || 1; // Avoid div by zero
    const weightUtilization = (totalWeight / maxWeight) * 100;
    const isOverloaded = totalWeight > maxWeight;

    // Count packed items per cargo group
    const packedCounts: Record<string, number> = {};
    placedItems.forEach(p => {
      packedCounts[p.cargoId] = (packedCounts[p.cargoId] || 0) + 1;
    });

    return {
      containerVol,
      usedVol,
      utilization,
      totalWeight,
      maxWeight,
      weightUtilization,
      isOverloaded,
      packedCounts
    };
  }, [dimensions, placedItems]);

// Unpacked (leftover) items after the last calculation
  const unpackedCount = useMemo(
    () =>
      cargoItems.reduce(
        (acc, item) => acc + Math.max(0, item.quantity - (stats.packedCounts[item.id] || 0)),
        0
      ),
    [cargoItems, stats]
  );

  const handleDimChange = (key: keyof ContainerDimensions, value: string) => {
    const parsed = parseInt(value);
    const min = key === 'maxWeight' ? 0 : 1; // dims must stay positive to keep the scene valid
    const numValue = Number.isNaN(parsed) ? min : Math.max(min, parsed);
    setDimensions((prev) => ({ ...prev, [key]: numValue }));
    // If user manually edits, switch preset to Custom
    setActivePreset('custom');
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setActivePreset(selectedName);

    if (selectedName === 'custom') return;

    const preset = TRUCK_PRESETS.find(p => p.name === selectedName);
    if (preset) {
      setDimensions({
        length: preset.length,
        width: preset.width,
        height: preset.height,
        maxWeight: preset.maxWeight
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      setFormError('Nama barang tidak boleh kosong.');
      return;
    }
    if (newItem.length <= 0 || newItem.width <= 0 || newItem.height <= 0) {
      setFormError('Dimensi (P/L/T) harus lebih dari 0 mm.');
      return;
    }
    if (newItem.quantity < 1) {
      setFormError('Jumlah minimal 1.');
      return;
    }
    if (newItem.weight < 0) {
      setFormError('Berat tidak boleh negatif.');
      return;
    }
    setFormError(null);
    setCargoItems((prev) => [...prev, { ...newItem, name: newItem.name.trim(), id: crypto.randomUUID() }]);
  };

  const handleRemoveItem = (id: string) => {
    setCargoItems(cargoItems.filter(item => item.id !== id));
  };

  // Helper to calculate Actual Row (Max items in a single X-slice)
  const getActualRowMetric = (cargoId: string) => {
    const items = placedItems.filter(p => p.cargoId === cargoId);
    if (items.length === 0) return 0;

    // Group by X coordinate (Vertical Wall)
    const walls: Record<string, number> = {};
    items.forEach(item => {
      // Rounding to handle float precision issues
      const xKey = Math.round(item.x).toString();
      walls[xKey] = (walls[xKey] || 0) + 1;
    });

    // Return the max count found in any single wall
    return Math.max(0, ...Object.values(walls));
  };

  return (
    <>
      {/* 
        TOGGLE BUTTON (EXPAND)
      */}
      <div className={`absolute top-4 left-4 z-[60] transition-all duration-300 ease-in-out ${!isExpanded ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 p-2 rounded-lg shadow-xl hover:bg-slate-800 hover:text-white transition-all group"
          title="Show Controls"
        >
          <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 
        MAIN CONTROL PANEL CONTAINER
        Constraints: Max Height relative to Viewport, Flex Column for vertical layout.
      */}
      <div className={`absolute top-4 left-4 z-50 flex flex-col gap-2 w-80 max-h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out origin-top-left ${isExpanded ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'}`}>
        
        {/* Header Row: Tabs + Minimize Button (Fixed at Top) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex-1 flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700 backdrop-blur shadow-xl">
            <button
              onClick={() => setActiveTab('cargo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'cargo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" /> Cargo
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'setup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" /> Container
            </button>
          </div>

          <button 
            onClick={() => setIsExpanded(false)}
            className="shrink-0 bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-400 p-2.5 rounded-lg shadow-xl hover:bg-slate-800 hover:text-white transition-all"
            title="Minimize Controls"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 
          Main Panel Body 
          Flex-1 ensures it takes remaining space up to max-h.
          Overflow-hidden prevents double scrollbars, we handle scroll inside.
        */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-100 rounded-xl shadow-2xl flex-1 min-h-0 overflow-hidden flex flex-col">
          
          {/* SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-5 pb-20 space-y-5">
            
            {/* ---------------- SETUP TAB ---------------- */}
            {activeTab === 'setup' && (
              <div className="space-y-5">
                {/* Truck Preset Dropdown */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                    <Truck className="w-3 h-3" /> Load Truck Template
                  </label>
                  <select
                    value={activePreset}
                    onChange={handlePresetChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="custom">Custom / Manual</option>
                    {TRUCK_PRESETS.map(preset => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                      <Move className="w-3 h-3" /> Length (mm)
                    </label>
                    <input
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => handleDimChange('length', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                      <Move className="w-3 h-3 rotate-90" /> Width (mm)
                    </label>
                    <input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => handleDimChange('width', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                      <Box className="w-3 h-3" /> Height (mm)
                    </label>
                    <input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => handleDimChange('height', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                      <Scale className="w-3 h-3" /> Max Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={dimensions.maxWeight || 10000}
                      onChange={(e) => handleDimChange('maxWeight', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                   <div className="bg-slate-800/50 p-3 rounded-lg">
                      <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Current Capacity</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Volume:</span>
                        <span className="font-mono text-slate-200">{(stats.containerVol / 1e9).toFixed(2)} m³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Weight:</span>
                         <span className="font-mono text-slate-200">{dimensions.maxWeight} kg</span>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* ---------------- CARGO TAB ---------------- */}
            {activeTab === 'cargo' && (
              <div className="space-y-5">
                {/* Add Item Form */}
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 space-y-3">
                  <div className="flex gap-2">
                     <div className="flex-[2]">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Item Name"
                        />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Qty</label>
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">L (mm)</label>
                      <input
                        type="number"
                        value={newItem.length}
                        onChange={(e) => setNewItem({ ...newItem, length: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">W (mm)</label>
                      <input
                        type="number"
                        value={newItem.width}
                        onChange={(e) => setNewItem({ ...newItem, width: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-1">H (mm)</label>
                      <input
                        type="number"
                        value={newItem.height}
                        onChange={(e) => setNewItem({ ...newItem, height: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1">Weight per Item (kg)</label>
                    <input
                      type="number"
                      value={newItem.weight}
                      onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block mb-1">Color</label>
                    <div className="flex gap-1 flex-wrap">
                      {ITEM_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewItem({ ...newItem, color: c })}
                          className={`w-6 h-6 rounded-md transition-transform ${newItem.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {formError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/50 rounded-lg px-2 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
                    </div>
                  )}

                  <button
                    onClick={handleAddItem}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {/* Item List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items List</h3>
                    <span className="text-[10px] text-slate-500">{cargoItems.length} items</span>
                  </div>
                  
                  {cargoItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                      No items added yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cargoItems.map((item) => {
                        const packedCount = stats.packedCounts[item.id] || 0;
                        const isFullyPacked = packedCount === item.quantity;
                        
                        // --- Metric Calculations ---
                        // 1. Theoretical Max Row: (ContW / ItemW) * (ContH / ItemH)
                        // Note: We use dimension indices [0,1,2] generically. 
                        // Here, container width is axis Z, height is axis Y. Item width is axis Z, height is axis Y.
                        const countAlongWidth = Math.floor(dimensions.width / item.width);
                        const countAlongHeight = Math.floor(dimensions.height / item.height);
                        const maxRow = countAlongWidth * countAlongHeight;

                        // 2. Actual Row: Max items found in a single Vertical Slice (X-axis)
                        const actualRow = getActualRowMetric(item.id);

                        return (
                          <div key={item.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex gap-3 group relative overflow-hidden">
                            <div 
                              className="w-1.5 self-stretch rounded-full shrink-0" 
                              style={{ backgroundColor: item.color }} 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm truncate text-slate-200">{item.name}</h4>
                                <button 
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                              <div className="text-[10px] text-slate-400 mb-2">
                                {item.length}x{item.width}x{item.height}mm • {item.weight}kg
                              </div>

                              {/* Metrics Badge Row */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                 {/* Max Row Badge (Theoretical) */}
                                 <div className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-600 bg-slate-700/30 text-[9px] text-slate-400" title={`Max Capacity per Vertical Wall: ${countAlongWidth} wide x ${countAlongHeight} high`}>
                                    <span className="mr-1 opacity-70">Max Row:</span>
                                    <span className="font-mono">{maxRow}</span>
                                 </div>

                                 {/* Actual Row Badge (Real Performance) */}
                                 {actualRow > 0 && (
                                   <div className="inline-flex items-center px-1.5 py-0.5 rounded border border-blue-900/50 bg-blue-900/20 text-[9px] text-blue-300" title="Maximum items actually packed in a single vertical wall">
                                      <span className="mr-1 opacity-70">Actual Row:</span>
                                      <span className="font-bold font-mono">{actualRow}</span>
                                   </div>
                                 )}
                              </div>
                              
                              <div className="flex justify-between items-center pt-1 border-t border-slate-700/50">
                                <div className="flex items-center gap-1.5">
                                  {isFullyPacked ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                                  )}
                                  <span className={`text-xs font-mono ${isFullyPacked ? 'text-green-400' : 'text-slate-300'}`}>
                                    {packedCount} <span className="text-slate-500">/</span> {item.quantity}
                                  </span>
                                </div>
                                <span className="text-[9px] uppercase font-bold text-slate-600">packed</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onReset}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" /> Clear
                  </button>
                  <button
                    onClick={onPack}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-500 transition-all shadow-lg shadow-green-900/20 active:translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> Calculate Load
                  </button>
                </div>

                {/* UNPACKED WARNING */}
                {hasPacked && unpackedCount > 0 && (
                  <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 rounded-lg px-3 py-2 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {unpackedCount} item tidak muat (terbatas volume atau berat maksimum truk).
                    </span>
                  </div>
                )}

                {/* STATISTICS PANEL (Integrated into scroll flow) */}
                {(stats.usedVol > 0 || stats.totalWeight > 0) && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase">Load Statistics</h3>
                    </div>
                    
                    {/* Volume Stats */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Volume Utilization</span>
                        <span>{stats.utilization.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            stats.utilization > 90 ? 'bg-red-500' : 
                            stats.utilization > 75 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${stats.utilization}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{(stats.usedVol / 1e9).toFixed(2)} m³</span>
                        <span>{(stats.containerVol / 1e9).toFixed(2)} m³</span>
                      </div>
                    </div>

                    {/* Weight Stats */}
                    <div className="space-y-1 pt-2 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Weight Utilization</span>
                        <span className={stats.isOverloaded ? 'text-red-500' : ''}>
                          {stats.weightUtilization.toFixed(1)}%
                        </span>
                      </div>
                      
                      {stats.isOverloaded && (
                         <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold animate-pulse">
                            <AlertCircle className="w-3 h-3" /> OVERLOADED
                         </div>
                      )}

                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            stats.isOverloaded ? 'bg-red-600' : 
                            stats.weightUtilization > 90 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stats.weightUtilization)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{stats.totalWeight} kg</span>
                        <span>{stats.maxWeight} kg</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
