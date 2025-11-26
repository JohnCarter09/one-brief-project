# Onebrief Ambient Motion Prototype

> **Design Engineering Candidate Assignment**
> **Author:** John Carter
> **Date:** November 2025

An interactive hero header featuring a particle-based logo animation with mouse-following behavior and smooth fade interactions. Built with vanilla JavaScript and Canvas 2D for performance and minimal overhead.

## 🎯 Overview

This prototype creates an elegant, interactive header experience where the Onebrief logo is rendered as a particle system that smoothly follows the user's mouse cursor. The particles intelligently fade out when hovering over interactive elements (buttons, navigation) to maintain UI clarity.

**Key Interaction:**
- Particle logo follows mouse movement with smooth spring physics
- Particles fade out when hovering over buttons/navigation links
- No jarring snap-backs or off-screen movements
- Clean, polished interaction that feels responsive and intentional

## ✨ Features

- **Mouse-Following Logo** — Particle logo smoothly tracks cursor position with spring physics
- **Smart Fade Interactions** — Particles gracefully fade out over interactive elements
- **Spring Physics** — Natural, organic motion using custom spring simulation
- **Responsive Layout** — Full-width navigation bar with aligned hero content grid
- **Lightweight** — Vanilla JavaScript, no framework dependencies
- **Performance Optimized** — Canvas 2D rendering with batched draw calls
- **Accessibility Ready** — Proper pointer events handling for all interactive elements

## 🚀 Getting Started

### Local Development

```bash
# Serve locally (no build step required)
npx serve .

# Or use Python
python -m http.server 8000

# Open http://localhost:8000
```

### Quick Integration

```html
<header class="site-header">
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <div class="header-content">
    <!-- Your navigation and hero content -->
  </div>
</header>

<script type="module">
  import { createAmbientHeader } from './src/ambient.js';

  const canvas = document.getElementById('ambient-canvas');
  const ambient = createAmbientHeader(canvas, {
    logoSvgUrl: './assets/OneBrief.svg',
    particleCount: 500,
    mouseRadius: 150,
    mouseForce: 1.5,
    logoSpringStrength: 0.2,
    logoFriction: 0.85,
  });
</script>
```

## 📁 Project Structure

```
onebrief-ambient/
├── index.html              # Demo page with full header layout
├── src/
│   ├── ambient.js          # Main orchestrator module
│   ├── contours.js         # Marching squares contour generation
│   ├── particles.js        # Particle system with spring physics
│   ├── spring.js           # Physics utilities
│   └── noise.js            # Simplex noise wrapper
├── styles/
│   └── ambient.css         # CSS with pointer-events optimization
├── assets/
│   ├── OneBrief.svg        # Logo source for particle extraction
│   ├── nav-logo.svg        # Navigation logo
│   └── hero_image.png      # Hero background image
├── CLAUDE.md               # Development guide
└── README.md               # This file
```

## ⚙️ Configuration

### Core Parameters

```javascript
const config = {
  // Logo & Particles
  logoSvgUrl: './assets/OneBrief.svg',
  particleCount: 500,              // Number of particles in logo
  useSamplingDensity: 3,           // Logo sampling density (higher = fewer particles)
  alphaThreshold: 128,             // Alpha threshold for particle extraction

  // Mouse Interaction
  mouseRadius: 150,                // Mouse repulsion radius (px)
  mouseForce: 1.5,                 // Repulsion force strength

  // Logo Following Behavior
  logoSpringStrength: 0.2,         // How quickly logo follows mouse
  logoFriction: 0.85,              // Logo movement damping
  enableLogoFollow: true,          // Toggle mouse-following

  // Visual Settings
  showContours: false,             // Background contour lines
  showParticles: true,             // Particle rendering
};
```

### Spring Physics Presets

The particle system uses spring physics for natural motion. Available presets in `particles.js`:

| Preset | Spring Strength | Friction | Feel |
|--------|----------------|----------|------|
| `smooth` | 0.02 | 0.92 | Default - balanced response |
| `snappy` | 0.04 | 0.95 | Quick, responsive |
| `bouncy` | 0.025 | 0.88 | Playful overshoot |
| `heavy` | 0.015 | 0.94 | Slow, weighty |

## 🎨 Layout & Alignment

The layout uses a consistent 1440px max-width container with aligned content:

**Navigation Bar:**
- Full-width within container
- Max-width: 100% of parent container
- White background with rounded corners
- Centered buttons and links

**Hero Content:**
- Max-width: 1128px
- Left-aligned within parent
- Consistent left edge with navigation
- All typography aligned on same grid

**Cards Section:**
- Full-width grid layout
- Responsive 3-column design
- Aligns with hero content left edge
- `auto-fit` for flexible breakpoints

## 🔧 Technical Implementation

### Particle System

Particles are extracted from the logo SVG by sampling pixel data and creating target positions. Each particle has:

- **Position & Velocity** — Current state and momentum
- **Target Position** — Where the particle should settle
- **Spring Physics** — Forces pulling toward target
- **Opacity Control** — Smooth fade transitions
- **Breathing Animation** — Subtle idle motion when settled

### Mouse Following Logic

The logo center position uses spring physics to smoothly follow the mouse:

```javascript
// Logo center follows mouse with spring dynamics
logoState.targetCenterX = mouse.x;
logoState.targetCenterY = mouse.y;

// Each particle's target updates relative to logo center
particle.targetX = logoState.centerX + particle.offsetX;
particle.targetY = logoState.centerY + particle.offsetY;
```

### Interactive Element Handling

When hovering over buttons or links, particles fade out gracefully:

```javascript
// On hover: Fade out particles
for (const particle of particles) {
  particle.targetOpacity = 0;
}

// On mouse leave: Fade back in
for (const particle of particles) {
  particle.targetOpacity = 1.0;
}
```

### Pointer Events Optimization

The header content uses `pointer-events: none` to allow mouse events to reach the canvas below, while interactive elements have `pointer-events: auto`:

```css
.header-content {
  pointer-events: none;
}

.header-content a,
.header-content button,
.header-content input {
  pointer-events: auto;
}
```

This ensures the particle logo receives mouse events in empty space while maintaining full interactivity for buttons and links.

## 🧪 Stack

- **Rendering:** Canvas 2D API
- **Module System:** ES Modules (no build step)
- **Physics:** Custom spring implementation
- **Noise:** [simplex-noise](https://www.npmjs.com/package/simplex-noise) (~2kb)
- **Styling:** CSS custom properties for theming

## 📊 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Frame Rate | 60fps | Canvas 2D with batched rendering |
| Bundle Size | ~10-12kb | Vanilla JS + simplex-noise CDN |
| Particle Count | 500 | Adjustable based on device tier |
| CPU Usage | <5% idle | Optimized update loop |

## 🎯 Design Decisions

### Why Mouse Following?

The mouse-following logo creates an engaging, playful interaction that:
- Draws attention to the hero section
- Creates a sense of direct manipulation and control
- Reinforces Onebrief's focus on collaboration and real-time interaction
- Provides immediate visual feedback to user movement

### Why Fade Instead of Snap?

When hovering over interactive elements, particles fade out because:
- **Smoother UX** — No jarring movements or visual distractions
- **Maintains Context** — Users don't lose track of the logo position
- **Elegant Transitions** — Professional polish with smooth opacity changes
- **Performance** — Simpler than complex position animations

### Why Spring Physics?

Spring-based motion (vs. linear easing) provides:
- **Organic Feel** — Natural acceleration and deceleration
- **Momentum Preservation** — Smooth direction changes
- **Tunable Response** — Easy to adjust feel with stiffness/damping
- **Interrupt Handling** — Gracefully handles rapid mouse movements

## 🔮 Future Enhancements

**Interaction:**
- Add subtle particle "breathing" animation when idle
- Implement particle color shifts on hover
- Add click ripple effect from cursor position

**Performance:**
- WebGL renderer for GPU acceleration
- Particle pooling for zero-allocation updates
- Adaptive quality based on frame rate

**Features:**
- Logo state morphing (loading → complete)
- Scroll-linked parallax effects
- Touch gesture support for mobile

## 📄 License

This prototype was created as part of a design engineering candidate assignment for Onebrief.

## 🙏 Credits

- **simplex-noise** by Jonas Wagner
- Spring physics concepts from Josh Comeau
- Marching squares algorithm from Red Blob Games

---

*Built with precision and performance for Onebrief*
