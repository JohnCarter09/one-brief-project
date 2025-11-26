/**
 * Marching Squares edge table
 * Defines which edges to connect for each of the 16 cases
 */
const EDGE_TABLE = [
  [],                     // 0: all below threshold
  [[3, 0]],               // 1: bottom-left corner
  [[0, 1]],               // 2: top-left corner
  [[3, 1]],               // 3: left edge
  [[1, 2]],               // 4: top-right corner
  [[3, 0], [1, 2]],       // 5: saddle (ambiguous)
  [[0, 2]],               // 6: top edge
  [[3, 2]],               // 7: all but bottom-right
  [[2, 3]],               // 8: bottom-right corner
  [[2, 0]],               // 9: bottom edge
  [[0, 1], [2, 3]],       // 10: saddle (ambiguous)
  [[2, 1]],               // 11: all but top-left
  [[1, 3]],               // 12: right edge
  [[1, 0]],               // 13: all but top-right
  [[0, 3]],               // 14: all but bottom-left
  [],                     // 15: all above threshold
];

/**
 * Linear interpolation helper
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Inverse linear interpolation
 */
function invLerp(a, b, v) {
  return (v - a) / (b - a);
}

/**
 * Get edge point with linear interpolation
 * @param {number} edge - Edge index (0=top, 1=right, 2=bottom, 3=left)
 * @param {number} x - Cell x position
 * @param {number} y - Cell y position
 * @param {number} size - Cell size
 * @param {number} tl - Top-left value
 * @param {number} tr - Top-right value
 * @param {number} br - Bottom-right value
 * @param {number} bl - Bottom-left value
 * @param {number} threshold - Contour threshold
 * @returns {Array} [x, y] coordinates
 */
function getEdgePoint(edge, x, y, size, tl, tr, br, bl, threshold) {
  switch (edge) {
    case 0: // Top edge
      return [x + invLerp(tl, tr, threshold) * size, y];
    case 1: // Right edge
      return [x + size, y + invLerp(tr, br, threshold) * size];
    case 2: // Bottom edge
      return [x + invLerp(bl, br, threshold) * size, y + size];
    case 3: // Left edge
      return [x, y + invLerp(tl, bl, threshold) * size];
    default:
      return [x, y];
  }
}

/**
 * Marching Squares contour extraction
 * @param {Float32Array} field - Scalar field values
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {number} threshold - Contour threshold value
 * @param {number} cellSize - Size of each cell in pixels
 * @returns {Array} Array of line segments [[x1, y1], [x2, y2]]
 */
export function marchingSquares(field, cols, rows, threshold, cellSize) {
  const segments = [];

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const x = col * cellSize;
      const y = row * cellSize;

      // Sample corner values
      const tl = field[row * cols + col];
      const tr = field[row * cols + col + 1];
      const br = field[(row + 1) * cols + col + 1];
      const bl = field[(row + 1) * cols + col];

      // Build case index (0-15)
      const caseIndex =
        (tl > threshold ? 8 : 0) |
        (tr > threshold ? 4 : 0) |
        (br > threshold ? 2 : 0) |
        (bl > threshold ? 1 : 0);

      // Extract segments for this cell
      const edges = EDGE_TABLE[caseIndex];
      for (const [e1, e2] of edges) {
        segments.push([
          getEdgePoint(e1, x, y, cellSize, tl, tr, br, bl, threshold),
          getEdgePoint(e2, x, y, cellSize, tl, tr, br, bl, threshold),
        ]);
      }
    }
  }

  return segments;
}

/**
 * Render contour segments to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} segments - Array of line segments
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Stroke width
 */
export function renderContours(ctx, segments, color, lineWidth = 1) {
  if (segments.length === 0) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const [[x1, y1], [x2, y2]] of segments) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }

  ctx.stroke();
}

/**
 * Render multiple contour levels
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Float32Array} field - Scalar field
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {number} cellSize - Cell size
 * @param {Array} thresholds - Array of threshold values
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Stroke width
 */
export function renderMultiContours(ctx, field, cols, rows, cellSize, thresholds, color, lineWidth = 1) {
  for (const threshold of thresholds) {
    const segments = marchingSquares(field, cols, rows, threshold, cellSize);
    renderContours(ctx, segments, color, lineWidth);
  }
}
