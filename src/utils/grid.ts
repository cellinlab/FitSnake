export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
}

export function calculateOptimalGrid(
  containerWidth: number,
  containerHeight: number,
  minCellSize: number = 20,
  maxCellSize: number = 40
): GridConfig {
  // 计算最佳网格尺寸
  let cellSize = Math.min(
    Math.floor(containerWidth / 20), // 最少20列
    Math.floor(containerHeight / 15), // 最少15行
    maxCellSize
  );
  
  cellSize = Math.max(cellSize, minCellSize);
  
  const width = Math.floor(containerWidth / cellSize);
  const height = Math.floor(containerHeight / cellSize);
  
  return {
    width,
    height,
    cellSize
  };
}

export function isValidPosition(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
}

export function getRandomPosition(
  gridWidth: number,
  gridHeight: number,
  excludePositions: Array<{ x: number; y: number }> = []
): { x: number; y: number } {
  let position: { x: number; y: number };
  let attempts = 0;
  const maxAttempts = gridWidth * gridHeight;
  
  do {
    position = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight)
    };
    attempts++;
  } while (
    attempts < maxAttempts &&
    excludePositions.some(pos => pos.x === position.x && pos.y === position.y)
  );
  
  return position;
}

export function calculateDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}