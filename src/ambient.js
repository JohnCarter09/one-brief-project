/**
 * ambient.js - Main Orchestrator Module
 *
 * Coordinates noise-based contours and particle system for ambient header animation.
 * Performance-optimized with DPI awareness, reduced motion support, and batched rendering.
 *
 * @module ambient
 */

import { createNoise3D } from './noise.js';
import { MarchingSquares } from './contours.js';
import { ParticleSystem } from './particles.js';
import { Spring } from './spring.js';

/**
 * Default configuration for ambient animation
 * @typedef {Object} AmbientConfig
 * @property {number} gridSize - Grid cell size in pixels (default: 40)
 * @property {number} octaves - Number of noise octaves for fbm (default: 3)
 * @property {number} baseFrequency - Base noise frequency (default: 0.008)
 * @property {number} timeSpeed - Animation speed multiplier (default: 0.0003)
 * @property {number[]} thresholds - Isoline threshold values (default: [-0.5, -0.2, 0.1, 0.4, 0.7])
 * @property {number} particleCount - Number of particles (default: 500)
 * @property {number} mouseRadius - Mouse influence radius in pixels (default: 100)
 * @property {number} mouseForce - Mouse repulsion force strength (default: 0.5)
 * @property {number} particleSpeed - Base particle movement speed (default: 0.5)
 * @property {boolean} showContours - Whether to draw contour lines (default: true)
 * @property {boolean} showParticles - Whether to draw particles (default: true)
 * @property {string} backgroundColor - Canvas background color (default: '#0a0e1a')
 * @property {string} contourColor - Contour line color (default: 'rgba(255, 255, 255, 0.15)')
 * @property {string} particleColor - Particle color (default: 'rgba(255, 255, 255, 0.6)')
 */
const DEFAULT_CONFIG = {
  gridSize: 40,
  octaves: 3,
  baseFrequency: 0.008,
  timeSpeed: 0.0003,
  thresholds: [-0.5, -0.2, 0.1, 0.4, 0.7],
  particleCount: 500,
  mouseRadius: 100,
  mouseForce: 0.5,
  particleSpeed: 0.5,
  showContours: true,
  showParticles: true,
  backgroundColor: '#0a0e1a',
  contourColor: 'rgba(255, 255, 255, 0.15)',
  particleColor: 'rgba(255, 255, 255, 0.6)',
};

/**
 * Creates and manages the ambient header animation
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Partial<AmbientConfig>} options - Configuration overrides
 * @returns {Object} Controller object with play/pause/destroy methods
 */
export function createAmbientHeader(canvas, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  // State management
  let isRunning = false;
  let isPaused = false;
  let animationId = null;
  let time = 0;
  let lastFrameTime = 0;
  let fps = 0;
  let frameCount = 0;
  let lastFpsUpdate = 0;

  // Canvas and rendering context
  const ctx = canvas.getContext('2d', { alpha: false });
  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;

  // Core systems
  let noise3D = null;
  let marchingSquares = null;
  let particleSystem = null;
  let mouseSpring = null;

  // Mouse tracking
  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    isActive: false,
  };

  // Accessibility: Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Sets up canvas with proper DPI scaling
   */
  function setupCanvas() {
    dpr = window.devicePixelRatio || 1;

    // Get CSS dimensions
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    // Set canvas buffer size (accounting for DPI)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Scale context to match DPI
    ctx.scale(dpr, dpr);

    // Set rendering optimizations
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Initializes all animation systems
   */
  function initializeSystems() {
    // Create noise generator
    noise3D = createNoise3D();

    // Calculate grid dimensions
    const cols = Math.ceil(width / config.gridSize) + 1;
    const rows = Math.ceil(height / config.gridSize) + 1;

    // Initialize marching squares for contour generation
    marchingSquares = new MarchingSquares(cols, rows, config.gridSize);

    // Initialize particle system
    particleSystem = new ParticleSystem(config.particleCount, width, height);

    // Initialize mouse tracking with spring physics
    mouseSpring = new Spring(0.15, 0.8); // stiffness, damping
  }

  /**
   * Fractional Brownian Motion - layers multiple octaves of noise
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate (time)
   * @returns {number} Combined noise value [-1, 1]
   */
  function fbm(x, y, z) {
    let value = 0;
    let amplitude = 1;
    let frequency = config.baseFrequency;
    let maxValue = 0;

    for (let i = 0; i < config.octaves; i++) {
      value += amplitude * noise3D(x * frequency, y * frequency, z);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  /**
   * Updates noise field for contour generation
   * @param {number} currentTime - Current animation time
   */
  function updateNoiseField(currentTime) {
    const field = marchingSquares.field;
    const cols = marchingSquares.cols;
    const rows = marchingSquares.rows;
    const gridSize = config.gridSize;

    // Performance: Batch field updates
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * gridSize;
        const y = j * gridSize;
        field[j * cols + i] = fbm(x, y, currentTime);
      }
    }
  }

  /**
   * Updates mouse position with spring physics
   * @param {number} dt - Delta time in seconds
   */
  function updateMouse(dt) {
    if (!mouse.isActive) return;

    // Apply spring physics for smooth mouse following
    const springResult = mouseSpring.update(
      mouse.x,
      mouse.targetX,
      dt
    );

    mouse.x = springResult.position;

    const springResultY = mouseSpring.update(
      mouse.y,
      mouse.targetY,
      dt
    );

    mouse.y = springResultY.position;
  }

  /**
   * Renders contour lines
   */
  function renderContours() {
    if (!config.showContours) return;

    ctx.strokeStyle = config.contourColor;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw contours at each threshold level
    for (const threshold of config.thresholds) {
      const segments = marchingSquares.march(threshold);

      if (segments.length === 0) continue;

      // Batch all segments into a single path for performance
      ctx.beginPath();
      for (const segment of segments) {
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
      }
      ctx.stroke();
    }
  }

  /**
   * Renders particle system
   */
  function renderParticles() {
    if (!config.showParticles) return;

    const particles = particleSystem.particles;

    // Draw particles as circles
    ctx.fillStyle = config.particleColor;

    for (const particle of particles) {
      // Calculate particle size based on noise influence
      const noiseValue = fbm(particle.x, particle.y, time * 0.5);
      const size = 1 + noiseValue * 0.8;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Main animation loop with fixed timestep
   * @param {DOMHighResTimeStamp} currentTime - Current timestamp from RAF
   */
  function animate(currentTime) {
    if (!isRunning || isPaused) return;

    // Calculate delta time (cap at 100ms to prevent spiral of death)
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTime;

    // Update FPS counter
    frameCount++;
    if (currentTime - lastFpsUpdate > 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsUpdate = currentTime;
    }

    // Update animation time
    const timeStep = prefersReducedMotion ? 0 : config.timeSpeed;
    time += deltaTime * timeStep;

    // Update systems
    updateMouse(deltaTime);
    updateNoiseField(time);

    // Update particles with noise-based flow field
    particleSystem.update(
      deltaTime * config.particleSpeed,
      (x, y) => {
        // Create flow field from noise gradients
        const epsilon = 5;
        const noiseHere = fbm(x, y, time);
        const noiseRight = fbm(x + epsilon, y, time);
        const noiseUp = fbm(x, y + epsilon, time);

        // Calculate gradient (curl noise for more interesting flow)
        const dx = (noiseRight - noiseHere) / epsilon;
        const dy = (noiseUp - noiseHere) / epsilon;

        // Perpendicular vector for curl
        return { dx: -dy, dy: dx };
      },
      mouse.isActive ? {
        x: mouse.x,
        y: mouse.y,
        radius: config.mouseRadius,
        force: config.mouseForce,
      } : null
    );

    // Render
    renderFrame();

    // Continue animation loop
    animationId = requestAnimationFrame(animate);
  }

  /**
   * Renders a complete frame
   */
  function renderFrame() {
    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw contours first (background layer)
    renderContours();

    // Draw particles on top
    renderParticles();
  }

  /**
   * Handles window resize with debouncing
   */
  let resizeTimeout = null;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupCanvas();
      initializeSystems();
    }, 250);
  }

  /**
   * Handles mouse movement
   * @param {MouseEvent} event - Mouse event
   */
  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.targetX = event.clientX - rect.left;
    mouse.targetY = event.clientY - rect.top;
    mouse.isActive = true;
  }

  /**
   * Handles mouse leave
   */
  function handleMouseLeave() {
    mouse.isActive = false;
    mouse.targetX = -1000;
    mouse.targetY = -1000;
  }

  /**
   * Handles touch move for mobile support
   * @param {TouchEvent} event - Touch event
   */
  function handleTouchMove(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    mouse.targetX = touch.clientX - rect.left;
    mouse.targetY = touch.clientY - rect.top;
    mouse.isActive = true;
  }

  /**
   * Handles touch end
   */
  function handleTouchEnd() {
    handleMouseLeave();
  }

  /**
   * Starts the animation
   */
  function play() {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;
    lastFrameTime = performance.now();
    lastFpsUpdate = lastFrameTime;

    setupCanvas();
    initializeSystems();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    animationId = requestAnimationFrame(animate);
  }

  /**
   * Pauses the animation
   */
  function pause() {
    isPaused = true;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * Resumes the animation
   */
  function resume() {
    if (!isRunning || !isPaused) return;

    isPaused = false;
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(animate);
  }

  /**
   * Toggles pause state
   */
  function togglePause() {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }

  /**
   * Updates configuration at runtime
   * @param {Partial<AmbientConfig>} newConfig - New configuration values
   */
  function updateConfig(newConfig) {
    Object.assign(config, newConfig);

    // Reinitialize if structural parameters changed
    if (newConfig.gridSize || newConfig.particleCount) {
      initializeSystems();
    }
  }

  /**
   * Destroys the animation and cleans up resources
   */
  function destroy() {
    isRunning = false;

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Gets current performance stats
   * @returns {Object} Performance statistics
   */
  function getStats() {
    return {
      fps,
      particleCount: config.particleCount,
      gridCells: marchingSquares ? marchingSquares.cols * marchingSquares.rows : 0,
      isPaused,
      prefersReducedMotion,
    };
  }

  // Auto-start unless user prefers reduced motion
  if (!prefersReducedMotion) {
    play();
  }

  // Return controller API
  return {
    play,
    pause,
    resume,
    togglePause,
    destroy,
    updateConfig,
    getStats,
    get isRunning() { return isRunning; },
    get isPaused() { return isPaused; },
    get config() { return { ...config }; },
  };
}

/**
 * Convenience function to initialize ambient header with demo controls
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object} controlElements - DOM elements for controls
 * @param {HTMLElement} controlElements.playPauseButton - Play/pause button
 * @param {HTMLElement} controlElements.statsDisplay - Stats display element
 * @param {Object} controlElements.sliders - Slider elements
 * @returns {Object} Controller object
 */
export function createAmbientHeaderWithControls(canvas, controlElements = {}) {
  const controller = createAmbientHeader(canvas);

  // Wire up play/pause button
  if (controlElements.playPauseButton) {
    controlElements.playPauseButton.addEventListener('click', () => {
      controller.togglePause();
      controlElements.playPauseButton.textContent = controller.isPaused ? 'Play' : 'Pause';
      controlElements.playPauseButton.setAttribute('aria-pressed', !controller.isPaused);
    });

    // Set initial state
    controlElements.playPauseButton.setAttribute('aria-pressed', !controller.isPaused);
    controlElements.playPauseButton.setAttribute('aria-label', 'Pause animation');
  }

  // Wire up sliders
  if (controlElements.sliders) {
    const { particleCount, particleSpeed, mouseRadius, timeSpeed } = controlElements.sliders;

    if (particleCount) {
      particleCount.addEventListener('input', (e) => {
        controller.updateConfig({ particleCount: parseInt(e.target.value, 10) });
      });
    }

    if (particleSpeed) {
      particleSpeed.addEventListener('input', (e) => {
        controller.updateConfig({ particleSpeed: parseFloat(e.target.value) });
      });
    }

    if (mouseRadius) {
      mouseRadius.addEventListener('input', (e) => {
        controller.updateConfig({ mouseRadius: parseFloat(e.target.value) });
      });
    }

    if (timeSpeed) {
      timeSpeed.addEventListener('input', (e) => {
        controller.updateConfig({ timeSpeed: parseFloat(e.target.value) });
      });
    }
  }

  // Update stats display
  if (controlElements.statsDisplay) {
    setInterval(() => {
      const stats = controller.getStats();
      controlElements.statsDisplay.textContent = `FPS: ${stats.fps} | Particles: ${stats.particleCount} | Grid: ${stats.gridCells} cells`;
    }, 1000);
  }

  return controller;
}
