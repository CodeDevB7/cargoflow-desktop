import React, { useState } from 'react';
import { Edges, Html } from '@react-three/drei';
import { PlacedItem } from '../types';

interface PlacedItemProps {
  data: PlacedItem;
}

export const PlacedItemBox: React.FC<PlacedItemProps> = ({ data }) => {
  const [hovered, setHover] = useState(false);

  // Convert mm to meters
  const x = data.x / 1000;
  const y = data.y / 1000;
  const z = data.z / 1000;
  
  const l = data.length / 1000; // X axis
  const h = data.height / 1000; // Y axis
  const w = data.width / 1000;  // Z axis

  // Three.js Box geometries are centered at (0,0,0)
  // Our data.x/y/z is the bottom-left-back corner.
  // We need to shift the mesh center by half dimensions.
  const centerX = x + l / 2;
  const centerY = y + h / 2;
  const centerZ = z + w / 2;

  return (
    <mesh
      position={[centerX, centerY, centerZ]}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
      castShadow
      receiveShadow
    >
      {/* args: width(x), height(y), depth(z) */}
      <boxGeometry args={[l, h, w]} />
      <meshStandardMaterial
        color={hovered ? '#cbd5e1' : data.color}
        roughness={0.5}
        metalness={0.1}
      />
      <Edges
        scale={1}
        threshold={15}
        color={hovered ? 'white' : 'black'}
        renderOrder={1000}
      />
      {hovered && (
        <Html position={[centerX, centerY + h / 2 + 0.15, centerZ]} center distanceFactor={8} pointerEvents="none">
          <div className="bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-slate-600 pointer-events-none select-none">
            <span className="font-bold">{data.name}</span> ·
            {data.length}×{data.width}×{data.height} mm • {data.weight} kg
          </div>
        </Html>
      )}
    </mesh>
  );
};
