/**
 * Particle System for Onebrief Ambient Motion
 *
 * Physics-based particle system with spring dynamics for logo assembly animation.
 * Implements damped harmonic oscillator for natural, organic motion feel.
 */

/**
 * Individual Particle with Spring Physics
 *
 * Spring dynamics based on Hooke's Law with damping:
 * - Force = -k(x - x₀) - c·v
 * - Where k = spring constant (stiffness), c = damping coefficient
 */
class Particle {
  constructor(targetX, targetY, config = {}) {
    // Target position (equilibrium point for spring)
    this.targetX = targetX;
    this.targetY = targetY;

    // Current position (starts random, will settle to target)
    this.x = config.startX ?? targetX;
    this.y = config.startY ?? targetY;

    // Velocity (momentum preservation for smooth interrupts)
    this.vx = 0;
    this.vy = 0;

    // Spring physics parameters
    // stiffness 0.02 = moderate response, not jarring (180-220 in Hz terms)
    // friction 0.92 = slight underdamping, one gentle overshoot before settling
    this.springStrength = config.springStrength ?? 0.02;
    this.friction = config.friction ?? 0.92;

    // Visual properties
    this.size = config.size ?? 2 + Math.random() * 2; // 2-4px variation for organic feel
    this.color = config.color ?? '#FFFFFF';
    this.opacity = config.opacity ?? 1.0;

    // Breathing animation (idle state)
    this.breathPhase = Math.random() * Math.PI * 2; // Random phase for organic distribution
    this.breathSpeed = 0.02 + Math.random() * 0.01; // Slight variation per particle
    this.breathAmplitude = config.breathAmplitude ?? 0.5; // Subtle 0.5px movement

    // Interaction state
    this.isRepelled = false;
    this.repelForceX = 0;
    this.repelForceY = 0;
  }

  /**
   * Update particle physics (spring forces + breathing + mouse interaction)
   *
   * @param {number} time - Current time for breathing animation
   * @param {boolean} isSettled - If true, apply breathing; if false, skip for performance
   */
  update(time, isSettled = false) {
    // Calculate breathing offset (subtle oscillation around target)
    let breathOffsetX = 0;
    let breathOffsetY = 0;

    if (isSettled && this.breathAmplitude > 0) {
      this.breathPhase += this.breathSpeed;
      const breathValue = Math.sin(this.breathPhase);

      // Circular breathing pattern (like leaves gently swaying)
      breathOffsetX = Math.cos(this.breathPhase) * this.breathAmplitude;
      breathOffsetY = breathValue * this.breathAmplitude;
    }

    // Effective target includes breathing offset
    const effectiveTargetX = this.targetX + breathOffsetX;
    const effectiveTargetY = this.targetY + breathOffsetY;

    // Spring force calculation (Hooke's Law with damping)
    // Force pulls particle toward effective target
    const dx = effectiveTargetX - this.x;
    const dy = effectiveTargetY - this.y;

    const springForceX = dx * this.springStrength;
    const springForceY = dy * this.springStrength;

    // Apply repel force from mouse interaction (if any)
    const totalForceX = springForceX + this.repelForceX;
    const totalForceY = springForceY + this.repelForceY;

    // Update velocity (force accumulation)
    this.vx += totalForceX;
    this.vy += totalForceY;

    // Apply friction (damping for energy dissipation)
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position (Euler integration)
    this.x += this.vx;
    this.y += this.vy;

    // Reset repel forces (recalculated each frame if mouse nearby)
    this.repelForceX = 0;
    this.repelForceY = 0;
    this.isRepelled = false;
  }

  /**
   * Apply mouse repulsion force (inverse-square falloff for magnetic field feel)
   *
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} radius - Influence radius in pixels
   * @param {number} strength - Force strength multiplier
   */
  applyRepelForce(mouseX, mouseY, radius, strength) {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distSq = dx * dx + dy * dy;
    const radiusSq = radius * radius;

    // Only apply if within influence radius
    if (distSq < radiusSq && distSq > 0.01) { // epsilon prevents division by zero
      const dist = Math.sqrt(distSq);

      // Inverse-square falloff (realistic force field)
      // Add epsilon to denominator for numerical stability
      const forceMagnitude = strength / (distSq + 0.01);

      // Normalize direction and apply magnitude
      this.repelForceX = (dx / dist) * forceMagnitude;
      this.repelForceY = (dy / dist) * forceMagnitude;
      this.isRepelled = true;
    }
  }

  /**
   * Render particle to canvas context
   * Note: Individual rendering is slow - use renderParticles() batch function instead
   */
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fillRect(
      Math.round(this.x - this.size / 2),
      Math.round(this.y - this.size / 2),
      this.size,
      this.size
    );
  }

  /**
   * Check if particle has settled (for performance optimization)
   * Settled = velocity near zero and close to target
   */
  isSettled(threshold = 0.01) {
    const velocityMag = Math.abs(this.vx) + Math.abs(this.vy);
    const distToTarget = Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY);
    return velocityMag < threshold && distToTarget < threshold;
  }
}

/**
 * Extract particle positions from logo image
 * Samples pixels with sufficient alpha to determine "solid" areas
 *
 * @param {HTMLImageElement} image - Logo image to sample
 * @param {number} samplingDensity - How many pixels to skip (1 = every pixel, 2 = every other, etc.)
 * @param {number} alphaThreshold - Minimum alpha value (0-255) to consider pixel "solid"
 * @returns {Array<{x: number, y: number, color: string}>} Array of particle target positions
 */
function extractParticlePositions(image, samplingDensity = 2, alphaThreshold = 128) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image to extract pixel data
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const positions = [];

  // Sample pixels based on density setting
  for (let y = 0; y < canvas.height; y += samplingDensity) {
    for (let x = 0; x < canvas.width; x += samplingDensity) {
      const index = (y * canvas.width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      // Only include pixels with sufficient opacity
      if (a > alphaThreshold) {
        positions.push({
          x,
          y,
          color: `rgba(${r}, ${g}, ${b}, ${a / 255})`
        });
      }
    }
  }

  return positions;
}

/**
 * Initialize particle system with scattered starting positions
 *
 * @param {Array<{x: number, y: number, color: string}>} targetPositions - Where particles should settle
 * @param {Object} canvasBounds - {width, height} of canvas for random scatter
 * @param {Object} physicsConfig - Spring physics parameters (optional)
 * @returns {Array<Particle>} Array of initialized particles
 */
function initializeParticles(targetPositions, canvasBounds, physicsConfig = {}) {
  const particles = [];

  for (const target of targetPositions) {
    // Random starting position (scattered across canvas)
    const startX = Math.random() * canvasBounds.width;
    const startY = Math.random() * canvasBounds.height;

    const particle = new Particle(target.x, target.y, {
      startX,
      startY,
      color: target.color,
      springStrength: physicsConfig.springStrength ?? 0.02,
      friction: physicsConfig.friction ?? 0.92,
      size: physicsConfig.size ?? (2 + Math.random() * 2),
      breathAmplitude: physicsConfig.breathAmplitude ?? 0.5
    });

    particles.push(particle);
  }

  return particles;
}

/**
 * Update all particles (spring physics simulation step)
 *
 * @param {Array<Particle>} particles - Particle array to update
 * @param {number} time - Current time (for breathing animation)
 * @param {Object} mouseState - {x, y, radius, strength} for mouse interaction (optional)
 */
function updateParticles(particles, time, mouseState = null) {
  // Check if most particles have settled (for performance optimization)
  let settledCount = 0;
  const checkSampleSize = Math.min(50, particles.length);

  for (let i = 0; i < checkSampleSize; i++) {
    if (particles[i].isSettled()) settledCount++;
  }

  const isSettled = settledCount > checkSampleSize * 0.8; // 80% threshold

  // Update each particle
  for (const particle of particles) {
    // Apply mouse repulsion if mouse state provided
    if (mouseState && mouseState.active) {
      particle.applyRepelForce(
        mouseState.x,
        mouseState.y,
        mouseState.radius ?? 150,
        mouseState.strength ?? 0.5
      );
    }

    particle.update(time, isSettled);
  }
}

/**
 * Render all particles to canvas (batched for performance)
 * Uses single fillStyle when possible to minimize state changes
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Particle>} particles - Particles to render
 */
function renderParticles(ctx, particles) {
  // Reset global alpha
  ctx.globalAlpha = 1.0;

  // Batch particles by color for fewer state changes
  const colorBatches = new Map();

  for (const particle of particles) {
    if (!colorBatches.has(particle.color)) {
      colorBatches.set(particle.color, []);
    }
    colorBatches.get(particle.color).push(particle);
  }

  // Render each color batch
  for (const [color, batch] of colorBatches) {
    ctx.fillStyle = color;

    for (const particle of batch) {
      // Round positions for pixel-perfect rendering
      ctx.fillRect(
        Math.round(particle.x - particle.size / 2),
        Math.round(particle.y - particle.size / 2),
        particle.size,
        particle.size
      );
    }
  }
}

/**
 * Calculate optimal spring parameters for different motion feels
 *
 * @param {string} feel - 'snappy', 'smooth', 'bouncy', 'heavy'
 * @returns {Object} {springStrength, friction, breathAmplitude}
 */
function getSpringPreset(feel = 'smooth') {
  const presets = {
    // Quick response, critical damping (no overshoot)
    snappy: {
      springStrength: 0.04,
      friction: 0.95,
      breathAmplitude: 0.3
    },

    // Moderate response, slight underdamping (default)
    smooth: {
      springStrength: 0.02,
      friction: 0.92,
      breathAmplitude: 0.5
    },

    // Playful overshoot, low damping
    bouncy: {
      springStrength: 0.025,
      friction: 0.88,
      breathAmplitude: 0.8
    },

    // Slow, weighty momentum
    heavy: {
      springStrength: 0.015,
      friction: 0.94,
      breathAmplitude: 0.4
    }
  };

  return presets[feel] || presets.smooth;
}

/**
 * Create reduced motion variant (accessibility)
 * Returns config that fades in without spring physics
 *
 * @returns {Object} Config for reduced motion experience
 */
function getReducedMotionConfig() {
  return {
    // No spring motion - particles start at target
    springStrength: 1.0, // Instant snap to target
    friction: 0.5, // Quick settle
    breathAmplitude: 0, // No breathing animation
    skipScatter: true, // Start at target positions
    transitionDuration: 200 // Simple 200ms fade-in
  };
}

// Export all functions and classes
export {
  Particle,
  extractParticlePositions,
  initializeParticles,
  updateParticles,
  renderParticles,
  getSpringPreset,
  getReducedMotionConfig
};
