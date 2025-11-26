---
name: procedural-graphics
description: Expert patterns for Canvas 2D/WebGL procedural graphics, noise functions, particle systems, and real-time rendering. Use when building animated backgrounds, generative art, contour visualizations, particle effects, or any canvas-based graphics that need performance optimization.
---

# Procedural Graphics

Patterns for performant, visually compelling procedural graphics on the web.

## Core Principles

1. **Frame budget first** — Design for 16.67ms (60fps). Profile early.
2. **Separate computation from rendering** — Enables Worker offloading.
3. **No allocations in hot paths** — Pre-allocate arrays, use TypedArrays.
4. **Progressive enhancement** — Canvas 2D first, WebGL when needed.

## Animation Loop

```javascript
class AnimationLoop {
  constructor(targetFPS = 60) {
    this.targetFrameTime = 1000 / targetFPS;
    this.lastTime = 0;
    this.accumulator = 0;
  }

  start(updateFn, renderFn) {
    const loop = (currentTime) => {
      const dt = currentTime - this.lastTime;
      this.lastTime = currentTime;
      this.accumulator += dt;
      
      while (this.accumulator >= this.targetFrameTime) {
        updateFn(this.targetFrameTime / 1000);
        this.accumulator -= this.targetFrameTime;
      }
      renderFn();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
```

## Simplex Noise with FBM

```javascript
import { createNoise2D } from 'simplex-noise';

function createFBM(seed) {
  const noise2D = createNoise2D(() => seed);
  
  return (x, y, { octaves = 4, frequency = 1, lacunarity = 2, persistence = 0.5 } = {}) => {
    let value = 0, freq = frequency, amp = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      value += noise2D(x * freq, y * freq) * amp;
      max += amp;
      freq *= lacunarity;
      amp *= persistence;
    }
    return value / max;
  };
}
```

## Domain Warping

For organic shapes, warp coordinates through noise before sampling:

```javascript
function domainWarp(x, y, time, fbm) {
  const warpX = fbm(x * 0.005, y * 0.005 + time * 0.1) * 40;
  const warpY = fbm(x * 0.005 + 5.2, y * 0.005 + time * 0.1) * 40;
  return fbm((x + warpX) * 0.008, (y + warpY) * 0.008);
}
```

## Marching Squares

See `references/marching-squares.md` for complete 16-case implementation.

Quick usage:
```javascript
const segments = marchingSquares(field, width, height, threshold, cellSize);
renderContours(ctx, segments); // Batch into single path
```

## Particle Pool (TypedArray)

```javascript
class ParticlePool {
  constructor(max) {
    // x, y, vx, vy, targetX, targetY, size, life
    this.pool = new Float32Array(max * 8);
    this.count = 0;
  }
  
  update(friction, spring) {
    for (let i = 0; i < this.count * 8; i += 8) {
      const dx = this.pool[i + 4] - this.pool[i];
      const dy = this.pool[i + 5] - this.pool[i + 1];
      this.pool[i + 2] = (this.pool[i + 2] + dx * spring) * friction;
      this.pool[i + 3] = (this.pool[i + 3] + dy * spring) * friction;
      this.pool[i] += this.pool[i + 2];
      this.pool[i + 1] += this.pool[i + 3];
    }
  }
  
  render(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < this.count * 8; i += 8) {
      ctx.moveTo(this.pool[i] + this.pool[i + 6], this.pool[i + 1]);
      ctx.arc(this.pool[i], this.pool[i + 1], this.pool[i + 6], 0, Math.PI * 2);
    }
    ctx.fill(); // Single draw call
  }
}
```

## Image to Particles

```javascript
async function extractParticles(src, step = 4) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise(r => { img.onload = r; img.src = src; });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const particles = [];
  
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 128) {
        particles.push({ x, y, color: `rgb(${data[i]},${data[i+1]},${data[i+2]})` });
      }
    }
  }
  return { particles, width: img.width, height: img.height };
}
```

## Responsive Canvas (DPI-aware)

```javascript
function setupCanvas(canvas, container) {
  const ctx = canvas.getContext('2d');
  const dpr = devicePixelRatio || 1;
  
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    return { width, height };
  }
  
  new ResizeObserver(() => resize()).observe(container);
  return { ctx, resize };
}
```

## Batched Rendering

```javascript
// ✅ CORRECT: Single draw call
function renderContours(ctx, segments, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  for (const [[x1, y1], [x2, y2]] of segments) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
}

// ❌ WRONG: N draw calls
segments.forEach(([p1, p2]) => {
  ctx.beginPath();
  ctx.moveTo(...p1);
  ctx.lineTo(...p2);
  ctx.stroke(); // Expensive!
});
```

## Device Tier Detection

```javascript
function getGraphicsTier() {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const lowMem = navigator.deviceMemory < 4;
  return (isMobile || lowMem) ? 'low' : 'high';
}

const config = {
  low: { particles: 300, gridSize: 60, octaves: 2 },
  high: { particles: 800, gridSize: 40, octaves: 4 },
}[getGraphicsTier()];
```

## Performance Checklist

- [ ] Batch draw calls (single beginPath → multiple ops → single stroke/fill)
- [ ] Use integer coords when possible
- [ ] Avoid save()/restore() in loops
- [ ] Pre-allocate TypedArrays
- [ ] Consider OffscreenCanvas for heavy computation
- [ ] Profile with Chrome DevTools Rendering panel

## CDN Links

```html
<script type="module">
  import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';
</script>
```
