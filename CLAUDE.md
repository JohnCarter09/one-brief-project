# CLAUDE.md

This file provides guidance to Claude Code when working with the Onebrief Ambient Motion Prototype.

## Project Overview

This is a **vanilla JavaScript prototype** featuring an interactive particle-based logo animation that follows the user's mouse cursor.

**Core Interaction:**
- Particle logo smoothly follows mouse movement
- Particles fade out when hovering over buttons/navigation
- Spring physics for natural, organic motion
- No build system - runs directly in browser

**Tech Stack:**
- Canvas 2D API (no framework)
- ES Modules
- simplex-noise library via CDN
- Custom spring physics implementation

**Constraints:**
- Lightweight (~10-12kb total bundle)
- Performance-first (60fps target)
- Vanilla JavaScript only
- No theme toggle (removed)

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
├── index.html              # Demo page with hero layout
├── src/
│   ├── ambient.js          # Main orchestrator
│   ├── particles.js        # Particle system with spring physics
│   ├── contours.js         # Background contours (currently disabled)
│   ├── spring.js           # Physics utilities
│   └── noise.js            # Simplex noise wrapper
├── styles/
│   └── ambient.css         # CSS with pointer-events handling
├── assets/
│   ├── OneBrief.svg        # Logo for particle extraction
│   ├── nav-logo.svg        # Navigation logo
│   └── hero_image.png      # Hero background
├── CLAUDE.md               # This file
└── README.md
```

## Key Implementation Details

### 1. Mouse-Following Logo System

The logo center position follows the mouse using spring physics. Each particle maintains an offset from this center point:

```javascript
// In ambient.js
logoState.targetCenterX = mouse.x;
logoState.targetCenterY = mouse.y;

// Update logo position with spring physics
updateLogoPosition();

// Each particle's target moves with the logo center
particle.targetX = logoState.centerX + particle.offsetX;
particle.targetY = logoState.centerY + particle.offsetY;
```

**Configuration:**
- `logoSpringStrength: 0.2` — High value for responsive following
- `logoFriction: 0.85` — Lower friction for smooth tracking
- No snap-back to center on mouse leave

### 2. Fade-Out Interaction

When the user hovers over interactive elements (buttons, links), particles fade out smoothly instead of moving off-screen:

```javascript
// src/ambient.js
function handleInteractiveEnter() {
  // Fade out particles smoothly
  for (const particle of particles) {
    particle.targetOpacity = 0;
  }
}

function handleInteractiveLeave() {
  // Fade particles back in
  for (const particle of particles) {
    particle.targetOpacity = 1.0;
  }
}
```

**How it works:**
- Interactive elements have event listeners for `mouseenter` and `mouseleave`
- `targetOpacity` smoothly interpolates toward 0 or 1.0
- `opacityTransitionSpeed = 0.1` controls fade rate
- Particles stay in position while fading (no movement)

### 3. Pointer Events Architecture

Critical CSS pattern that allows the canvas to receive mouse events while keeping UI elements interactive:

```css
/* styles/ambient.css */
.header-content {
  pointer-events: none;  /* Make container transparent to mouse events */
}

/* Only enable pointer events for interactive elements */
.header-content a,
.header-content button,
.header-content input,
.header-content select,
.header-content textarea {
  pointer-events: auto;  /* Re-enable for UI elements */
}
```

**Why this matters:**
- Without this, hero text blocks mouse events from reaching canvas
- Allows particles to follow mouse over text areas
- Maintains full interactivity for buttons and links
- Hero section text doesn't block particle interaction

### 4. Particle Opacity System

Each particle has both current and target opacity with smooth transitions:

```javascript
// src/particles.js - Particle class
this.opacity = 1.0;              // Current opacity
this.targetOpacity = 1.0;        // Target opacity
this.opacityTransitionSpeed = 0.1; // Fade speed

// In update() method
const opacityDiff = this.targetOpacity - this.opacity;
this.opacity += opacityDiff * this.opacityTransitionSpeed;
```

**Rendering with opacity:**
```javascript
// src/particles.js - renderParticles()
for (const particle of batch) {
  ctx.globalAlpha = particle.opacity;  // Use particle's current opacity
  ctx.fillRect(/*...*/);
}
```

### 5. Layout & Alignment System

**Grid Structure:**
- Container: `max-width: 1440px` (`.header-content`)
- Navigation: `width: 100%` (full container width)
- Hero content: `max-width: 1128px, margin: 0` (left-aligned)
- Cards: No max-width (fills container)

**Alignment:**
```css
/* Navigation - full width */
.header-nav {
  width: 100%;
  margin: 0 0 2rem 0;
}

/* Hero - left aligned, constrained width */
.hero {
  max-width: 1128px;
  margin: 0;  /* No auto centering */
  padding: 0 1em;
}

/* Cards - full width */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## Configuration

### Current Settings (index.html)

```javascript
const ambient = createAmbientHeader(canvas, {
  logoSvgUrl: './assets/OneBrief.svg',
  particleCount: 500,
  mouseRadius: 150,           // Repulsion radius
  mouseForce: 1.5,            // Repulsion strength
  timeSpeed: 0.0003,
  useSamplingDensity: 3,
  alphaThreshold: 128,
  showContours: false,        // Background contours disabled
  logoSpringStrength: 0.2,    // Logo following responsiveness
  logoFriction: 0.85,         // Logo movement damping
});
```

### Tuning Parameters

**Logo Following Feel:**
- Increase `logoSpringStrength` for more direct tracking
- Decrease `logoFriction` for smoother, flowing motion
- Higher stiffness + lower friction = more direct

**Particle Fade Speed:**
- Adjust `opacityTransitionSpeed` in `particles.js` (Particle constructor)
- Lower = slower fade, higher = faster fade
- Current: `0.1`

**Mouse Repulsion:**
- `mouseRadius: 150` — How far particles are affected
- `mouseForce: 1.5` — Strength of repulsion

## Common Tasks

### Adjusting Fade Speed

```javascript
// src/particles.js - Particle constructor
this.opacityTransitionSpeed = 0.15;  // Faster fade
this.opacityTransitionSpeed = 0.05;  // Slower fade
```

### Changing Logo Following Behavior

```javascript
// index.html configuration
logoSpringStrength: 0.3,    // More responsive
logoFriction: 0.90,         // Less floaty
```

### Adding New Interactive Elements

Interactive elements automatically get fade-out behavior via event listeners:

```javascript
// src/ambient.js - play() function
const interactiveElements = document.querySelectorAll('.header-content a, .header-content button');
interactiveElements.forEach(element => {
  element.addEventListener('mouseenter', handleInteractiveEnter);
  element.addEventListener('mouseleave', handleInteractiveLeave);
});
```

To add new element types, update the selector:
```javascript
const interactiveElements = document.querySelectorAll(
  '.header-content a, .header-content button, .custom-interactive'
);
```

### Disabling Contours

Contours are currently disabled in the config:

```javascript
showContours: false,  // Set to true to enable background contours
```

## Important Patterns

### Event Listener Management

Event listeners are added in `play()` and removed in `destroy()`:

```javascript
// Add during initialization
window.addEventListener('resize', handleResize);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseleave', handleMouseLeave);

// Remove during cleanup
window.removeEventListener('resize', handleResize);
canvas.removeEventListener('mousemove', handleMouseMove);
// etc.
```

### Canvas Rendering Pipeline

```javascript
function renderFrame() {
  // 1. Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 2. Draw background (contours - currently disabled)
  if (config.showContours) {
    renderContours();
  }

  // 3. Draw particles with opacity
  if (config.showParticles && particles.length > 0) {
    renderParticles(ctx, particles);
  }
}
```

### Spring Physics Update Loop

```javascript
// Update logo position (spring toward mouse)
updateLogoPosition();

// Update all particle targets based on logo position
updateParticleTargets();

// Update individual particles (spring toward targets)
updateParticles(particles, time, mouseState);
```

## Development Guidelines

### When Modifying Interactions

1. **Always test with mouse and touch** — Both interaction modes should work
2. **Check pointer events** — Make sure canvas receives events in empty areas
3. **Verify interactive elements** — Buttons/links should remain clickable
4. **Test fade behavior** — Ensure smooth transitions without flicker

### When Adjusting Layout

1. **Check alignment** — Hero and navigation should align on left edge
2. **Test responsiveness** — Verify mobile breakpoints
3. **Maintain grid** — Keep 1128px content constraint
4. **Full-width elements** — Cards should fill container

### When Tuning Physics

1. **Start with presets** — Use spring presets from `particles.js`
2. **Test extremes** — Try very high/low values to understand behavior
3. **Record before/after** — Capture video to compare changes
4. **User test** — Get feedback on "feel"

## Known Implementation Details

### No Theme Toggle

Theme toggle was removed per user request. The app uses light mode styling with no dark mode switcher.

### No Snap-Back Behavior

When the mouse leaves the canvas or interactive element, the logo stays in its current position rather than snapping back to center. This prevents jarring movements.

### Particle Extraction from SVG

Particles are extracted by:
1. Loading SVG as image
2. Drawing to off-screen canvas
3. Reading pixel data with `getImageData()`
4. Creating particle positions from pixels with alpha > threshold

### Interactive Element Detection

All `<a>` and `<button>` elements within `.header-content` automatically get fade-out behavior via `querySelectorAll()` and event listeners.

## Troubleshooting

### Particles Not Following Mouse

**Check:**
- Canvas element exists and is rendering
- Mouse events are firing (check console logs)
- `pointer-events: none` is set on `.header-content`
- `logoSpringStrength` is not too low

### Fade Not Working on Hover

**Check:**
- Event listeners are attached to interactive elements
- `handleInteractiveEnter/Leave` functions are defined
- `targetOpacity` is being set correctly
- Particles have `opacity` and `targetOpacity` properties

### Layout Misalignment

**Check:**
- `.hero` has `margin: 0` (not `margin: 0 auto`)
- `.header-nav` has `width: 100%`
- Container has correct `max-width: 1440px`

### Performance Issues

**Solutions:**
- Reduce `particleCount` (try 300-400)
- Disable contours (`showContours: false`)
- Lower `mouseRadius` to reduce calculations
- Check FPS in DevTools Performance panel

## Commit Message Guidelines

- No attribution to Claude or Anthropic
- No emojis
- Formal but concise
- Direct and descriptive

**Examples:**
- "Add particle fade-out on interactive element hover"
- "Fix layout alignment for hero content"
- "Update mouse following spring parameters"
- "Remove theme toggle from navigation"

---

*Keep this file updated as the prototype evolves.*
