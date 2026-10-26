export interface ContainerDimensions {
  length: number; // mm
  width: number;  // mm
  height: number; // mm
  maxWeight: number; // kg
}

export interface CameraState {
  position: [number, number, number];
  fov: number;
}

export interface CargoItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number; // kg
  quantity: number;
  color: string;
}

export interface PlacedItem {
  id: string;
  cargoId: string;
  name: string; // display name of the source cargo item
  x: number; // mm relative to origin
  y: number; // mm relative to origin
  z: number; // mm relative to origin
  length: number;
  width: number;
  height: number;
  weight: number; // kg
  color: string;
}