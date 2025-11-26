# Technical Plan: Onebrief Ambient Motion Prototype v2

> **Assignment:** Onebrief Design Engineer Candidate — Ambient Motion Prototype  
> **Timebox:** 2 hours (with optional extensions)  
> **Author:** John Carter  
> **Date:** November 2025  
> **Version:** 2.0 — Now includes logo particle integration + interactive components

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Visual Concept](#visual-concept)
3. [Brand Alignment](#brand-alignment)
4. [Technical Architecture](#technical-architecture)
5. [Core Systems](#core-systems)
   - [System 1: Contour Flow Background](#system-1-contour-flow-background)
   - [System 2: Logo Particle Assembly](#system-2-logo-particle-assembly)
   - [System 3: Mouse Interaction](#system-3-mouse-interaction)
6. [Algorithm Deep-Dives](#algorithm-deep-dives)
7. [Documentation Links](#documentation-links)
8. [File Structure](#file-structure)
9. [Implementation Phases](#implementation-phases)
10. [Performance Considerations](#performance-considerations)
11. [Color Tokens & Theming](#color-tokens--theming)
12. [Accessibility](#accessibility)
13. [AI Usage Plan](#ai-usage-plan)
14. [Future Productionization](#future-productionization)

---

## Executive Summary

This prototype combines **two visual systems** into a cohesive ambient header experience:

1. **Background Layer:** Slowly drifting topographic contour lines generated from animated simplex noise
2. **Foreground Layer:** The Onebrief logo constructed from particles that assemble on page load and respond to mouse interaction

The result is a modern, interactive header that feels alive without being distracting—"lava lamp energy" expressed through strategic motion and subtle interactivity.

---

## Visual Concept

### The Effect

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   ╭─────╮     ╭───────────╮      [Background: Contour Flow]    │
│  ╭╯     ╰─────╯           ╰╮                                   │
│ ╭╯                         ╰╮    ← Slow, ambient drift         │
│ │     ┌──────────────┐      │                                  │
│ │     │  ▓▓▓▓  ▓▓▓▓  │      │    [Foreground: Logo Particles]  │
│ │     │  ▓▓▓▓▓▓▓▓▓▓  │      │                                  │
│ │     │    ▓▓▓▓▓▓    │      │    ← Interactive, mouse-reactive │
│ │     └──────────────┘      │                                  │
│  ╰╮                        ╭╯                                  │
│   ╰────────╮      ╭────────╯                                   │
│            ╰──────╯                                            │
│                                                                │
│   [Navigation Bar]                              [Menu Items]   │
└────────────────────────────────────────────────────────────────┘
```

### Motion Character

| Layer | Motion Type | Speed | Interactivity |
|-------|-------------|-------|---------------|
| Contour Background | Continuous drift | Very slow (~0.0003/frame) | None (ambient) |
| Logo Particles | Assembly → Idle breathing | 2-3s assembly, subtle pulse | Mouse repulsion/attraction |

### User Experience Flow

```
[Page Load]
    │
    ▼
[Particles scattered randomly across header]
    │
    ▼ (2-3 seconds)
[Particles flow toward target positions]
    │
    ▼
[Logo materializes as particles settle]
    │
    ▼
[Background contours begin drifting]
    │
    ▼
[User hovers near logo]
    │
    ▼
[Particles gently repel from cursor]
    │
    ▼
[Cursor moves away → particles spring back]
```

---

## Brand Alignment

### Why This Approach for Onebrief?

| Brand Attribute | Visual Expression |
|-----------------|-------------------|
| **Maps & GIS** | Topographic contour lines — the language of terrain mapping |
| **Real-time Collaboration** | Particles forming a unified logo — many units, one mission |
| **Speed & Precision** | Snappy spring physics on particle assembly |
| **Modern Tech** | Procedural generation, physics-based animation |
| **"Superhuman Staffs"** | Logo emerging from chaos → order (planning workflow metaphor) |

### Logo Analysis

The Onebrief logo is a **3D geometric mark** featuring:
- Two angular shapes (top-left, bottom-right quadrants)
- A diagonal cut/gap through the middle
- Isometric depth effect
- Primary color: `~#019EFF` (bright blue)

**Why particles work:** The angular, grid-friendly geometry maps naturally to a square/dot-based particle system.

---

## Technical Architecture

### Stack Decision

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Rendering** | Canvas 2D | Lightweight, battery-friendly, sufficient for 500-1000 particles |
| **Noise** | simplex-noise (npm) | ~2kb, fast, well-maintained |
| **Contours** | Custom marching squares | Avoid d3-contour overhead (~15kb) |
| **Physics** | Custom spring system | Simple, no dependencies |
| **Theming** | CSS custom properties | Native, no runtime cost |
| **Build** | None (ES Modules) | Direct `<script type="module">` embedding |

### Final Stack

```
├── HTML (single file, embeddable)
├── CSS (custom properties + prefers-* queries)
├── JavaScript (ES Modules)
│   ├── simplex-noise (~2kb via CDN)
│   ├── contours.js (custom marching squares ~100 lines)
│   ├── particles.js (logo particle system ~200 lines)
│   ├── spring.js (physics utilities ~50 lines)
│   └── ambient.js (main orchestrator ~150 lines)
└── Canvas 2D API
```

### Estimated Bundle Size

| Component | Size (minified) |
|-----------|-----------------|
| simplex-noise | ~2kb |
| Custom code | ~8-10kb |
| **Total** | **~10-12kb** |

---

## Core Systems

### System 1: Contour Flow Background

#### Concept
Generate a 2D scalar field using layered simplex noise, extract contour lines via marching squares, and animate by slowly shifting the noise sample coordinates over time.

#### Data Flow

```
[Time] → [Noise Field Generation] → [Marching Squares] → [Canvas Rendering]
           ↓                              ↓                      ↓
    2D array of floats         Array of line segments      ctx.lineTo() calls
```

#### Key Parameters

```javascript
const CONTOUR_CONFIG = {
  gridSize: 40,           // Pixels per cell (lower = more detail, higher CPU)
  octaves: 3,             // Noise layers
  baseFrequency: 0.008,   // Feature size
  timeSpeed: 0.0003,      // Animation speed
  thresholds: [-0.5, -0.2, 0.1, 0.4, 0.7],  // Contour levels
  strokeOpacity: 0.12,    // Subtle visibility
};
```

---

### System 2: Logo Particle Assembly

#### Concept
1. Load logo image (or use pre-defined bitmap mask)
2. Sample pixels to determine which grid positions are "on"
3. Create particles with random initial positions
4. Animate particles toward their target (logo) positions using spring physics
5. Once assembled, add subtle "breathing" motion

#### Particle Data Structure

```javascript
class Particle {
  constructor(targetX, targetY, color) {
    // Current state
    this.x = Math.random() * canvasWidth;   // Random start position
    this.y = Math.random() * canvasHeight;
    this.vx = 0;                            // Velocity
    this.vy = 0;
    
    // Target state (logo position)
    this.targetX = targetX;
    this.targetY = targetY;
    
    // Visual properties
    this.color = color;
    this.size = 2 + Math.random() * 2;
    
    // Physics parameters
    this.friction = 0.92 + Math.random() * 0.05;
    this.springStrength = 0.02;
  }
}
```

#### Logo Bitmap Extraction

```javascript
function extractLogoParticles(image, sampleStep = 4) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const particles = [];
  
  for (let y = 0; y < canvas.height; y += sampleStep) {
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const i = (y * canvas.width + x) * 4;
      const alpha = imageData.data[i + 3];
      
      if (alpha > 128) {  // Pixel is part of logo
        particles.push({
          targetX: x,
          targetY: y,
          color: `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, 1)`
        });
      }
    }
  }
  
  return particles;
}
```

---

### System 3: Mouse Interaction

#### Concept
Track mouse position relative to canvas. When cursor is near particles, apply a repulsion force inversely proportional to distance. When cursor moves away, spring physics pull particles back to their targets.

#### Interaction Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Repulse** | Particles flee from cursor | Default hover effect |
| **Attract** | Particles drawn toward cursor | Alternative style |
| **Ripple** | Radial wave disturbance | On click |

#### Mouse Repulsion Algorithm

```javascript
function applyMouseForce(particle, mouseX, mouseY, radius = 100, strength = 5) {
  const dx = particle.x - mouseX;
  const dy = particle.y - mouseY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < radius && distance > 0) {
    // Force falls off with distance squared
    const force = (1 - distance / radius) * strength;
    const angle = Math.atan2(dy, dx);
    
    particle.vx += Math.cos(angle) * force;
    particle.vy += Math.sin(angle) * force;
  }
}
```

#### Mouse Tracking Setup

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

---

## Algorithm Deep-Dives

### Simplex Noise with Octaves

Layering multiple noise samples at different frequencies creates natural-looking terrain:

```javascript
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

function generateField(width, height, time) {
  const field = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = 0.008;
      
      // Sum multiple octaves
      for (let octave = 0; octave < 3; octave++) {
        value += noise2D(
          (x * frequency) + time,
          (y * frequency)
        ) * amplitude;
        
        amplitude *= 0.5;     // Each octave is half as strong
        frequency *= 2;       // Each octave is twice as detailed
      }
      
      field[x + y * width] = value;
    }
  }
  
  return field;
}
```

### Marching Squares (16 Cases)

```javascript
// Lookup table: which edges to connect for each case
const EDGE_TABLE = [
  [],           // 0: no edges
  [[3, 0]],     // 1: bottom-left corner
  [[0, 1]],     // 2: top-left corner
  [[3, 1]],     // 3: left edge
  [[1, 2]],     // 4: top-right corner
  [[3, 0], [1, 2]],  // 5: saddle (ambiguous)
  [[0, 2]],     // 6: top edge
  [[3, 2]],     // 7: all but bottom-right
  [[2, 3]],     // 8: bottom-right corner
  [[2, 0]],     // 9: bottom edge
  [[0, 1], [2, 3]],  // 10: saddle (ambiguous)
  [[2, 1]],     // 11: all but top-left
  [[1, 3]],     // 12: right edge
  [[1, 0]],     // 13: all but top-right
  [[0, 3]],     // 14: all but bottom-left
  [],           // 15: all corners above threshold
];

// Edge positions (0=top, 1=right, 2=bottom, 3=left)
function getEdgePoint(edge, x, y, cellSize, tl, tr, br, bl, threshold) {
  // Linear interpolation along edge
  switch (edge) {
    case 0: return [x + lerp(tl, tr, threshold) * cellSize, y];
    case 1: return [x + cellSize, y + lerp(tr, br, threshold) * cellSize];
    case 2: return [x + lerp(bl, br, threshold) * cellSize, y + cellSize];
    case 3: return [x, y + lerp(tl, bl, threshold) * cellSize];
  }
}

function lerp(a, b, threshold) {
  return (threshold - a) / (b - a);
}
```

### Spring Physics

Simple spring simulation for particle movement:

```javascript
function springStep(particle, dt = 1/60) {
  // Spring force toward target
  const dx = particle.targetX - particle.x;
  const dy = particle.targetY - particle.y;
  
  // F = -k * displacement (Hooke's law)
  const ax = dx * particle.springStrength;
  const ay = dy * particle.springStrength;
  
  // Apply acceleration to velocity
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

---

## Documentation Links

### Noise Generation

| Resource | URL | Notes |
|----------|-----|-------|
| **simplex-noise npm** | https://www.npmjs.com/package/simplex-noise | ~2kb, dependency-free, 20ns/sample |
| **simplex-noise GitHub** | https://github.com/jwagner/simplex-noise.js | TypeScript support, seeding |
| **Red Blob Games: Terrain from Noise** | https://www.redblobgames.com/maps/terrain-from-noise/ | Excellent octave/frequency guide |

### Marching Squares Algorithm

| Resource | URL | Notes |
|----------|-----|-------|
| **Wikipedia** | https://en.wikipedia.org/wiki/Marching_squares | Theory, 16-case table |
| **Interactive Primer** | https://skadewdl3.vercel.app/blog/1-marching-squares | Visual walkthrough with p5.js |
| **Metaballs Tutorial** | https://jurasic.dev/marching_squares/ | JS implementation with interpolation |
| **MarchingSquares.js** | https://github.com/RaumZeit/MarchingSquares.js | Full library with QuadTree |
| **d3-contour npm** | https://www.npmjs.com/package/d3-contour | Alternative pre-built solution |
| **d3-contour GitHub** | https://github.com/d3/d3-contour | API reference |

### Particle Systems

| Resource | URL | Notes |
|----------|-----|-------|
| **Cruip: Canvas Particle Animation** | https://cruip.com/how-to-create-a-beautiful-particle-animation-with-html-canvas/ | Mouse interaction, Next.js/Vue components |
| **Interactive Particles (peerdh)** | https://peerdh.com/blogs/programming-insights/creating-interactive-particle-systems-with-user-input-in-javascript-and-html5-canvas | Comprehensive tutorial |
| **Codrops: Interactive Particles Three.js** | https://tympanus.net/codrops/2019/01/17/interactive-particles-with-three-js/ | Advanced WebGL approach |
| **particles-text-js GitHub** | https://github.com/havriutkin/particles-text-js | Logo from particles example |
| **Logo Particle Animation (SO)** | https://stackoverflow.com/questions/54438549/logo-particle-animation | Image-to-particles code |
| **Kirupa: Basic Particle System** | https://www.kirupa.com/html5/creating_basic_particle_system.htm | Fundamentals tutorial |
| **tsParticles** | https://particles.js.org/ | Full-featured library (reference) |
| **Particles.js Tutorial** | https://code.tutsplus.com/tutorials/particles-js-motion-and-interaction--cms-26302 | Interaction modes explained |

### Spring Physics & Animation

| Resource | URL | Notes |
|----------|-----|-------|
| **Josh Comeau: Spring Physics Intro** | https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/ | Excellent mental model |
| **Josh Comeau: CSS Linear Function** | https://www.joshwcomeau.com/animation/linear-timing-function/ | Spring approximation in CSS |
| **Motion.dev: Spring** | https://motion.dev/docs/spring | Production spring generator |
| **Spring Animation in CSS** | https://medium.com/@dtinth/spring-animation-in-css-2039de6e1a03 | Physics/calculus approach |
| **DEV: Physics-Based Springs** | https://dev.to/hexshift/how-to-create-physics-based-spring-animations-with-custom-damping-in-javascript-1e08 | Code examples |
| **Felix: Designing Spring Animations** | https://felixrunquist.com/posts/designing-spring-animations-for-the-web | Design perspective |
| **Easings.net** | https://easings.net/ | Easing function reference |
| **Lerp Tutorial** | https://dev.to/rachsmith/lerp-2mh7 | Linear interpolation basics |
| **ErraticGenerator: Easing** | https://erraticgenerator.com/blog/linear-interpolation-and-easing/ | Time-based animation |

### Canvas & Animation Fundamentals

| Resource | URL | Notes |
|----------|-----|-------|
| **MDN: requestAnimationFrame** | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame | Official API |
| **MDN: Basic Animations** | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations | Canvas animation guide |
| **Canvas Performance Tips** | https://gist.github.com/jaredwilli/5469626 | Best practices compilation |
| **Frame Rate Control** | https://qubitsandbytes.co.uk/javascript/control-the-frame-rate-of-requestanimationframe-callbacks/ | Throttling techniques |

### Mouse Interaction & Advanced Effects

| Resource | URL | Notes |
|----------|-----|-------|
| **FreeFrontend: JS Mouse Interactions** | https://freefrontend.com/javascript-mouse-interaction/ | 6 effect examples |
| **CSS-Tricks: DOM to Canvas Particles** | https://css-tricks.com/adding-particle-effects-to-dom-elements-with-canvas/ | Disintegrate effect |
| **DEV: Mesmerizing Particles** | https://dev.to/sohrabzia/creating-a-mesmerizing-particle-animation-with-javascript-e35 | Mouse attraction code |
| **CodePen: Particle Logo** | https://codepen.io/jayeshhpatel/pen/WaGLRX | ParticleSlider example |

### GSAP & Scroll Animation (Reference)

| Resource | URL | Notes |
|----------|-----|-------|
| **GSAP ScrollTrigger Docs** | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ | Official documentation |
| **GSAP Scroll Page** | https://gsap.com/scroll/ | Overview and examples |
| **FreeFrontend: ScrollTrigger Examples** | https://freefrontend.com/scroll-trigger-js/ | 32 code examples |
| **Marmelab: ScrollTrigger Tutorial** | https://marmelab.com/blog/2024/04/11/trigger-animations-on-scroll-with-gsap-scrolltrigger.html | Practical guide |

### Accessibility

| Resource | URL | Notes |
|----------|-----|-------|
| **MDN: prefers-reduced-motion** | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | Media query docs |
| **web.dev: Reduced Motion** | https://web.dev/articles/prefers-reduced-motion | Implementation guide |
| **CSS-Tricks: Reduced Motion Intro** | https://css-tricks.com/introduction-reduced-motion-media-query/ | Vestibular context |
| **W3C WCAG C39** | https://www.w3.org/WAI/WCAG22/Techniques/css/C39 | Official technique |
| **Edge DevTools: Simulate** | https://learn.microsoft.com/en-us/microsoft-edge/devtools/accessibility/reduced-motion-simulation | Testing instructions |

### CDN Links

```html
<!-- simplex-noise via ESM CDN -->
<script type="module">
  import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';
</script>

<!-- d3-contour (alternative) -->
<script type="module">
  import { contours } from 'https://cdn.jsdelivr.net/npm/d3-contour@4/+esm';
</script>

<!-- GSAP + ScrollTrigger (if adding scroll effects later) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
```

---

## File Structure

```
onebrief-ambient/
├── index.html                 # Demo page with all controls
├── src/
│   ├── ambient.js             # Main orchestrator module
│   ├── contours.js            # Marching squares + rendering
│   ├── particles.js           # Logo particle system
│   ├── spring.js              # Physics utilities
│   ├── noise.js               # Simplex noise wrapper
│   └── theme.js               # Color/theming utilities
├── assets/
│   ├── onebrief-logo.png      # Logo source image
│   ├── logo-mask.json         # Pre-computed particle positions (optional)
│   ├── screenshot-light.png
│   ├── screenshot-dark.png
│   └── preview.gif
├── styles/
│   └── ambient.css            # CSS custom properties, reduced motion
├── README.md                  # Assignment deliverable
└── TECHNICAL_PLAN.md          # This document
```

### Production Embed

```html
<header class="site-header">
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <nav class="header-nav">
    <!-- Navigation content -->
  </nav>
  <button 
    id="motion-toggle" 
    aria-label="Toggle animation"
    class="motion-toggle"
  >
    ⏸
  </button>
</header>

<script type="module">
  import { createAmbientHeader } from './src/ambient.js';
  
  const canvas = document.getElementById('ambient-canvas');
  const ambient = createAmbientHeader(canvas, {
    logoSrc: './assets/onebrief-logo.png',
    particleCount: 500,
    contourLevels: 5,
    mouseRadius: 100,
    assemblyDuration: 2500,
  });
  
  document.getElementById('motion-toggle').addEventListener('click', () => {
    ambient.toggle();
  });
</script>
```

---

## Implementation Phases

### Phase 1: Foundation (20 min)

**Tasks:**
- [ ] Create HTML structure with canvas
- [ ] Set up ES module architecture
- [ ] Import simplex-noise from CDN
- [ ] Create basic animation loop with delta time
- [ ] Implement responsive canvas sizing

**Deliverable:** Empty canvas that resizes properly

---

### Phase 2: Contour Background (30 min)

**Tasks:**
- [ ] Generate noise field with 2-3 octaves
- [ ] Implement marching squares (16-case lookup)
- [ ] Add linear interpolation for smooth edges
- [ ] Extract contours at 5 threshold levels
- [ ] Render contour lines to canvas
- [ ] Add time-based animation to noise

**Deliverable:** Animated contour lines drifting slowly

---

### Phase 3: Logo Particle System (30 min)

**Tasks:**
- [ ] Load logo image and extract pixel data
- [ ] Create particle class with position/velocity/target
- [ ] Initialize particles at random positions
- [ ] Implement spring physics for movement
- [ ] Create assembly animation (random → logo shape)
- [ ] Add subtle idle "breathing" motion

**Deliverable:** Logo assembles from scattered particles on page load

---

### Phase 4: Mouse Interaction (15 min)

**Tasks:**
- [ ] Track mouse position relative to canvas
- [ ] Implement repulsion force calculation
- [ ] Apply force to nearby particles
- [ ] Ensure particles spring back when cursor leaves
- [ ] Tune radius and strength parameters

**Deliverable:** Particles react to mouse hover

---

### Phase 5: Theming & Polish (15 min)

**Tasks:**
- [ ] Define CSS custom properties for colors
- [ ] Implement `prefers-color-scheme` detection
- [ ] Create light/dark color palettes
- [ ] Add manual theme toggle
- [ ] Fine-tune animation speeds and opacities

**Deliverable:** Effect looks good in both themes

---

### Phase 6: Accessibility & Delivery (10 min)

**Tasks:**
- [ ] Detect `prefers-reduced-motion`
- [ ] Stop animation when reduced motion active
- [ ] Show static logo fallback
- [ ] Add pause/play button
- [ ] Write README
- [ ] Capture screenshots/GIF
- [ ] Deploy

**Deliverable:** Live prototype URL + documentation

---

### Stretch Goals (If Time Permits)

- [ ] **Click ripple effect** — Particles burst outward on click
- [ ] **Scroll parallax** — Slight contour shift on scroll
- [ ] **Logo morph** — Particles transition between different logo states
- [ ] **Sound reactive** — Subtle response to ambient audio (Web Audio API)

---

## Performance Considerations

### Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| CPU (idle) | < 5% | Activity Monitor / Task Manager |
| Frame rate | 60fps (30fps acceptable) | Chrome DevTools FPS meter |
| Bundle size | < 15kb | Network tab |
| Memory growth | None over 5 minutes | Performance tab |
| Mobile battery | Minimal impact | Test on device |

### Optimization Strategies

| Concern | Solution |
|---------|----------|
| Too many particles | Cap at 500-800, reduce on mobile |
| Large canvas | Use coarse contour grid (40-60px cells) |
| Frequent allocations | Reuse TypedArrays, object pools |
| Resize thrashing | Debounce ResizeObserver (100ms) |
| Background tabs | rAF automatically pauses |
| High refresh displays | Cap at 60fps via timestamp check |
| Mobile | Reduce particle count, disable mouse effects |

### Particle Count Guidelines

| Device | Max Particles | Contour Grid |
|--------|---------------|--------------|
| Desktop (powerful) | 800-1000 | 35px |
| Desktop (average) | 500-700 | 40px |
| Tablet | 300-500 | 50px |
| Mobile | 200-300 | 60px |

### Performance Detection

```javascript
function getPerformanceTier() {
  // Check for low-end device indicators
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const hasSlowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  if (isMobile || hasLowMemory || hasSlowCPU) {
    return 'low';
  }
  return 'high';
}
```

---

## Color Tokens & Theming

### CSS Custom Properties

```css
:root {
  /* === Canvas Background === */
  --ambient-bg: #ffffff;
  --ambient-bg-dark: #0a0f1a;
  
  /* === Contour Strokes === */
  --contour-stroke: rgba(0, 40, 80, 0.10);
  --contour-stroke-dark: rgba(100, 160, 220, 0.12);
  --contour-stroke-width: 1px;
  
  /* === Logo Particles === */
  --particle-color: #3B9DFF;
  --particle-color-dark: #5BB5FF;
  --particle-glow: rgba(59, 157, 255, 0.3);
  
  /* === Animation === */
  --contour-speed: 0.0003;
  --assembly-duration: 2500ms;
  --spring-tension: 0.02;
  --spring-friction: 0.92;
  --mouse-radius: 100px;
  
  /* === Interaction === */
  --hover-repulse-strength: 5;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --ambient-bg: var(--ambient-bg-dark);
    --contour-stroke: var(--contour-stroke-dark);
    --particle-color: var(--particle-color-dark);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --contour-speed: 0;
    --assembly-duration: 0ms;
    --hover-repulse-strength: 0;
  }
}
```

### JavaScript Theme Reading

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
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  updateColors();
});
```

---

## Accessibility

### Requirements Checklist

- [ ] **prefers-reduced-motion** — Stop all animation when `reduce` is set
- [ ] **Pause control** — Visible button to pause/resume (WCAG SC 2.2.2)
- [ ] **No seizure triggers** — Well under 3 flashes/second (WCAG SC 2.3.1)
- [ ] **aria-hidden** — Canvas marked decorative
- [ ] **Keyboard accessible** — Pause button focusable and operable
- [ ] **No content dependency** — Animation is purely decorative

### Reduced Motion Implementation

```javascript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initAccessibility() {
  if (reducedMotion.matches) {
    // Show static state immediately
    renderStaticLogo();
    renderStaticContours();
  } else {
    startAnimation();
  }
  
  // Listen for preference changes
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

### Testing Checklist

| Platform | How to Enable Reduced Motion |
|----------|------------------------------|
| macOS | System Preferences → Accessibility → Display → Reduce motion |
| Windows | Settings → Ease of Access → Display → Show animations (off) |
| iOS | Settings → Accessibility → Motion → Reduce Motion |
| Android | Settings → Accessibility → Remove animations |
| Chrome DevTools | Command Palette → "Emulate CSS prefers-reduced-motion" |

---

## AI Usage Plan

This section documents how AI tools will be leveraged during implementation, as required by the assignment.

### Planned AI Prompts

| Phase | Task | Prompt |
|-------|------|--------|
| **Phase 2** | Marching squares | "Implement marching squares in vanilla JS with the 16-case lookup table and linear interpolation for smooth contours" |
| **Phase 2** | Noise tuning | "Help tune simplex noise parameters (frequency, octaves, amplitude) for organic terrain-like contours" |
| **Phase 3** | Particle class | "Create a Particle class in JS with position, velocity, target, and spring physics methods" |
| **Phase 3** | Image sampling | "Write a function to extract particle positions from an image using canvas getImageData" |
| **Phase 4** | Mouse interaction | "Implement mouse repulsion physics for particles with configurable radius and strength" |
| **Phase 5** | Theme system | "Generate CSS custom properties for a light/dark ambient animation theme" |
| **Phase 6** | Accessibility | "Audit this animation for WCAG 2.1 AA compliance, especially motion criteria" |
| **Phase 6** | README | "Draft README covering intent, technical approach, and AI usage" |

### AI Iteration Workflow

1. **Algorithm skeleton** — Use AI to generate initial implementation
2. **Manual review** — Verify logic, fix bugs, understand code
3. **Parameter tuning** — Use AI to suggest adjustments
4. **Performance review** — Have AI check for issues
5. **Documentation** — AI-assisted writing with manual editing

### AI Tools Used

- **Claude** — Primary assistant for code generation and review
- **VS Code Copilot** — Inline completions during coding (optional)

---

## Future Productionization

### Short-term (1-2 hours additional)

- [ ] React component wrapper with TypeScript
- [ ] NPM package setup
- [ ] Storybook documentation
- [ ] Unit tests for physics functions

### Medium-term (half day)

- [ ] WebGL shader version for GPU acceleration
- [ ] Scroll-linked parallax effect
- [ ] Logo state morphing (e.g., loading → complete)
- [ ] Click burst/ripple effect
- [ ] Multiple logo support (brand variants)

### Long-term (production polish)

- [ ] Performance monitoring with Web Vitals
- [ ] A/B testing for animation intensity
- [ ] Server-side rendering fallback (static SVG)
- [ ] Design token integration (Figma/Tokens Studio)
- [ ] Internationalized accessibility labels
- [ ] Analytics for interaction tracking

---

## Quick Reference

### Development Commands

```bash
# Local development (no build needed)
npx serve .

# Or use Python
python -m http.server 8000

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod

# Create GIF preview
ffmpeg -i recording.mov -vf "fps=15,scale=800:-1" -loop 0 preview.gif
```

### Key File Locations

| File | Purpose |
|------|---------|
| `index.html` | Demo page |
| `src/ambient.js` | Main entry point |
| `src/contours.js` | Marching squares |
| `src/particles.js` | Logo particles |
| `src/spring.js` | Physics |

---

## Summary

This technical plan defines a **two-layer ambient motion system** for Onebrief's marketing header:

1. **Background:** Procedurally generated topographic contours that drift slowly
2. **Foreground:** Interactive logo composed of particles with spring physics

The implementation prioritizes:
- ✅ Brand alignment (maps, collaboration, precision)
- ✅ Performance (lightweight, battery-friendly)
- ✅ Accessibility (reduced motion, pause controls)
- ✅ Interactivity (mouse repulsion)
- ✅ Polish (spring physics, theming)

**Estimated time:** 2 hours for core implementation, with stretch goals available if time permits.

---

*Document generated with Claude AI assistance as part of the design engineering workflow.*
