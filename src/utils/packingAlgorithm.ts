import { CargoItem, ContainerDimensions, PlacedItem } from '../types';

interface Point {
  x: number;
  y: number;
  z: number;
}

interface Box {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

/**
 * Generate all 6 possible orientations (permutations of dimensions).
 * Returns unique dimensions sets, with the original orientation first.
 */
function getUniqueOrientations(length: number, width: number, height: number): { length: number, width: number, height: number }[] {
  const permutations = [
    { length: length, width: width, height: height }, // Original
    { length: length, width: height, height: width },
    { length: width, width: length, height: height },
    { length: width, width: height, height: length },
    { length: height, width: length, height: width },
    { length: height, width: width, height: length },
  ];

  const unique: { length: number, width: number, height: number }[] = [];
  const seen = new Set<string>();

  for (const p of permutations) {
    const key = `${p.length}-${p.width}-${p.height}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }
  return unique;
}

/**
 * Checks if a proposed item placement is strictly inside the container dimensions.
 */
function isWithinBounds(
  x: number, 
  y: number, 
  z: number, 
  dim: { length: number, width: number, height: number }, 
  container: ContainerDimensions
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    z >= 0 &&
    (x + dim.length) <= container.length && 
    (y + dim.height) <= container.height &&
    (z + dim.width) <= container.width
  );
}

/**
 * Checks if two boxes overlap in 3D space.
 * Uses Axis-Aligned Bounding Box (AABB) collision detection.
 */
function intersect(box1: Box, box2: Box): boolean {
  return (
    box1.x < box2.x + box2.length &&
    box1.x + box1.length > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y &&
    box1.z < box2.z + box2.width &&
    box1.z + box1.width > box2.z
  );
}

/**
 * Advanced "Best Fit Decreasing" Packing Algorithm.
 * Features:
 * 1. Sorts items by Volume (Descending).
 * 2. Generates candidate points from corners of placed items.
 * 3. For each item, evaluates ALL candidate points and ALL rotations (Global Search).
 * 4. Selects the placement with the lowest weighted coordinate score (Y -> X -> Z).
 * 5. Actively fills gaps by checking internal candidate points.
 */
export const packCargo = (
  container: ContainerDimensions,
  items: CargoItem[]
): PlacedItem[] => {
  const placedItems: PlacedItem[] = [];

  // Running total of packed weight (kg) — items that would exceed
  // the container's maxWeight are never placed.
  let packedWeight = 0;
  
  // 1. Prepare Items: Flatten Quantities and Sort by Volume Descending
  const itemsToPack = items.flatMap((item) =>
    Array(item.quantity).fill(item).map((_, idx) => ({
      ...item,
      uniqueId: `${item.id}-${idx}`,
    }))
  ).sort((a, b) => {
    const volA = a.length * a.width * a.height;
    const volB = b.length * b.width * b.height;
    // Primary: Volume
    if (volB !== volA) return volB - volA;
    // Secondary: Max Dimension (Stickier items first)
    return Math.max(b.length, b.width, b.height) - Math.max(a.length, a.width, a.height);
  });

  // 2. Initialize Candidate Points with the Origin
  let candidatePoints: Point[] = [{ x: 0, y: 0, z: 0 }];

  // 3. Packing Loop
  for (const item of itemsToPack) {
    // Weight constraint: skip this unit if adding it overloads the vehicle.
    if (container.maxWeight > 0 && packedWeight + item.weight > container.maxWeight) {
      continue;
    }

    let bestScore = Infinity;
    let bestPoint: Point | null = null;
    let bestOrient: { length: number, width: number, height: number } | null = null;

    const possibleOrientations = getUniqueOrientations(item.length, item.width, item.height);

    // Global Search: Try every point with every orientation
    for (const point of candidatePoints) {
      for (const orient of possibleOrientations) {
        
        // A. Boundary Check
        if (!isWithinBounds(point.x, point.y, point.z, orient, container)) continue;

        // B. Overlap Check
        const candidateBox: Box = {
          x: point.x, y: point.y, z: point.z,
          length: orient.length, width: orient.width, height: orient.height
        };

        let hasOverlap = false;
        for (const placed of placedItems) {
          if (intersect(candidateBox, placed)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) continue;

        // C. Calculate Score (Lower is better)
        // Weight Priorities: 
        // 1. Y (Height) - Fill bottom up (Gravity stability)
        // 2. X (Length) - Fill back to front (Loading direction)
        // 3. Z (Width)  - Fill left to right
        // Large weights ensure strictly hierarchical sorting
        const score = (point.y * 100000000) + (point.x * 10000) + point.z;

        if (score < bestScore) {
          bestScore = score;
          bestPoint = point;
          bestOrient = orient;
        }
      }
    }

    // 4. If a valid placement was found
    if (bestPoint && bestOrient) {
      const newItem: PlacedItem = {
        id: item.uniqueId,
        cargoId: item.id,
        name: item.name,
        x: bestPoint.x,
        y: bestPoint.y,
        z: bestPoint.z,
        length: bestOrient.length,
        width: bestOrient.width,
        height: bestOrient.height,
        weight: item.weight, // Pass the weight through
        color: item.color,
      };

      placedItems.push(newItem);
      packedWeight += item.weight;

      // 5. Update Candidate Points
      // Add 3 new points projected from the new item's dimensions (Right, Top, Front)
      const newPoints: Point[] = [
        { x: bestPoint.x + bestOrient.length, y: bestPoint.y, z: bestPoint.z }, // Right side
        { x: bestPoint.x, y: bestPoint.y + bestOrient.height, z: bestPoint.z }, // Top side
        { x: bestPoint.x, y: bestPoint.y, z: bestPoint.z + bestOrient.width }   // Front side
      ];

      // Add valid new points to the list
      newPoints.forEach(p => {
         if (p.x <= container.length && p.y <= container.height && p.z <= container.width) {
             candidatePoints.push(p);
         }
      });

      // 6. Prune Candidate Points
      // Remove any points that are now strictly INSIDE any placed item (including the one just placed).
      // This keeps the list clean and effectively "removes" the used point.
      candidatePoints = candidatePoints.filter(p => {
        for (const placed of placedItems) {
          // Check if point is strictly inside the box
          // We allow points ON the edges/faces (>=), but reject if they are strictly inside (< max)
          // This logic ensures we don't start a new item from INSIDE another.
          if (p.x >= placed.x && p.x < placed.x + placed.length &&
              p.y >= placed.y && p.y < placed.y + placed.height &&
              p.z >= placed.z && p.z < placed.z + placed.width) {
            return false;
          }
        }
        return true;
      });

      // Simple deduplication of points to keep performance high
      const seenPoints = new Set<string>();
      candidatePoints = candidatePoints.filter(p => {
        const key = `${p.x}:${p.y}:${p.z}`;
        if (seenPoints.has(key)) return false;
        seenPoints.add(key);
        return true;
      });
    }
    // If no placement found, the item is skipped (not added to placedItems)
  }

  return placedItems;
};