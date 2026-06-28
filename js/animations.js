/* ============================================
   ANIMATIONS CONTROLLER
   Manages reveal animations, counters, timeline,
   particles, and parallax effects.
   PRD Sections 23, 24, 25, 35
   ============================================ */

import { prefersReducedMotion, isMobile, animateCounter } from './utils.js';

class AnimationController {
  constructor() {
    /** @type {IntersectionObserver} Reveal observer */
    this.revealObserver = null;
    /** @type {IntersectionObserver} Counter observer */
    this.counterObserver = null;
    /** @type {Set<Element>} Already-animated counters */
    this.animatedCounters = new Set();
    /** @type {Set<Element>} Already-animated timelines */
    this.animatedTimelines = new Set();
    /** @type {number} Particle canvas RAF ID */
    this.particleRafId = null;
    /** @type {Object[]} Particles array */
    this.particles = [];
    /** @type {CanvasRenderingContext2D} */
    this.ctx = null;
    /** @type {HTMLCanvasElement} */
    this.canvas = null;
  }

  /**
   * Initialize all animation systems
   */
  init() {
    if (prefersReducedMotion()) {
      // Immediately reveal everything for reduced motion preference
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    this.setupRevealObserver();
    this.setupCounterObserver();
    this.setupTimelineObserver();
    this.setupParticles();
  }

  /**
   * Set up IntersectionObserver for reveal animations
   */
  setupRevealObserver() {
    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Only animate once
          this.revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
      this.revealObserver.observe(el);
    });
  }

  /**
   * Set up counter animations that trigger when visible
   */
  setupCounterObserver() {
    this.counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedCounters.has(entry.target)) {
          this.animatedCounters.add(entry.target);
          const target = parseInt(entry.target.dataset.count, 10);
          const suffix = entry.target.dataset.suffix || '';
          animateCounter(entry.target, target, 1200, suffix);
          this.counterObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    document.querySelectorAll('[data-count]').forEach(el => {
      el.textContent = '0' + (el.dataset.suffix || '');
      this.counterObserver.observe(el);
    });
  }

  /**
   * Set up timeline grow animation
   */
  setupTimelineObserver() {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedTimelines.has(entry.target)) {
          this.animatedTimelines.add(entry.target);
          entry.target.classList.add('animated');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    document.querySelectorAll('.timeline').forEach(el => {
      timelineObserver.observe(el);
    });
  }

  /**
   * Set up particle system on canvas
   */
  setupParticles() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Determine particle count based on device
    const count = isMobile() ? 25 : 50;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    window.addEventListener('resize', () => this.resizeCanvas());
    this.renderParticles();
  }

  /**
   * Resize canvas to match window
   */
  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Render particle animation loop
   */
  renderParticles() {
    if (!this.ctx || !this.canvas) return;

    const render = () => {
      this.particleRafId = requestAnimationFrame(render);

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
        this.ctx.fill();
      });

      // Draw connections between close particles
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `rgba(0, 229, 255, ${0.05 * (1 - dist / 150)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }
    };

    this.particleRafId = requestAnimationFrame(render);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.revealObserver) this.revealObserver.disconnect();
    if (this.counterObserver) this.counterObserver.disconnect();
    if (this.particleRafId) cancelAnimationFrame(this.particleRafId);
  }
}

/**
 * 3D tilt effect for cards (standalone export)
 * @param {Element} card - Card element
 */
export function applyTiltEffect(card) {
  if (isMobile() || prefersReducedMotion()) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  });
}

const animationController = new AnimationController();
export default animationController;
