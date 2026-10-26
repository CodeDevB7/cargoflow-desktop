import React, { useState, useEffect } from 'react';
import { Calculator, ChevronRight, Plus, Check } from 'lucide-react';
import { ContainerDimensions, CargoItem } from '../types';
import { ITEM_COLORS } from '../constants';

interface CalculatorPanelProps {
  containerDimensions: ContainerDimensions;
  onAddItem: (item: Omit<CargoItem, 'id'>) => void;
}

export const CalculatorPanel: React.FC<CalculatorPanelProps> = ({ 
  containerDimensions, 
  onAddItem 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Calculation Inputs
  const [counts, setCounts] = useState({
    length: 1, // Along length (Panjang ke belakang)
    width: 1,  // Along width (Samping)
    height: 1, // Along height (Susun)
  });
  const [gap, setGap] = useState(0); // Total tolerance gap in mm

  // Calculated Result
  const [result, setResult] = useState({
    length: 0,
    width: 0,
    height: 0
  });

  // New Item Details State
  const [itemName, setItemName] = useState('Stack Item');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(10);
  const [selectedColor, setSelectedColor] = useState(ITEM_COLORS[4]); // Default cyan

  // Auto-calculate whenever inputs or container dimensions change
  useEffect(() => {
    const l = Math.floor((containerDimensions.length - gap) / Math.max(1, counts.length));
    const w = Math.floor((containerDimensions.width - gap) / Math.max(1, counts.width));
    const h = Math.floor((containerDimensions.height - gap) / Math.max(1, counts.height));
    
    setResult({
      length: Math.max(1, l),
      width: Math.max(1, w),
      height: Math.max(1, h)
    });
  }, [containerDimensions, counts, gap]);

  const handleAddClick = () => {
    // Construct the new item
    const newItem: Omit<CargoItem, 'id'> = {
      name: itemName || `Item ${result.length}x${result.width}x${result.height}`,
      length: result.length,
      width: result.width,
      height: result.height,
      weight: weight,
      quantity: quantity,
      color: selectedColor
    };

    // Pass to App to add to list
    onAddItem(newItem);

    // Show success feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Reset form fields (Name and Qty) but keep dimensions/counts for rapid entry
    setItemName('Stack Item');
    setQuantity(1);
  };

  return (
    <>
      {/* Toggle Button */}
      <div className={`absolute top-4 right-4 z-[60] transition-all duration-300 ease-in-out ${!isExpanded ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 p-2 rounded-lg shadow-xl hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 group"
          title="Open Calculator"
        >
          <span className="text-xs font-bold uppercase hidden group-hover:block">Quick Add</span>
          <Calculator className="w-6 h-6" />
        </button>
      </div>

      {/* Main Panel */}
      <div className={`absolute top-4 right-4 z-50 flex flex-col gap-2 transition-all duration-300 ease-in-out origin-top-right ${isExpanded ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-4 scale-95 pointer-events-none'}`}>
        
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-100 rounded-xl shadow-2xl w-72 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Stack Calculator</h3>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Stack Count Inputs */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Stack Counts (Rows/Cols)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">L (Back)</label>
                  <input 
                    type="number" min="1"
                    value={counts.length}
                    onChange={(e) => setCounts({...counts, length: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">H (High)</label>
                  <input 
                    type="number" min="1"
                    value={counts.height}
                    onChange={(e) => setCounts({...counts, height: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">W (Side)</label>
                  <input 
                    type="number" min="1"
                    value={counts.width}
                    onChange={(e) => setCounts({...counts, width: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Gap Input */}
            <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[10px] text-slate-400 uppercase font-bold">Gap / Tolerance</label>
                 <span className="text-[9px] text-slate-500">{gap} mm total</span>
               </div>
               <input 
                 type="range" min="0" max="500" step="10"
                 value={gap}
                 onChange={(e) => setGap(parseInt(e.target.value))}
                 className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
               />
            </div>

            {/* Calculation Result */}
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 text-center">Calculated Item Size</div>
              <div className="font-mono text-center text-blue-400 font-bold text-sm">
                {result.length} x {result.width} x {result.height} <span className="text-[10px] text-slate-500">mm</span>
              </div>
            </div>

            {/* Quick Add Inputs */}
            <div className="pt-2 border-t border-slate-700 space-y-3">
               <div className="flex gap-2">
                  <div className="flex-[2]">
                    <label className="text-[9px] text-slate-500 block mb-0.5">Name</label>
                    <input 
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500 block mb-0.5">Qty</label>
                    <input 
                      type="number" min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
               </div>

               <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">Weight per Item (kg)</label>
                  <input 
                      type="number" min="0"
                      value={weight}
                      onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
               </div>
               
               {/* Color Selection */}
               <div>
                  <label className="text-[9px] text-slate-500 block mb-1">Color</label>
                  <div className="flex gap-1 flex-wrap">
                    {ITEM_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 rounded-md transition-transform ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
               </div>

               {/* Add Button */}
               <button 
                 onClick={handleAddClick}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 mt-2 relative overflow-hidden"
               >
                 {showSuccess ? (
                   <>
                    <Check className="w-4 h-4" /> Added!
                   </>
                 ) : (
                   <>
                    <Plus className="w-4 h-4" /> Add to Container
                   </>
                 )}
               </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};