import { ContainerDimensions } from './types';

export const DEFAULT_DIMENSIONS: ContainerDimensions = {
  length: 4000,
  width: 1900,
  height: 2000,
  maxWeight: 10000, // kg
};

export const TRUCK_PRESETS = [
  {
    name: 'CDD Bak (Open Truck 5T)',
    length: 4500,
    width: 2000,
    height: 2000,
    maxWeight: 5000
  },
  {
    name: 'CDD Box (Dry Box 5T)',
    length: 4500,
    width: 2100,
    height: 2200,
    maxWeight: 5000
  },
  {
    name: 'Fuso Wingbox (10T)',
    length: 9500,
    width: 2500,
    height: 2700,
    maxWeight: 10000
  },
  {
    name: 'Fuso Bak Long (Open 10T)',
    length: 8500,
    width: 2500,
    height: 2500, // Safe stacking limit
    maxWeight: 10000
  }
];

// 3D Scene Constants
export const SCENE_BACKGROUND_COLOR = '#1e293b'; // slate-800
export const GRID_SIZE = 20;
export const GRID_DIVISIONS = 20;
export const CONTAINER_COLOR = '#3b82f6'; // blue-500
export const CONTAINER_OPACITY = 0.15;
export const EDGE_COLOR = '#60a5fa'; // blue-400

export const ITEM_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
];