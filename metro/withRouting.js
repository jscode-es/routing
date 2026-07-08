'use strict';

// JS plano (no TS): metro.config.js de la app consumidora lo ejecuta con Node
// directamente, sin paso de build previo.

/**
 * @template {{ transformer?: Record<string, unknown> }} T
 * @param {T} config
 * @returns {T}
 */
function withRouting(config) {
  return {
    ...config,
    transformer: {
      ...config.transformer,
      unstable_allowRequireContext: true,
    },
  };
}

module.exports = { withRouting };
