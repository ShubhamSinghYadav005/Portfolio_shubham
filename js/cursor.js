/* ============================================
   CUSTOM CURSOR CONTROLLER
   Desktop-only custom cursor with hover effects
   PRD Section 14 UI Components
   ============================================ */

import { isTouchDevice, lerp } from './utils.js';

class CursorController {
  constructor() {
    /** @type {Element} Outer cursor ring */
    this.cursor = null;
    /** @type {Element} Inner cursor dot */
    this.dot = null;
    /** @type {{ x: number, y: number }} Mouse position */
    this.mouse = { x: 0, y: 0 };
    /** @type {{ x: number, y: number }} Cursor position (lagged) */
    this.pos = { x: 0, y: 0 };
    /** @type {number} RAF id */
    this.rafId = null;
    /** @type {boolean} Whether cursor is active */
    this.active = false;
  }

  /**
   * Initialize the custom cursor (desktop only)
   */
  init() {
    // Don't init on touch devices
    if (isTouchDevice()) return;

    this.cursor = document.querySelector('.cursor');
    this.dot = document.querySelector('.cursor-dot');

    if (!this.cursor || !this.dot) return;

    this.active = true;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Add hover effect to interactive elements
    const hoverTargets = document.querySelectorAll(
      'a, button, .btn, .glass-card, .nav__link, .skill-item, .contact-link, .tech-tag, .nav__hamburger'
    );

    hoverTargets.forEach(target => {
      target.addEventListener('mouseenter', () => {
        this.cursor.classList.add('hover');
      });
      target.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('hover');
      });
    });

    // Start render loop
    this.render();
  }

  /**
   * Render loop - smooth cursor follow with lerp
   */
  render() {
    if (!this.active) return;

    this.pos.x = lerp(this.pos.x, this.mouse.x, 0.15);
    this.pos.y = lerp(this.pos.y, this.mouse.y, 0.15);

    if (this.cursor) {
      this.cursor.style.left = `${this.pos.x}px`;
      this.cursor.style.top = `${this.pos.y}px`;
    }

    if (this.dot) {
      this.dot.style.left = `${this.mouse.x}px`;
      this.dot.style.top = `${this.mouse.y}px`;
    }

    this.rafId = requestAnimationFrame(() => this.render());
  }

  /**
   * Cleanup
   */
  destroy() {
    this.active = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

const cursorController = new CursorController();
export default cursorController;
