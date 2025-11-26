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

**Step 1: HTML Structure**

```html
<header class="site-header">
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <div class="header-content">
    <nav>
      <!-- Your navigation -->
      <button class="cta-button">Get Started</button>
    </nav>
    <section class="hero">
      <h1>Your Hero Title</h1>
      <p>Your hero description</p>
    </section>
  </div>
</header>
```

**Step 2: Required CSS (Critical!)**

```css
.site-header {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#ambient-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* CRITICAL: Allow canvas to receive mouse events */
.header-content {
  position: relative;
  z-index: 10;
  pointer-events: none;  /* Make container transparent to mouse events */
}

/* Re-enable pointer events for interactive elements */
.header-content a,
.header-content button,
.header-content input {
  pointer-events: auto;
}
```

**Step 3: JavaScript Initialization**

```html
<script type="module">
  import { createAmbientHeader } from './src/ambient.js';

  const canvas = document.getElementById('ambient-canvas');
  const ambient = createAmbientHeader(canvas, {
    logoSvgUrl: './assets/YourLogo.svg',  // Path to your logo
    particleCount: 500,                    // Adjust for performance
    mouseRadius: 150,                      // Mouse repulsion radius
    mouseForce: 1.5,                       // Repulsion strength
    logoSpringStrength: 0.2,               // Logo follow responsiveness
    logoFriction: 0.85,                    // Logo movement smoothness
    showContours: false,                   // Background contours (optional)
  });
</script>
```

**Step 4: Include Required Files**

Copy these files to your project:
- `src/ambient.js` - Main orchestrator
- `src/particles.js` - Particle system
- `src/contours.js` - Background contours
- `src/spring.js` - Physics utilities
- `src/noise.js` - Noise generation
- Your logo SVG file

That's it! The particle logo will now follow your mouse cursor and fade out when hovering over buttons and links.

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
