import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ContainerDimensions } from '../types';
import { Vector3 } from 'three';

interface CameraControllerProps {
  dimensions: ContainerDimensions;
}

export const CameraController: React.FC<CameraControllerProps> = ({ dimensions }) => {
  const { camera, controls } = useThree();
  const orbitControls = controls as unknown as OrbitControlsImpl | null;

  useEffect(() => {
    if (!orbitControls) return;

    const length = dimensions.length / 1000;
    const height = dimensions.height / 1000;
    const width = dimensions.width / 1000;

    // The container sits on the grid, centered on X/Z, so its visual center is at y = height/2.
    const center = new Vector3(0, height / 2, 0);

    // Frame the whole container with a comfortable margin.
    const maxDim = Math.max(length, height, width);
    const distance = maxDim * 2.5;

    camera.position.set(distance * 0.8, distance * 0.6, distance * 0.8);
    orbitControls.target.copy(center);
    orbitControls.update();
  }, [dimensions, camera, orbitControls]);

  return null;
};
