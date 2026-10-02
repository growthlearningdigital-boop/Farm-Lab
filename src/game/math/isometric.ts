import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../constants';

export interface Point2D {
  x: number;
  y: number;
}

export interface GridCoord {
  gx: number;
  gy: number;
}

/**
 * Convert isometric grid (gx, gy) to 2D screen coordinates
 */
export function gridToScreen(
  gx: number,
  gy: number,
  originX: number,
  originY: number,
  tileW: number = ISO_TILE_WIDTH,
  tileH: number = ISO_TILE_HEIGHT
): Point2D {
  const x = originX + (gx - gy) * (tileW / 2);
  const y = originY + (gx + gy) * (tileH / 2);
  return { x, y };
}

/**
 * Convert 2D screen coordinates to grid coordinates (gx, gy)
 */
export function screenToGrid(
  sx: number,
  sy: number,
  originX: number,
  originY: number,
  gridSize: number,
  tileW: number = ISO_TILE_WIDTH,
  tileH: number = ISO_TILE_HEIGHT
): GridCoord | null {
  const dx = sx - originX;
  const dy = sy - originY;

  // Exact inverse transformation for 2:1 isometric projection
  const halfW = tileW / 2;
  const halfH = tileH / 2;

  const rawGx = (dx / halfW + dy / halfH) / 2;
  const rawGy = (dy / halfH - dx / halfW) / 2;

  const gx = Math.floor(rawGx + 0.5);
  const gy = Math.floor(rawGy + 0.5);

  if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
    // Check if within rhombus boundary (Manhattan distance in normalized diamond space <= 1)
    const fracX = Math.abs(rawGx - gx);
    const fracY = Math.abs(rawGy - gy);
    if (fracX + fracY <= 1.0) {
      return { gx, gy };
    }
  }

  return null;
}

/**
 * Check if two grid cells are neighbors (adjacent orthogonal or diagonal)
 */
export function areNeighbors(c1: GridCoord, c2: GridCoord, allowDiagonal = true): boolean {
  const dx = Math.abs(c1.gx - c2.gx);
  const dy = Math.abs(c1.gy - c2.gy);

  if (allowDiagonal) {
    return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);
  }
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}
