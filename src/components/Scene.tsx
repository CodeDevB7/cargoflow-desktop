import React, { useMemo } from 'react';
import { Suspense } from 'react';
import { OrbitControls, GizmoHelper, GizmoViewport, Environment, ContactShadows } from '@react-three/drei';
import { ContainerBox } from './ContainerBox';
import { PlacedItemBox } from './PlacedItem';
import { CameraController } from './CameraController';
import { ContainerDimensions, PlacedItem } from '../types';
import { GRID_SIZE, GRID_DIVISIONS, SCENE_BACKGROUND_COLOR } from '../constants';

interface SceneProps {
  dimensions: ContainerDimensions;
  placedItems: PlacedItem[];
}

export const Scene: React.FC<SceneProps> = ({ dimensions, placedItems }) => {
  
  // Calculate the offset to align the Algorithm's (0,0,0) with the Visual Container's corner.
  // The container is centered at (0,0,0) in the world. 
  // So the corner starts at (-Length/2, 0, -Width/2).
  const itemGroupPosition = useMemo(() => {
    const offsetX = -(dimensions.length / 1000) / 2;
    const offsetZ = -(dimensions.width / 1000) / 2;
    return [offsetX, 0, offsetZ] as [number, number, number];
  }, [dimensions]);

  return (
    <>
      <CameraController dimensions={dimensions} />

      {/* Scene Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight 
        position={[-10, 15, 5]} 
        intensity={0.6} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <color attach="background" args={[SCENE_BACKGROUND_COLOR]} />

      {/* Ground Grid */}
      <gridHelper 
        args={[GRID_SIZE, GRID_DIVISIONS, '#475569', '#1e293b']} 
        position={[0, -0.01, 0]} 
      />

      {/* The Truck Container (Visual Reference) */}
      <ContainerBox dimensions={dimensions} />

      {/* Render Packed Items */}
      {/* We offset this group so that (0,0,0) inside this group matches the corner of the container */}
      <group position={itemGroupPosition}>
        {placedItems.map((item) => (
          <PlacedItemBox key={item.id} data={item} />
        ))}
      </group>

      {/* Shadows */}
      <ContactShadows resolution={1024} scale={50} blur={1} opacity={0.5} far={10} color="#0f172a" />
      
      {/* Controls */}
      <OrbitControls 
        makeDefault
        enableDamping
        minPolarAngle={0}

        maxPolarAngle={Math.PI / 2 - 0.05} 
        dampingFactor={0.05}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
};