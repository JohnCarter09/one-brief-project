import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.3/+esm';

/**
 * Creates a Fractal Brownian Motion (FBM) noise function
 * @param {number} seed - Random seed for noise generation
 * @returns {Function} FBM noise function
 */
export function createFBM(seed = Math.random()) {
  const noise2D = createNoise2D(() => seed);

  return function fbm(x, y, options = {}) {
    const {
      octaves = 3,
      frequency = 1,
      lacunarity = 2,
      persistence = 0.5
    } = options;

    let value = 0;
    let freq = frequency;
    let amp = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += noise2D(x * freq, y * freq) * amp;
      maxValue += amp;
      freq *= lacunarity;
      amp *= persistence;
    }

    return value / maxValue;
  };
}

/**
 * Generates a 2D noise field
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {Function} fbm - FBM noise function
 * @param {number} time - Time offset for animation
 * @param {Object} options - Noise options
 * @returns {Float32Array} Noise field values
 */
export function generateNoiseField(cols, rows, fbm, time, options = {}) {
  const {
    baseFrequency = 0.008,
    octaves = 3
  } = options;

  const field = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      field[index] = fbm(
        col * baseFrequency + time,
        row * baseFrequency,
        { octaves }
      );
    }
  }

  return field;
}
