/* ============================================
   UTILITY FUNCTIONS
   Reusable helpers: throttle, debounce, lerp, etc.
   ============================================ */

/**
 * Throttle function - limits execution rate
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Minimum milliseconds between calls
 * @returns {Function}
 */
export function throttle(fn, delay) {
  let lastCall = 0;
  let timer = null;
  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function - delays execution until idle
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Milliseconds to wait
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Linear interpolation
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Progress (0-1)
 * @returns {number}
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range min
 * @param {number} inMax - Input range max
 * @param {number} outMin - Output range min
 * @param {number} outMax - Output range max
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return clamp(
    ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin,
    Math.min(outMin, outMax),
    Math.max(outMin, outMax)
  );
}

/**
 * Check if element is in viewport
 * @param {Element} el - DOM element
 * @param {number} threshold - Percentage visible (0-1)
 * @returns {boolean}
 */
export function isInViewport(el, threshold = 0.1) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const visible = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  return visible > rect.height * threshold;
}

/**
 * Get scroll percentage of the page
 * @returns {number} - 0 to 1
 */
export function getScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  return docHeight > 0 ? clamp(scrollTop / docHeight, 0, 1) : 0;
}

/**
 * Detect if the user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if the device is touch-primary
 * @returns {boolean}
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detect mobile viewport
 * @returns {boolean}
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Smooth counter animation
 * @param {Element} el - Element to animate
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 * @param {string} suffix - Text to append (e.g., '+')
 */
export function animateCounter(el, target, duration = 1200, suffix = '') {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = clamp(elapsed / duration, 0, 1);
    // Ease out quad
    const easedProgress = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(start + (target - start) * easedProgress);
    el.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Create a DOM element with attributes
 * @param {string} tag - HTML tag
 * @param {Object} attrs - Attributes
 * @param {string} text - Text content
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) {
        el.dataset[dk] = dv;
      }
    } else {
      el.setAttribute(key, value);
    }
  }
  if (text) el.textContent = text;
  return el;
}
