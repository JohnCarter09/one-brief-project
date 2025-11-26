# Onebrief Ambient Motion Prototype

> **Design Engineering Candidate Assignment**
> **Author:** John Carter
> **Date:** November 2025

A modern, interactive header animation combining procedurally generated topographic contours with particle-based logo assembly. Built with vanilla JavaScript and Canvas 2D for maximum performance and minimal bundle size.

![Prototype Preview](./assets/preview.gif)

## 🎯 Concept

This prototype creates an ambient, lava-lamp-style animation through two visual layers:

1. **Background Layer:** Slowly drifting topographic contour lines generated from animated simplex noise
2. **Foreground Layer:** The Onebrief logo assembled from interactive particles with spring physics

The effect is designed to feel alive without being distracting—subtle motion that reinforces Onebrief's brand identity around maps, collaboration, and precision.

## ✨ Features

- **Particle Assembly Animation** — Logo materializes from scattered particles on page load
- **Mouse Interaction** — Particles gently repel from cursor, then spring back
- **Procedural Contours** — Infinite topographic patterns using multi-octave simplex noise
- **Spring Physics** — Natural, organic motion using Hooke's law simulation
- **Responsive Design** — Automatically adapts to container size
- **Dark Mode Support** — Seamless theming via CSS custom properties
- **Accessibility First** — Full `prefers-reduced-motion` support with static fallback
- **Lightweight** — ~10-12kb total bundle size (including dependencies)
- **Battery Friendly** — Canvas 2D rendering with optimized particle counts

## 🤖 AI Development Agents & Skills

This project includes specialized Claude Code agents and skills to assist with development and optimization:

### Graphics Engineer Agent

The **graphics-engineer** agent specializes in:

- **Canvas Rendering Optimization** — Analyzing and improving rendering pipeline performance
- **Procedural Generation** — Implementing and tuning noise algorithms, marching squares, and contour generation
- **Performance Profiling** — Identifying bottlenecks in animation loops and suggesting GPU acceleration opportunities
- **Visual Algorithm Implementation** — Building particle systems, procedural art, and generative graphics
- **Shader Programming** — WebGL migration strategies and performance comparisons

**Equipped with skills:**
- `procedural-graphics` — Expert patterns for Canvas 2D/WebGL, noise functions, particle systems, marching squares implementations

**When to use:**
- Optimizing frame rates and reducing CPU usage
- Implementing new visual effects or procedural algorithms
- Debugging rendering issues or visual artifacts
- Planning WebGL/GPU acceleration migrations

**Example usage:**
```bash
# In Claude Code, invoke the graphics-engineer for rendering optimization
"My marching squares implementation is running at 45fps on a 1920x1080 canvas.
Can you help me optimize it to hit 60fps?"
```

### Motion Engineer Agent

The **motion-engineer** agent specializes in:

- **Animation Physics** — Tuning spring systems, easing functions, and physics-based motion
- **Interaction Design** — Implementing mouse/touch gestures with proper feel and responsiveness
- **Animation Accessibility** — Ensuring WCAG compliance with `prefers-reduced-motion` and vestibular considerations
- **Motion Libraries** — Integration with GSAP, Framer Motion, or custom spring implementations
- **Animation Code Review** — Auditing animation code for performance and accessibility

**Equipped with skills:**
- `motion-physics` — Expert patterns for spring-based animation, particle physics, mouse interaction, accessibility

**When to use:**
- Fine-tuning spring physics parameters (stiffness, damping, mass)
- Implementing gesture-based interactions with proper momentum
- Ensuring animations meet accessibility standards
- Creating smooth transitions and choreographed motion sequences

**Example usage:**
```bash
# In Claude Code, invoke the motion-engineer for physics tuning
"The particle spring physics feels too stiff. Help me tune the spring
constants for a more organic, floating feel."
```

### Available Skills

Skills are reusable knowledge modules that agents can access:

#### `procedural-graphics`
Located in `.claude/skills/procedural-graphics/`
- Animation loop patterns with frame budget management
- Simplex noise with FBM (Fractal Brownian Motion)
- Complete marching squares implementation (16 cases)
- Particle pool optimization with TypedArrays
- Image-to-particles extraction
- Responsive canvas setup (DPI-aware)
- Batched rendering techniques
- Device tier detection

#### `motion-physics`
Located in `.claude/skills/motion-physics/`
- Spring physics core implementation
- Spring presets (snappy, gentle, bouncy, heavy, wobbly, stiff)
- 2D particle with spring physics
- Mouse repulsion and attraction algorithms
- Mouse tracking utilities
- Staggered animation patterns
- `prefers-reduced-motion` implementation
- Accessible pause button
- Easing functions library

### How to Use Agents & Skills

If you're working with Claude Code in this repository:

1. **Invoke by mention:** Reference agents in your prompts when asking for help
2. **Automatic routing:** Claude Code will automatically use the appropriate agent based on your question
3. **Specialized context:** Agents have deep knowledge of their domains and access to their equipped skills
4. **Skills as reference:** Browse `.claude/skills/` for code patterns and implementation examples

## 🚀 Quick Start

### Local Development

```bash
# Serve locally (no build step required)
npx serve .

# Or use Python
python -m http.server 8000

# Open http://localhost:8000
```

### Production Embed

```html
<header class="site-header">
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <nav class="header-nav">
    <!-- Your navigation content -->
  </nav>
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
</script>
```

## 📁 Project Structure

```
onebrief-ambient/
├── index.html                 # Demo page with controls
├── src/
│   ├── ambient.js             # Main orchestrator module
│   ├── contours.js            # Marching squares + rendering
│   ├── particles.js           # Logo particle system
│   ├── spring.js              # Physics utilities
│   ├── noise.js               # Simplex noise wrapper
│   └── theme.js               # Color/theming utilities
├── styles/
│   └── ambient.css            # CSS custom properties
├── assets/
│   ├── onebrief-logo.png      # Logo source image
│   ├── screenshot-light.png
│   ├── screenshot-dark.png
│   └── preview.gif
├── .claude/
│   ├── agents/
│   │   ├── graphics-engineer.md   # Graphics optimization agent
│   │   └── motion-engineer.md     # Animation physics agent
│   └── skills/
│       ├── procedural-graphics/
│       │   ├── SKILL.md                          # Canvas/WebGL patterns
│       │   └── references/
│       │       └── marching-squares.md           # Complete implementation
│       └── motion-physics/
│           └── SKILL.md                          # Spring physics patterns
├── Plan.md                    # Technical plan document
├── CLAUDE.md                  # Claude Code development guide
└── README.md                  # This file
```

## 🎨 Brand Alignment

| Brand Attribute | Visual Expression |
|-----------------|-------------------|
| **Maps & GIS** | Topographic contour lines — the language of terrain |
| **Real-time Collaboration** | Particles forming unified logo — many units, one mission |
| **Speed & Precision** | Snappy spring physics on particle assembly |
| **Modern Tech** | Procedural generation, physics-based animation |
| **"Superhuman Staffs"** | Logo emerging from chaos → order (planning metaphor) |

## ⚙️ Configuration

### Visual Parameters

```javascript
const config = {
  // Particle System
  particleCount: 500,           // Number of logo particles
  assemblyDuration: 2500,       // Assembly animation length (ms)
  springStrength: 0.02,         // Physics tension
  friction: 0.92,               // Physics damping

  // Mouse Interaction
  mouseRadius: 100,             // Interaction zone (px)
  repulseStrength: 5,           // Repulsion force multiplier

  // Contour Background
  gridSize: 40,                 // Contour grid resolution (px)
  octaves: 3,                   // Noise complexity layers
  timeSpeed: 0.0003,            // Animation speed
  thresholds: [-0.5, -0.2, 0.1, 0.4, 0.7],  // Contour levels
};
```

### Performance Tiers

| Device | Particles | Grid Size | Notes |
|--------|-----------|-----------|-------|
| Desktop (high-end) | 800-1000 | 35px | Full effects |
| Desktop (average) | 500-700 | 40px | Recommended |
| Tablet | 300-500 | 50px | Reduced detail |
| Mobile | 200-300 | 60px | Minimal overhead |

## ♿ Accessibility

- **Reduced Motion Support** — Respects `prefers-reduced-motion` setting
- **Pause Control** — Manual pause/play button (WCAG SC 2.2.2)
- **No Seizure Risk** — Well under 3 flashes/second (WCAG SC 2.3.1)
- **Decorative Only** — Canvas marked `aria-hidden="true"`
- **Keyboard Accessible** — All controls operable via keyboard

### Testing Reduced Motion

| Platform | How to Enable |
|----------|---------------|
| macOS | System Preferences → Accessibility → Display → Reduce motion |
| Windows | Settings → Ease of Access → Display → Show animations (off) |
| Chrome DevTools | Command Palette → "Emulate CSS prefers-reduced-motion" |

## 🧪 Technical Details

### Stack

- **Rendering:** Canvas 2D API
- **Noise:** [simplex-noise](https://www.npmjs.com/package/simplex-noise) (~2kb)
- **Contours:** Custom marching squares implementation
- **Physics:** Custom spring system (Hooke's law)
- **Theming:** CSS custom properties
- **Build:** None (ES Modules via CDN)

### Algorithms

**Simplex Noise with Octaves**
Multi-layer noise sampling creates organic terrain-like patterns by combining multiple frequencies and amplitudes.

**Marching Squares**
Classic computer graphics algorithm that extracts contour lines from scalar fields using a 16-case lookup table with linear interpolation.

**Spring Physics**
Simple harmonic motion simulation using Hooke's law: `F = -k × displacement`

## 🤖 AI Usage

This prototype was developed with AI assistance as part of the design engineering workflow:

- **Algorithm Implementation:** Claude helped generate marching squares and spring physics code
- **Parameter Tuning:** AI-assisted optimization of noise frequencies and spring constants
- **Accessibility Audit:** WCAG compliance verification
- **Documentation:** AI-assisted README and technical plan writing with manual editing
- **Specialized Agents:** Graphics and motion engineering agents for domain-specific optimization

All AI-generated code was manually reviewed, tested, and understood before integration.

## 📊 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Frame Rate | 60fps | TBD |
| CPU (idle) | <5% | TBD |
| Bundle Size | <15kb | ~10-12kb |
| Memory Growth | None over 5min | TBD |

## 🔮 Future Enhancements

**Short-term:**
- React/Vue component wrappers
- TypeScript definitions
- Click ripple effect
- Scroll-linked parallax

**Long-term:**
- WebGL shader version for GPU acceleration
- Logo state morphing (loading → complete states)
- Analytics for interaction tracking
- Server-side rendering fallback

## 📄 License

This prototype was created as part of a design engineering candidate assignment for Onebrief.

## 🙏 Credits

- **simplex-noise** by Jonas Wagner ([GitHub](https://github.com/jwagner/simplex-noise.js))
- Marching squares algorithm resources from Red Blob Games
- Spring physics insights from Josh Comeau
- Claude Code AI agents for development assistance

---

*Built with ❤️ and procedural generation for Onebrief*
