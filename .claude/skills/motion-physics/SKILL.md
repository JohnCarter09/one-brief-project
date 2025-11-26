---
name: motion-physics
description: Expert patterns for spring-based animation, particle physics, mouse interaction, and motion accessibility. Use when implementing physics simulations, interactive hover effects, gesture handling, spring animations, or any motion that needs to respect prefers-reduced-motion.
---

# Motion Physics

Patterns for physics-based animation and accessible interactive motion.

## Core Principles

1. **Physics over time** — Springs have properties (stiffness, damping), not durations.
2. **Preserve velocity** — On interrupt, keep momentum for natural transitions.
3. **Accessibility first** — Always implement prefers-reduced-motion.
4. **Feel before code** — Define the emotion (snappy, bouncy, heavy) before parameters.

## Spring Physics Core

```javascript
class Spring {
  constructor({ stiffness = 100, damping = 10, mass = 1 } = {}) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.value = 0;
    this.velocity = 0;
    this.target = 0;
  }
  
  update(dt = 1/60) {
    const displacement = this.value - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    const accel = (springForce + dampingForce) / this.mass;
    this.velocity += accel * dt;
    this.value += this.velocity * dt;
    return this.value;
  }
  
  isAtRest(precision = 0.01) {
    return Math.abs(this.velocity) < precision && 
           Math.abs(this.value - this.target) < precision;
  }
}
```

## Spring Presets

| Feel | Stiffness | Damping | Mass | Use Case |
|------|-----------|---------|------|----------|
| Snappy | 300 | 30 | 1 | Buttons, toggles |
| Gentle | 120 | 14 | 1 | Modals, cards |
| Bouncy | 180 | 12 | 1 | Notifications |
| Heavy | 80 | 20 | 2 | Page transitions |
| Wobbly | 150 | 8 | 1 | Playful UI |
| Stiff | 400 | 40 | 1 | Precise, no bounce |

```javascript
const PRESETS = {
  snappy: { stiffness: 300, damping: 30, mass: 1 },
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  bouncy: { stiffness: 180, damping: 12, mass: 1 },
};
```

## 2D Particle with Spring

```javascript
class Particle2D {
  constructor(x, y, targetX, targetY, { stiffness = 0.02, friction = 0.92 } = {}) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.targetX = targetX; this.targetY = targetY;
    this.stiffness = stiffness;
    this.friction = friction;
  }
  
  update() {
    this.vx = (this.vx + (this.targetX - this.x) * this.stiffness) * this.friction;
    this.vy = (this.vy + (this.targetY - this.y) * this.stiffness) * this.friction;
    this.x += this.vx;
    this.y += this.vy;
  }
  
  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }
}
```

## Mouse Repulsion

```javascript
function applyRepulsion(particle, mouseX, mouseY, { radius = 100, strength = 8 } = {}) {
  const dx = particle.x - mouseX;
  const dy = particle.y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist >= radius || dist === 0) return;
  
  const force = Math.pow(1 - dist / radius, 2) * strength;
  particle.applyForce((dx / dist) * force, (dy / dist) * force);
}
```

## Mouse Attraction

```javascript
function applyAttraction(particle, mouseX, mouseY, { radius = 150, strength = 0.5 } = {}) {
  const dx = mouseX - particle.x;
  const dy = mouseY - particle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist >= radius) return;
  
  const force = (1 - dist / radius) * strength;
  particle.applyForce((dx / dist) * force, (dy / dist) * force);
}
```

## Mouse Tracking

```javascript
class MouseTracker {
  constructor(element) {
    this.x = null; this.y = null; this.isOver = false;
    
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
    });
    element.addEventListener('mouseenter', () => this.isOver = true);
    element.addEventListener('mouseleave', () => {
      this.isOver = false;
      this.x = this.y = null;
    });
  }
}
```

## Staggered Animation

```javascript
function stagger(particles, duration = 2000, pattern = 'random') {
  particles.forEach((p, i) => {
    switch (pattern) {
      case 'random': p.delay = Math.random() * duration; break;
      case 'index': p.delay = (i / particles.length) * duration; break;
      case 'radial':
        const cx = particles.reduce((s, p) => s + p.targetX, 0) / particles.length;
        const cy = particles.reduce((s, p) => s + p.targetY, 0) / particles.length;
        const maxD = Math.max(...particles.map(p => Math.hypot(p.targetX - cx, p.targetY - cy)));
        p.delay = (Math.hypot(p.targetX - cx, p.targetY - cy) / maxD) * duration;
        break;
    }
  });
}
```

## Reduced Motion

```javascript
class MotionController {
  constructor() {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = mq.matches;
    this.paused = false;
    mq.addEventListener('change', e => this.reduced = e.matches);
  }
  
  get shouldAnimate() { return !this.reduced && !this.paused; }
  toggle() { this.paused = !this.paused; }
  
  getSpring(full, instant = { stiffness: 1000, damping: 100 }) {
    return this.shouldAnimate ? full : instant;
  }
}
```

## Pause Button (Accessible)

```javascript
function createPauseButton(container, controller) {
  const btn = document.createElement('button');
  btn.className = 'motion-toggle';
  btn.setAttribute('aria-label', 'Pause animation');
  btn.setAttribute('aria-pressed', 'false');
  btn.textContent = '⏸';
  
  btn.onclick = () => {
    controller.toggle();
    const paused = !controller.shouldAnimate;
    btn.setAttribute('aria-pressed', paused);
    btn.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    btn.textContent = paused ? '▶' : '⏸';
  };
  
  container.appendChild(btn);
}
```

## Easing Functions

```javascript
const ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => t * (2 - t),
  inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  outCubic: t => (--t) * t * t + 1,
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

function lerp(a, b, t, fn = ease.linear) {
  return a + (b - a) * fn(t);
}
```

## Accessibility Checklist

- [ ] Detect `prefers-reduced-motion: reduce`
- [ ] Provide visible pause control (WCAG 2.2.2)
- [ ] No flashing > 3Hz (WCAG 2.3.1)
- [ ] Mark decorative canvas `aria-hidden="true"`
- [ ] Pause button keyboard accessible

## Common Mistakes

```javascript
// ❌ Springs don't have durations
spring.animate({ duration: 500 });

// ❌ Resetting velocity causes jarring stops
particle.vx = 0; particle.vy = 0;

// ❌ Ignoring accessibility
startAnimation(); // Always runs

// ✅ Preserve velocity on interrupt
// ✅ Check shouldAnimate before starting
```
