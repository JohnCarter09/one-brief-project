/**
 * Simple spring physics implementation
 * Uses Hooke's law: F = -k * displacement
 */

/**
 * Update particle position using spring physics
 * @param {Object} particle - Particle with x, y, vx, vy, targetX, targetY
 * @param {number} dt - Delta time (defaults to 1/60 for 60fps)
 */
export function springStep(particle, dt = 1/60) {
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

/**
 * Apply force to particle (for mouse interaction)
 * @param {Object} particle - Particle object
 * @param {number} fx - Force x component
 * @param {number} fy - Force y component
 */
export function applyForce(particle, fx, fy) {
  particle.vx += fx;
  particle.vy += fy;
}

/**
 * Apply repulsion force from a point
 * @param {Object} particle - Particle object
 * @param {number} px - Point x coordinate
 * @param {number} py - Point y coordinate
 * @param {Object} options - Repulsion options
 */
export function applyRepulsion(particle, px, py, options = {}) {
  const { radius = 100, strength = 5 } = options;

  const dx = particle.x - px;
  const dy = particle.y - py;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= radius || distance === 0) return;

  // Quadratic falloff
  const force = Math.pow(1 - distance / radius, 2) * strength;
  const angle = Math.atan2(dy, dx);

  particle.vx += Math.cos(angle) * force;
  particle.vy += Math.sin(angle) * force;
}

/**
 * Check if particle is at rest (near target with low velocity)
 * @param {Object} particle - Particle object
 * @param {number} precision - Precision threshold
 * @returns {boolean} True if at rest
 */
export function isAtRest(particle, precision = 0.01) {
  const dx = particle.targetX - particle.x;
  const dy = particle.targetY - particle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);

  return distance < precision && speed < precision;
}
