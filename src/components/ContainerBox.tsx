import React, { useMemo } from 'react';
import { Edges, Text } from '@react-three/drei';
import { ContainerDimensions } from '../types';
import { CONTAINER_COLOR, CONTAINER_OPACITY, EDGE_COLOR } from '../constants';

interface ContainerBoxProps {
  dimensions: ContainerDimensions;
}

export const ContainerBox: React.FC<ContainerBoxProps> = ({ dimensions }) => {
  // Convert mm to meters for Three.js scene (1 unit = 1 meter)
  const lengthM = dimensions.length / 1000;
  const widthM = dimensions.width / 1000;
  const heightM = dimensions.height / 1000;

  // Calculate position:
  // We want the box to sit ON the grid (y = 0).
  // BoxGeometry centers at (0,0,0) by default.
  // So we raise it by half its height.
  const positionY = heightM / 2;

  // Dimensions string for display
  const dimensionLabel = useMemo(() => 
    `${(dimensions.length/1000).toFixed(1)}m x ${(dimensions.width/1000).toFixed(1)}m x ${(dimensions.height/1000).toFixed(1)}m`, 
    [dimensions]
  );

  return (
    <group>
      {/* The Main Transparency Box */}
      <mesh position={[0, positionY, 0]} receiveShadow castShadow>
        {/* args: width (x), height (y), depth (z) */}
        {/* In logistics: Length is usually depth (Z) or X. Let's align Length with X-axis, Width with Z-axis */}
        <boxGeometry args={[lengthM, heightM, widthM]} />
        <meshStandardMaterial
          color={CONTAINER_COLOR}
          transparent
          opacity={CONTAINER_OPACITY}
          roughness={0.1}
          metalness={0.1}
        />
        {/* Crisp Edges */}
        <Edges
          scale={1}
          threshold={15} // Display edges only when angle > 15 degrees
          color={EDGE_COLOR}
        />
      </mesh>

      {/* Ground Shadow Catcher (Optional visual grounding) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[lengthM, widthM]} />
        <meshBasicMaterial color={CONTAINER_COLOR} transparent opacity={0.1} />
      </mesh>

      {/* Floating Label above the container */}
      <Text
        position={[0, heightM + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        {dimensionLabel}
      </Text>
    </group>
  );
};
