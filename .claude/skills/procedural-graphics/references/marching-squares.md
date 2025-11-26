# Marching Squares Reference

Complete implementation for contour extraction from scalar fields.

## 16-Case Lookup Table

```javascript
const EDGE_TABLE = [
  [],                     // 0: all below
  [[3, 0]],               // 1
  [[0, 1]],               // 2
  [[3, 1]],               // 3
  [[1, 2]],               // 4
  [[3, 0], [1, 2]],       // 5: saddle
  [[0, 2]],               // 6
  [[3, 2]],               // 7
  [[2, 3]],               // 8
  [[2, 0]],               // 9
  [[0, 1], [2, 3]],       // 10: saddle
  [[2, 1]],               // 11
  [[1, 3]],               // 12
  [[1, 0]],               // 13
  [[0, 3]],               // 14
  [],                     // 15: all above
];
```

## Complete Implementation

```javascript
function marchingSquares(field, width, height, threshold, cellSize) {
  const segments = [];
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      
      // Sample corners
      const tl = field[row * cols + col];
      const tr = field[row * cols + col + 1];
      const br = field[(row + 1) * cols + col + 1];
      const bl = field[(row + 1) * cols + col];
      
      // Build case index
      const caseIndex = 
        (tl > threshold ? 8 : 0) |
        (tr > threshold ? 4 : 0) |
        (br > threshold ? 2 : 0) |
        (bl > threshold ? 1 : 0);
      
      for (const [e1, e2] of EDGE_TABLE[caseIndex]) {
        segments.push([
          getEdgePoint(e1, x, y, cellSize, tl, tr, br, bl, threshold),
          getEdgePoint(e2, x, y, cellSize, tl, tr, br, bl, threshold),
        ]);
      }
    }
  }
  return segments;
}

function getEdgePoint(edge, x, y, size, tl, tr, br, bl, threshold) {
  const invLerp = (a, b, v) => (v - a) / (b - a);
  switch (edge) {
    case 0: return [x + invLerp(tl, tr, threshold) * size, y];
    case 1: return [x + size, y + invLerp(tr, br, threshold) * size];
    case 2: return [x + invLerp(bl, br, threshold) * size, y + size];
    case 3: return [x, y + invLerp(tl, bl, threshold) * size];
  }
}
```

## Multi-Threshold Rendering

```javascript
function renderMultiContours(ctx, field, w, h, cellSize, thresholds, colors) {
  thresholds.forEach((t, i) => {
    const segments = marchingSquares(field, w, h, t, cellSize);
    ctx.beginPath();
    ctx.strokeStyle = colors[i];
    for (const [[x1, y1], [x2, y2]] of segments) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  });
}
```

## Noise Field Generation

```javascript
function generateNoiseField(width, height, cellSize, fbm, time) {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const field = new Float32Array(cols * rows);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      field[row * cols + col] = fbm(
        col * cellSize * 0.01 + time,
        row * cellSize * 0.01,
        { octaves: 3 }
      );
    }
  }
  return field;
}
```
