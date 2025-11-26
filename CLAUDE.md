# CLAUDE.md

This file provides guidance to Claude Code when working with the Onebrief Ambient Motion Prototype.

## Project Overview

This is a **vanilla JavaScript prototype** for an ambient header animation combining:
1. Procedurally generated topographic contours (background layer)
2. Interactive particle-based logo assembly (foreground layer)

**Tech Stack:**
- Canvas 2D API (no framework)
- ES Modules
- simplex-noise library via CDN
- Custom implementations (marching squares, spring physics)

**Constraints:**
- No build system (direct ES module imports)
- Lightweight (~10-12kb total bundle)
- Battery-friendly (60fps target, <5% CPU)
- Accessibility-first (prefers-reduced-motion support)

## Specialized Agents & Skills

This project has two specialized agents available for domain-specific assistance, each equipped with expert skill modules:

### graphics-engineer
Use this agent for:
- Canvas rendering pipeline optimization
- Procedural generation algorithms (noise, contours, marching squares)
- Performance profiling and GPU acceleration
- Visual effects implementation
- WebGL migration strategies

**Equipped with skills:**
- `procedural-graphics` (`.claude/skills/procedural-graphics/SKILL.md`)

**Example prompts:**
- "Optimize my marching squares implementation for better performance"
- "Help me reduce CPU usage in the contour rendering loop"
- "Review my particle rendering code for potential bottlenecks"

### motion-engineer
Use this agent for:
- Spring physics tuning (stiffness, damping, mass parameters)
- Gesture and mouse interaction implementation
- Animation accessibility (prefers-reduced-motion, WCAG compliance)
- Easing function selection and timing
- Motion design and choreography

**Equipped with skills:**
- `motion-physics` (`.claude/skills/motion-physics/SKILL.md`)

**Example prompts:**
- "Help me tune the spring constants for more organic particle motion"
- "Implement smooth momentum for the mouse repulsion effect"
- "Audit my animations for accessibility compliance"

## Available Skills

Skills are reusable knowledge modules that provide expert patterns and implementations:

### procedural-graphics
**Location:** `.claude/skills/procedural-graphics/SKILL.md`

**Provides:**
- **Animation Loop** — Fixed timestep update with frame budget management
- **Simplex Noise with FBM** — Fractal Brownian Motion for organic terrain patterns
- **Domain Warping** — Coordinate warping through noise for natural shapes
- **Marching Squares** — Complete 16-case contour extraction (see `references/marching-squares.md`)
- **Particle Pool** — TypedArray-based particle system for zero-allocation updates
- **Image to Particles** — Extract particle positions from logo/image alpha channel
- **Responsive Canvas** — DPI-aware canvas setup for retina displays
- **Batched Rendering** — Single draw call patterns for performance
- **Device Tier Detection** — Adaptive settings for mobile/desktop

**Key Code Patterns:**
```javascript
// Animation loop with fixed timestep
class AnimationLoop { ... }

// FBM noise generation
function createFBM(seed) { ... }

// Marching squares contour extraction
function marchingSquares(field, width, height, threshold, cellSize) { ... }

// TypedArray particle pool
class ParticlePool { ... }
```

### motion-physics
**Location:** `.claude/skills/motion-physics/SKILL.md`

**Provides:**
- **Spring Physics Core** — Complete spring implementation with stiffness, damping, mass
- **Spring Presets** — Pre-tuned settings (snappy, gentle, bouncy, heavy, wobbly, stiff)
- **2D Particle with Spring** — Simplified spring physics for particles
- **Mouse Repulsion** — Quadratic falloff force field
- **Mouse Attraction** — Inverse distance attraction
- **Mouse Tracking** — Event listener utility class
- **Staggered Animation** — Random, index-based, and radial stagger patterns
- **Reduced Motion** — Complete `prefers-reduced-motion` implementation
- **Accessible Pause Button** — WCAG-compliant pause control
- **Easing Functions** — Common easing curves and lerp utilities

**Key Code Patterns:**
```javascript
// Spring physics
class Spring {
  constructor({ stiffness = 100, damping = 10, mass = 1 }) { ... }
  update(dt) { ... }
}

// Particle with spring
class Particle2D { ... }

// Mouse interaction
function applyRepulsion(particle, mouseX, mouseY, { radius, strength }) { ... }

// Motion accessibility
class MotionController {
  get shouldAnimate() { return !this.reduced && !this.paused; }
}
```

**Spring Preset Reference:**
| Feel | Stiffness | Damping | Mass | Use Case |
|------|-----------|---------|------|----------|
| Snappy | 300 | 30 | 1 | Buttons, toggles |
| Gentle | 120 | 14 | 1 | Modals, cards |
| Bouncy | 180 | 12 | 1 | Notifications |
| Heavy | 80 | 20 | 2 | Page transitions |
| Wobbly | 150 | 8 | 1 | Playful UI |
| Stiff | 400 | 40 | 1 | Precise, no bounce |

## Development Commands

```bash
# Local development server
npx serve .
# or
python -m http.server 8000

# No build step required - runs directly in browser
```

## Project Structure

```
onebrief-ambient/
├── index.html              # Demo page with controls
├── src/
│   ├── ambient.js          # Main orchestrator (imports all systems)
│   ├── contours.js         # Marching squares + simplex noise
│   ├── particles.js        # Logo particle system
│   ├── spring.js           # Physics utilities
│   ├── noise.js            # Simplex noise wrapper
│   └── theme.js            # Color/theming
├── styles/
│   └── ambient.css         # CSS custom properties + accessibility
├── assets/
│   ├── onebrief-logo.png   # Logo source for particle extraction
│   └── preview.gif
├── .claude/
│   └── agents/
│       ├── graphics-engineer.md
│       └── motion-engineer.md
├── Plan.md                 # Technical architecture document
├── CLAUDE.md               # This file
└── README.md
```

## Architecture Patterns

### Module System

All code uses **ES Modules** loaded via `<script type="module">`:

```javascript
// src/ambient.js (main entry point)
import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';
import { generateContours } from './contours.js';
import { ParticleSystem } from './particles.js';
import { springStep } from './spring.js';

export function createAmbientHeader(canvas, options) {
  // Orchestrates all systems
}
```

**Important:** No bundler, no transpilation. Code must run directly in modern browsers (ES2020+).

### Canvas Rendering Loop

```javascript
let animationId;
let lastTime = 0;

function animate(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Update systems
  updateContours(deltaTime);
  updateParticles(deltaTime);

  // Render layers
  renderContours(ctx);
  renderParticles(ctx);

  animationId = requestAnimationFrame(animate);
}
```

### Performance Optimization

**Device Detection:**
```javascript
function getPerformanceTier() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  return (isMobile || lowMemory || lowCPU) ? 'low' : 'high';
}
```

**Particle Count Scaling:**
- Desktop (high): 800-1000 particles, 35px grid
- Desktop (average): 500-700 particles, 40px grid
- Tablet: 300-500 particles, 50px grid
- Mobile: 200-300 particles, 60px grid

## Core Systems

### 1. Contour Flow Background (`contours.js`)

**Purpose:** Generate drifting topographic lines using simplex noise + marching squares

**Key Functions:**
- `generateNoiseField(width, height, time, octaves)` — Creates scalar field
- `marchingSquares(field, threshold, cellSize)` — Extracts contour lines
- `renderContours(ctx, contours, color, opacity)` — Draws to canvas

**Configuration:**
```javascript
const CONTOUR_CONFIG = {
  gridSize: 40,           // Cell size (lower = more detail, higher CPU)
  octaves: 3,             // Noise complexity
  baseFrequency: 0.008,   // Feature size
  timeSpeed: 0.0003,      // Animation speed
  thresholds: [-0.5, -0.2, 0.1, 0.4, 0.7],
  strokeOpacity: 0.12
};
```

**Performance Note:** Marching squares runs every frame. Consider caching contours if FPS drops below 30. **Use graphics-engineer agent for optimization.**

### 2. Logo Particle System (`particles.js`)

**Purpose:** Assemble logo from scattered particles with spring physics

**Particle Class:**
```javascript
class Particle {
  constructor(targetX, targetY, color) {
    this.x = Math.random() * canvasWidth;   // Random start
    this.y = Math.random() * canvasHeight;
    this.vx = 0;
    this.vy = 0;
    this.targetX = targetX;  // Logo position
    this.targetY = targetY;
    this.color = color;
    this.size = 2 + Math.random() * 2;
    this.friction = 0.92 + Math.random() * 0.05;
    this.springStrength = 0.02;
  }
}
```

**Key Functions:**
- `extractLogoParticles(image, sampleStep)` — Extract positions from logo PNG
- `initParticles(targets)` — Create particle instances
- `updateParticles(deltaTime, mouseX, mouseY)` — Physics + interaction
- `renderParticles(ctx, particles)` — Draw to canvas

**Logo Extraction:**
Uses `canvas.getImageData()` to sample logo image and create particle positions from pixels with alpha > 128.

### 3. Mouse Interaction

**Repulsion Algorithm:**
```javascript
function applyMouseForce(particle, mouseX, mouseY, radius = 100, strength = 5) {
  const dx = particle.x - mouseX;
  const dy = particle.y - mouseY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < radius && distance > 0) {
    const force = (1 - distance / radius) * strength;  // Inverse square falloff
    const angle = Math.atan2(dy, dx);

    particle.vx += Math.cos(angle) * force;
    particle.vy += Math.sin(angle) * force;
  }
}
```

**Mouse Tracking:**
```javascript
let mouse = { x: null, y: null };

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = null;
  mouse.y = null;
});
```

**Use motion-engineer agent for tuning interaction feel and responsiveness.**

### 4. Spring Physics (`spring.js`)

**Core Algorithm (Hooke's Law):**
```javascript
function springStep(particle, dt = 1/60) {
  // Calculate displacement from target
  const dx = particle.targetX - particle.x;
  const dy = particle.targetY - particle.y;

  // Apply spring force (F = -k * displacement)
  const ax = dx * particle.springStrength;
  const ay = dy * particle.springStrength;

  // Update velocity
  particle.vx += ax;
  particle.vy += ay;

  // Apply friction/damping
  particle.vx *= particle.friction;
  particle.vy *= particle.friction;

  // Update position
  particle.x += particle.vx;
  particle.y += particle.vy;
}
```

**Use motion-engineer agent for tuning spring parameters (stiffness, damping, mass).**

## Theming System

### CSS Custom Properties

```css
:root {
  --ambient-bg: #ffffff;
  --ambient-bg-dark: #0a0f1a;
  --contour-stroke: rgba(0, 40, 80, 0.10);
  --contour-stroke-dark: rgba(100, 160, 220, 0.12);
  --particle-color: #3B9DFF;
  --particle-color-dark: #5BB5FF;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ambient-bg: var(--ambient-bg-dark);
    --contour-stroke: var(--contour-stroke-dark);
    --particle-color: var(--particle-color-dark);
  }
}
```

### Reading Theme Colors in JavaScript

```javascript
function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    bg: styles.getPropertyValue('--ambient-bg').trim(),
    contourStroke: styles.getPropertyValue('--contour-stroke').trim(),
    particleColor: styles.getPropertyValue('--particle-color').trim(),
  };
}

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColors);
```

## Accessibility Implementation

### Reduced Motion Support

```javascript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initAccessibility() {
  if (reducedMotion.matches) {
    renderStaticLogo();
    renderStaticContours();
  } else {
    startAnimation();
  }

  reducedMotion.addEventListener('change', handleMotionPreference);
}

function handleMotionPreference(e) {
  if (e.matches) {
    stopAnimation();
    renderStaticState();
  } else {
    startAnimation();
  }
}
```

**Use motion-engineer agent for accessibility audits and WCAG compliance.**

### Requirements Checklist

- Canvas must have `aria-hidden="true"` (decorative only)
- Pause/play button must be keyboard accessible
- No flashing content (well under 3 flashes/second)
- Static fallback when reduced motion enabled
- Manual pause control (WCAG SC 2.2.2)

## Common Issues & Solutions

### Issue: Blurry Canvas on Retina Displays

**Solution:** Account for `devicePixelRatio`

```javascript
function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}
```

**Consult graphics-engineer agent for rendering quality issues.**

### Issue: Poor Performance on Mobile

**Solutions:**
- Reduce particle count (200-300 max)
- Increase contour grid size (60px cells)
- Disable mouse interaction on touch devices
- Cap frame rate at 30fps if needed

```javascript
const isTouchDevice = 'ontouchstart' in window;
if (isTouchDevice) {
  config.particleCount = 250;
  config.gridSize = 60;
  config.enableMouseInteraction = false;
}
```

**Consult graphics-engineer agent for performance optimization strategies.**

### Issue: Particles Don't Return to Logo Shape

**Cause:** Spring strength too low or friction too high

**Solution:** Tune physics parameters
```javascript
particle.springStrength = 0.02;  // Increase for stronger pull
particle.friction = 0.92;        // Decrease for less damping
```

**Consult motion-engineer agent for spring physics tuning.**

### Issue: Contours Look Too Jagged

**Cause:** Grid size too large or missing interpolation

**Solutions:**
- Reduce `gridSize` (e.g., 40px → 35px)
- Verify linear interpolation in marching squares edge calculation
- Add anti-aliasing: `ctx.imageSmoothingEnabled = true;`

**Consult graphics-engineer agent for contour quality improvements.**

## Development Guidelines

### When Adding New Features

1. **Check Performance Impact**
   - Monitor FPS in Chrome DevTools Performance tab
   - Test on low-end device (or throttle CPU 4x)
   - Ensure <5% CPU usage when idle
   - **Use graphics-engineer agent for performance analysis**

2. **Maintain Accessibility**
   - Ensure new animations respect `prefers-reduced-motion`
   - Keep pause/play control functional
   - Don't introduce flashing content
   - **Use motion-engineer agent for accessibility audits**

3. **Follow Module Pattern**
   - Export pure functions where possible
   - Avoid global state
   - Use ES Modules (no CommonJS)

4. **Test Theming**
   - Verify light/dark mode appearance
   - Use CSS custom properties for colors
   - Test manual theme switching

### When to Use Specialized Agents

**Use graphics-engineer when:**
- Implementing or optimizing rendering code
- Working with Canvas 2D drawing operations
- Debugging visual artifacts or performance issues
- Planning algorithm implementations (marching squares, noise, etc.)
- Considering GPU acceleration or WebGL migration

**Use motion-engineer when:**
- Tuning animation parameters (springs, easing, timing)
- Implementing gesture or mouse interactions
- Ensuring accessibility compliance for animations
- Creating choreographed motion sequences
- Debugging animation "feel" issues

### When Debugging

**Performance Issues:**
```javascript
// Add FPS counter
let frameCount = 0;
let lastFpsTime = performance.now();

function updateFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastFpsTime = now;
  }
}
```

**Physics Issues:**
```javascript
// Visualize spring forces
ctx.strokeStyle = 'red';
ctx.beginPath();
ctx.moveTo(particle.x, particle.y);
ctx.lineTo(particle.targetX, particle.targetY);
ctx.stroke();
```

**Contour Generation:**
```javascript
// Log noise field values
console.table(noiseField.slice(0, 100));  // First 100 values
```

## Deployment

### Production Checklist

- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify mobile performance (real device testing)
- [ ] Test reduced motion on macOS/Windows
- [ ] Check retina display rendering
- [ ] Validate accessibility (keyboard navigation, pause control)
- [ ] Measure bundle size (Network tab)
- [ ] Capture screenshots/GIF for documentation
- [ ] Deploy to static hosting (Vercel, Netlify, GitHub Pages)

### Hosting Options

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod
```

**GitHub Pages:**
```bash
# Push to gh-pages branch
git subtree push --prefix . origin gh-pages
```

## References

### Key Documentation

- [simplex-noise npm](https://www.npmjs.com/package/simplex-noise)
- [Canvas 2D API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Marching Squares Algorithm](https://en.wikipedia.org/wiki/Marching_squares)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### Helpful Tutorials

- [Red Blob Games: Terrain from Noise](https://www.redblobgames.com/maps/terrain-from-noise/)
- [Josh Comeau: Spring Physics](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)
- [Interactive Marching Squares](https://skadewdl3.vercel.app/blog/1-marching-squares)

---

*This file should be updated as the prototype evolves. Keep it concise and actionable.*

### Commit message Guidelines

- No attribution to claude or anthropic. No emojis, and keeop things formal but not verbose. Always straightforward commit messages. 