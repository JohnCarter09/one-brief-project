
![CleanShot 2025-11-26 at 13 51 15](https://github.com/user-attachments/assets/11e29cd7-585e-4fe9-a53e-c6762cb97250)

# Onebrief Ambient Motion Prototype

> **Design Engineering Candidate Assignment**
> **Author:** John Carter
> **Date:** November 2025

An interactive hero header featuring a particle-based Onebrief logo animation that follows the user's mouse cursor with smooth spring physics and intelligent fade interactions.

![Prototype Preview](./assets/preview.gif)

---

## Intent & Brand Rationale

**What feeling are we conveying?**

This prototype creates a sense of **playful control** and **real-time responsiveness** that reinforces Onebrief's core values:

- **Real-time Collaboration** — The logo responds instantly to user input, mirroring the collaborative nature of Onebrief's platform
- **Precision & Control** — Direct manipulation of particles creates a tangible sense of control over complex systems
- **Elegance Under Complexity** — Hundreds of particles move in unison, demonstrating order emerging from distributed parts (the essence of command operations)
- **Engagement Without Distraction** — Particles fade when hovering over UI elements, keeping focus on the task at hand

The mouse-following behavior transforms a static logo into a living, responsive element that invites exploration while maintaining professional polish through smooth physics and intelligent fade-out when users need to interact with buttons and navigation.

---

## Technical Approach

### Stack

- **Canvas 2D API** — Chosen for performance and fine-grained control over particle rendering
- **Vanilla JavaScript** — ES Modules with no build step for simplicity and transparency
- **Custom Spring Physics** — Implements Hooke's Law for natural, organic motion
- **simplex-noise** — 2kb library for procedural background contours (currently disabled)

### Architecture

**Core Systems:**

1. **Particle Extraction** — Logo SVG is sampled via `canvas.getImageData()` to create particle target positions
2. **Mouse-Following Logo** — Logo center position uses spring physics to track cursor; particles maintain their offsets from center
3. **Fade Interaction** — Interactive elements (buttons, links) trigger smooth opacity transitions via `targetOpacity` interpolation
4. **Pointer Events Architecture** — CSS `pointer-events: none` on content container allows canvas to receive mouse events while maintaining UI interactivity

**Key Technical Decisions:**

| Decision | Rationale |
|----------|-----------|
| **Fade vs. Snap-Back** | Fading out is smoother and less jarring than snapping particles to center or off-screen |
| **Spring Physics** | Provides natural momentum and smooth interruption handling vs. linear easing |
| **Canvas 2D vs. WebGL** | Canvas 2D is simpler and sufficient for 500 particles at 60fps; WebGL would add complexity without meaningful benefit at this scale |
| **Pointer Events Pattern** | Allows canvas to receive mouse events over hero text while keeping buttons/links interactive |
| **No Build System** | ES Modules run directly in browser for transparency and easy integration |

### Configuration

```javascript
{
  logoSvgUrl: './assets/OneBrief.svg',
  particleCount: 500,
  mouseRadius: 150,              // Repulsion radius
  mouseForce: 1.5,               // Repulsion strength
  logoSpringStrength: 0.2,       // Logo follow responsiveness
  logoFriction: 0.85,            // Movement damping
}
```

---

## AI Usage

# Project Workflow Summary

## 1. Initial Ideation with ChatGPT
- Began the project by exploring ideas and clarifying requirements using ChatGPT.
- Leveraged a long context window to refine the core objectives based on the original brief.
- Developed a solid conceptual foundation before moving into tool exploration.

## 2. Research & Inspiration
- Reviewed **OneBrief's website** for design inspiration and identified opportunities to enhance the interface.
- Explored subtle animation patterns by reviewing components from **React Bits** and **Magic UI**.
- Used insights from these libraries to inform future component behavior and interaction design.

## 3. Technical Specification Development
- Opened **Cloud Desktop** with MCP servers (context7, Exa, Firecrawl, and Playwright) installed.
- Deepened research into available component patterns and architectural approaches.
- Generated a **technical requirements document markdownfile** using Claude Desktop.
- Saved the document locally for use in project setup.

## 4. Project Setup
- Created a new project folder.
- Opened the folder in **Cursor**.
- Activated **Claude Code** inside Cursor to begin the development environment setup.

## 5. Agent & Skill Creation
- Returned to Cloud Desktop to build out automation support.
- Created:
  - **Two skilled sub-agents** which you will see once you clone the repo.
  - **Two Claude Skills**
- Added these generated files directly into the project folder.
- Used the `/agents` command inside Cloud Code (in Cursor) to create and register the new sub-agents.

## 6. Version Control & Collaboration
- Created a new repository in **GitHub**.
- Pushed the full project structure to GitHub.
- Pulled the feature branch locally.
- Began building the system with all components, agents, and resources in place.

---


## Performance & Accessibility

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Frame Rate | 60fps | Batched canvas rendering with single `fillStyle` per color group |
| Particle Count | 500 | Adjustable based on device capabilities |
| CPU Usage | <5% idle | Optimized update loop with early exits for settled particles |
| Bundle Size | ~10-12kb | Vanilla JS + 2kb noise library via CDN |

**Optimizations:**
- Batched rendering reduces context state changes
- Particles skip "breathing" animation when not settled (performance optimization)
- Mouse interaction only updates when active
- TypedArrays considered for future optimization (not yet implemented)

### Accessibility

**Current Implementation:**
- **Reduced Motion Support** — Respects `prefers-reduced-motion` system setting; shows static logo instead of animation
- Canvas marked `aria-hidden="true"` (decorative only)
- All interactive elements remain keyboard accessible
- No flashing content (well under WCAG 3 flashes/second threshold)

**Not Yet Implemented:**
- Manual pause/play control (WCAG SC 2.2.2)
- Focus indicators for keyboard navigation

---

## Next Steps for Production

If given more time, I would prioritize:

### 1. Accessibility Compliance (Highest Priority)

- Add manual pause/play button for WCAG SC 2.2.2 compliance
- Add keyboard focus indicators for interactive elements
- Test with screen readers to ensure non-disruptive experience

### 2. Performance Enhancements

- **Particle Pooling** — Use TypedArrays for zero-allocation updates
- **Adaptive Quality** — Reduce particle count on low-end devices
- **Offscreen Canvas** — Move rendering to Web Worker for smoother main thread

### 3. Responsive & Mobile

- Touch gesture support (drag logo on mobile)
- Reduced particle count on mobile (200-300 vs 500)
- Test on real devices for interaction feel

### 4. Polish & Features

- Subtle "breathing" animation when particles are settled
- Color shift on hover over different sections
- Logo state morphing (loading → assembled states)
- Click ripple effect from cursor position

### 5. Developer Experience

- TypeScript definitions for better IDE support
- React/Vue component wrappers
- Storybook for parameter tuning
- Performance profiling documentation

---

## Quick Integration

This component is designed to drop into any existing codebase with minimal friction.

**Step 1: HTML Structure**

```html
<header class="site-header">
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <div class="header-content">
    <!-- Your navigation and hero content -->
  </div>
</header>
```

**Step 2: Required CSS (Critical!)**

```css
.header-content {
  position: relative;
  z-index: 10;
  pointer-events: none;  /* Let canvas receive mouse events */
}

.header-content a,
.header-content button {
  pointer-events: auto;  /* Re-enable for interactive elements */
}
```

**Step 3: JavaScript**

```javascript
import { createAmbientHeader } from './src/ambient.js';

const canvas = document.getElementById('ambient-canvas');
const ambient = createAmbientHeader(canvas, {
  logoSvgUrl: './assets/YourLogo.svg',
  particleCount: 500,
});
```

**Required Files:** Copy `src/` directory and include in your project

**Accessibility:** Automatically respects `prefers-reduced-motion` - no additional setup needed

---

## Credits

- **simplex-noise** by Jonas Wagner
- Spring physics concepts from Josh Comeau

---

*Built with precision and performance for Onebrief*
