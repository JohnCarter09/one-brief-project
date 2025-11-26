/**
 * ambient.js - Main Orchestrator Module
 *
 * Coordinates noise-based contours and particle system for ambient header animation.
 * Performance-optimized with DPI awareness, reduced motion support, and batched rendering.
 *
 * @module ambient
 */

import { createFBM, generateNoiseField } from './noise.js';
import { marchingSquares, renderMultiContours } from './contours.js';
import { springStep, applyRepulsion } from './spring.js';
import {
  Particle,
  extractParticlePositions,
  initializeParticles,
  updateParticles,
  renderParticles,
  getSpringPreset,
  getReducedMotionConfig
} from './particles.js';

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
 * @property {string} particleSpringFeel - Spring preset: 'snappy', 'smooth', 'bouncy', 'heavy' (default: 'smooth')
 * @property {boolean} showContours - Whether to draw contour lines (default: true)
 * @property {boolean} showParticles - Whether to draw particles (default: true)
 * @property {string} backgroundColor - Canvas background color (default: '#0a0e1a')
 * @property {string} contourColor - Contour line color (default: 'rgba(255, 255, 255, 0.15)')
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
  particleSpringFeel: 'smooth',
  showContours: true,
  showParticles: true,
  backgroundColor: '#0a0e1a',
  contourColor: 'rgba(255, 255, 255, 0.15)',
  logoSvgUrl: null,
  useSamplingDensity: 2,
  alphaThreshold: 128,
  // Logo following behavior
  logoSpringStrength: 0.015,    // How quickly logo follows mouse
  logoFriction: 0.93,            // Logo movement damping
  enableLogoFollow: true,        // Toggle feature on/off
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
  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;

  // Core systems
  let fbm = null;
  let noiseField = null;
  let particles = [];
  let cols = 0;
  let rows = 0;

  // Mouse tracking
  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    isActive: false,
  };

  // Logo state (for smooth mouse following)
  const logoState = {
    centerX: 0,          // Current logo center position
    centerY: 0,
    targetCenterX: 0,    // Where logo wants to be (mouse or canvas center)
    targetCenterY: 0,
    velocityX: 0,        // Logo's own velocity for spring physics
    velocityY: 0,
    initialCenterX: 0,   // Original center position (canvas center)
    initialCenterY: 0,
    springStrength: config.logoSpringStrength,  // From config
    friction: config.logoFriction,              // From config
    isFollowingMouse: false
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
    // Create FBM noise generator with random seed
    fbm = createFBM();

    // Calculate grid dimensions for marching squares
    cols = Math.ceil(width / config.gridSize) + 1;
    rows = Math.ceil(height / config.gridSize) + 1;

    // Initialize noise field
    noiseField = new Float32Array(cols * rows);

    // Initialize logo center position
    initializeLogoState();

    // Initialize particles
    const physicsConfig = getSpringPreset(config.particleSpringFeel);

    if (config.logoSvgUrl) {
      // Load logo and extract particle positions
      loadLogoAndInitParticles(physicsConfig);
    } else {
      // Create particles at random positions
      const targetPositions = [];
      for (let i = 0; i < config.particleCount; i++) {
        targetPositions.push({
          x: Math.random() * width,
          y: Math.random() * height,
          color: 'rgba(255, 255, 255, 0.8)'
        });
      }
      particles = initializeParticles(targetPositions, { width, height }, physicsConfig);
    }
  }

  /**
   * Load logo SVG and extract particle target positions
   * @param {Object} physicsConfig - Spring physics parameters
   */
  async function loadLogoAndInitParticles(physicsConfig) {
    try {
      const response = await fetch(config.logoSvgUrl);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

      // Create off-screen canvas to render SVG
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = width;
      logoCanvas.height = height;
      const logoCtx = logoCanvas.getContext('2d');

      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        logoCtx.drawImage(img, 0, 0, width, height);

        // Extract particle positions from image
        const targetPositions = extractParticlePositions(
          img,
          config.useSamplingDensity,
          config.alphaThreshold
        );

        // Initialize particles at random positions, spring toward logo
        particles = initializeParticles(
          targetPositions.length > 0 ? targetPositions : createRandomPositions(),
          { width, height },
          physicsConfig
        );
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgText);
    } catch (error) {
      console.warn('Failed to load logo, using random particle positions:', error);
      // Fallback to random positions
      const targetPositions = createRandomPositions();
      particles = initializeParticles(targetPositions, { width, height }, physicsConfig);
    }
  }

  /**
   * Create random particle target positions as fallback
   * @returns {Array} Array of {x, y, color} objects
   */
  function createRandomPositions() {
    const positions = [];
    for (let i = 0; i < config.particleCount; i++) {
      positions.push({
        x: Math.random() * width,
        y: Math.random() * height,
        color: 'rgba(255, 255, 255, 0.8)'
      });
    }
    return positions;
  }

  /**
   * Initialize logo center position to canvas center
   */
  function initializeLogoState() {
    logoState.centerX = width / 2;
    logoState.centerY = height / 2;
    logoState.targetCenterX = width / 2;
    logoState.targetCenterY = height / 2;
    logoState.initialCenterX = width / 2;
    logoState.initialCenterY = height / 2;
    logoState.velocityX = 0;
    logoState.velocityY = 0;
    logoState.isFollowingMouse = false;
  }

  /**
   * Updates noise field for contour generation
   * @param {number} currentTime - Current animation time
   */
  function updateNoiseField(currentTime) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * config.gridSize;
        const y = j * config.gridSize;
        const index = j * cols + i;

        // Sample noise with time offset
        noiseField[index] = fbm(
          x * config.baseFrequency,
          y * config.baseFrequency,
          {
            octaves: config.octaves,
            frequency: 1,
            lacunarity: 2,
            persistence: 0.5
          }
        );
      }
    }
  }

  /**
   * Updates mouse position (simple follow, no spring)
   */
  function updateMouse() {
    // Mouse position is updated in real-time via event handlers
    // No smoothing needed - direct movement is more responsive
  }

  /**
   * Renders contour lines using marching squares
   */
  function renderContours() {
    if (!config.showContours) return;

    ctx.strokeStyle = config.contourColor;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    renderMultiContours(
      ctx,
      noiseField,
      cols,
      rows,
      config.gridSize,
      config.thresholds,
      config.contourColor,
      1
    );
  }

  /**
   * Update logo center position using spring physics
   */
  function updateLogoPosition() {
    // Calculate displacement from target
    const dx = logoState.targetCenterX - logoState.centerX;
    const dy = logoState.targetCenterY - logoState.centerY;

    // Apply spring force
    const forceX = dx * logoState.springStrength;
    const forceY = dy * logoState.springStrength;

    // Update velocity
    logoState.velocityX += forceX;
    logoState.velocityY += forceY;

    // Apply friction
    logoState.velocityX *= logoState.friction;
    logoState.velocityY *= logoState.friction;

    // Update position
    logoState.centerX += logoState.velocityX;
    logoState.centerY += logoState.velocityY;
  }

  /**
   * Update all particle target positions based on logo center
   */
  function updateParticleTargets() {
    for (const particle of particles) {
      // New target = current logo center + particle's offset from centroid
      particle.targetX = logoState.centerX + particle.offsetX;
      particle.targetY = logoState.centerY + particle.offsetY;
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
    updateMouse();
    updateNoiseField(time);

    // Update logo center position with spring physics
    updateLogoPosition();

    // Translate all particle targets based on logo center
    updateParticleTargets();

    // Build mouse state for particle interaction
    const mouseState = mouse.isActive ? {
      active: true,
      x: mouse.x,
      y: mouse.y,
      radius: config.mouseRadius,
      strength: config.mouseForce
    } : null;

    // Update particles with spring physics (they'll now spring toward moving targets)
    updateParticles(particles, time, mouseState);

    // Render
    renderFrame();

    // Continue animation loop
    animationId = requestAnimationFrame(animate);
  }

  /**
   * Renders a complete frame
   */
  function renderFrame() {
    // Clear canvas (transparent to show background image)
    ctx.clearRect(0, 0, width, height);

    // Draw contours first (background layer)
    renderContours();

    // Draw particles on top
    if (config.showParticles && particles.length > 0) {
      renderParticles(ctx, particles);
    }
  }

  /**
   * Handles window resize with debouncing
   */
  let resizeTimeout = null;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupCanvas();

      // Recalculate logo initial center position
      logoState.initialCenterX = width / 2;
      logoState.initialCenterY = height / 2;

      // If not following mouse, reset to new center
      if (!logoState.isFollowingMouse) {
        logoState.centerX = width / 2;
        logoState.centerY = height / 2;
        logoState.targetCenterX = width / 2;
        logoState.targetCenterY = height / 2;
      }

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
    mouse.x = mouse.targetX;
    mouse.y = mouse.targetY;
    mouse.isActive = true;

    // Set logo target to follow mouse
    logoState.targetCenterX = mouse.x;
    logoState.targetCenterY = mouse.y;
    logoState.isFollowingMouse = true;
  }

  /**
   * Handles mouse leave
   */
  function handleMouseLeave() {
    mouse.isActive = false;
    mouse.targetX = -1000;
    mouse.targetY = -1000;
    mouse.x = -1000;
    mouse.y = -1000;

    // Keep logo at current position (don't snap back to center)
    logoState.isFollowingMouse = false;
  }

  /**
   * Handles mouse entering interactive element (button, link)
   */
  function handleInteractiveEnter() {
    // Fade out particles smoothly
    for (const particle of particles) {
      particle.targetOpacity = 0;
    }
  }

  /**
   * Handles mouse leaving interactive element
   */
  function handleInteractiveLeave() {
    // Fade particles back in
    for (const particle of particles) {
      particle.targetOpacity = 1.0;
    }

    // Return to following mouse if mouse is still in canvas
    if (mouse.isActive) {
      logoState.targetCenterX = mouse.x;
      logoState.targetCenterY = mouse.y;
      logoState.isFollowingMouse = true;
    }
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
    mouse.x = mouse.targetX;
    mouse.y = mouse.targetY;
    mouse.isActive = true;

    // Set logo target to follow touch
    logoState.targetCenterX = mouse.x;
    logoState.targetCenterY = mouse.y;
    logoState.isFollowingMouse = true;
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

    // Add hover listeners to interactive elements to hide particles
    const interactiveElements = document.querySelectorAll('.header-content a, .header-content button');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleInteractiveEnter);
      element.addEventListener('mouseleave', handleInteractiveLeave);
    });

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

    // Update logo spring parameters if changed
    if (newConfig.logoSpringStrength !== undefined) {
      logoState.springStrength = newConfig.logoSpringStrength;
    }
    if (newConfig.logoFriction !== undefined) {
      logoState.friction = newConfig.logoFriction;
    }

    // Reinitialize if structural parameters changed
    if (newConfig.gridSize || newConfig.particleCount || newConfig.particleSpringFeel) {
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

    // Remove interactive element listeners
    const interactiveElements = document.querySelectorAll('.header-content a, .header-content button');
    interactiveElements.forEach(element => {
      element.removeEventListener('mouseenter', handleInteractiveEnter);
      element.removeEventListener('mouseleave', handleInteractiveLeave);
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clear resources
    particles = [];
    noiseField = null;
    fbm = null;
  }

  /**
   * Gets current performance stats
   * @returns {Object} Performance statistics
   */
  function getStats() {
    return {
      fps,
      particleCount: particles.length,
      gridCells: cols * rows,
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
    const { particleCount, timeSpeed, mouseRadius } = controlElements.sliders;

    if (particleCount) {
      particleCount.addEventListener('input', (e) => {
        controller.updateConfig({ particleCount: parseInt(e.target.value, 10) });
      });
    }

    if (timeSpeed) {
      timeSpeed.addEventListener('input', (e) => {
        controller.updateConfig({ timeSpeed: parseFloat(e.target.value) });
      });
    }

    if (mouseRadius) {
      mouseRadius.addEventListener('input', (e) => {
        controller.updateConfig({ mouseRadius: parseFloat(e.target.value) });
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
