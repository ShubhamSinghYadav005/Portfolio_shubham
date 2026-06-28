/* ============================================
   SCROLL CONTROLLER
   Manages scroll progress, section detection,
   navigation updates, and video sync triggers.
   ============================================ */

import { throttle, debounce, getScrollProgress, clamp } from './utils.js';
import videoSync from './video-sync.js';

class ScrollController {
  constructor() {
    /** @type {Element[]} All sections */
    this.sections = [];
    /** @type {string} Current active section ID */
    this.activeSection = '';
    /** @type {number} Last scroll position */
    this.lastScrollY = 0;
    /** @type {boolean} Scroll direction (true = down) */
    this.scrollingDown = true;
    /** @type {Element} Scroll progress bar */
    this.progressBar = null;
    /** @type {Element} Navigation element */
    this.nav = null;
    /** @type {IntersectionObserver} Section observer */
    this.sectionObserver = null;
  }

  /**
   * Initialize the scroll controller
   */
  init() {
    this.sections = Array.from(document.querySelectorAll('section[id]'));
    this.progressBar = document.querySelector('.scroll-progress');
    this.nav = document.querySelector('.nav');

    if (this.sections.length === 0) return;

    // Set up IntersectionObserver for section detection
    this.setupSectionObserver();

    // Scroll event for progress bar and video sync
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });

    // Debounced resize handler
    window.addEventListener('resize', debounce(() => {
      this.onResize();
    }, 200));

    // Smooth scroll for nav links
    this.setupSmoothScrollLinks();

    // Initial update
    this.updateScrollProgress();
    this.detectActiveSection();
  }

  /**
   * Set up IntersectionObserver for section visibility
   */
  setupSectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0, 0.1, 0.25, 0.5]
    };

    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
          const id = entry.target.id;
          if (id && id !== this.activeSection) {
            this.activeSection = id;
            this.updateNavHighlight(id);
            // Update video sync with new active section
            const scrollProgress = getScrollProgress();
            videoSync.onScroll(scrollProgress, id);
          }
        }
      });
    }, options);

    this.sections.forEach(section => {
      this.sectionObserver.observe(section);
    });
  }

  /**
   * Scroll event handler
   */
  onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;

    // Detect scroll direction
    this.scrollingDown = scrollY > this.lastScrollY;
    this.lastScrollY = scrollY;

    // Update scroll progress bar
    this.updateScrollProgress();

    // Nav show/hide based on scroll direction
    this.updateNavVisibility(scrollY);

    // Update video sync
    const scrollProgress = getScrollProgress();
    videoSync.onScroll(scrollProgress, this.activeSection);
  }

  /**
   * Update the scroll progress bar width
   */
  updateScrollProgress() {
    if (!this.progressBar) return;
    const progress = getScrollProgress();
    this.progressBar.style.width = `${progress * 100}%`;
  }

  /**
   * Show/hide navigation based on scroll direction
   * PRD: Hide while scrolling down, reappear while scrolling up
   * @param {number} scrollY - Current scroll position
   */
  updateNavVisibility(scrollY) {
    if (!this.nav) return;

    if (scrollY < 100) {
      // Near top: show nav without scrolled-down class
      this.nav.classList.remove('scrolled-down');
      return;
    }

    if (this.scrollingDown && scrollY > 200) {
      this.nav.classList.add('scrolled-down');
    } else {
      this.nav.classList.remove('scrolled-down');
    }
  }

  /**
   * Highlight the active nav link
   * @param {string} sectionId - Active section ID
   */
  updateNavHighlight(sectionId) {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${sectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Detect the currently active section manually
   */
  detectActiveSection() {
    const scrollY = window.scrollY + window.innerHeight * 0.4;
    let current = '';

    this.sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.id;
      }
    });

    if (current && current !== this.activeSection) {
      this.activeSection = current;
      this.updateNavHighlight(current);
    }
  }

  /**
   * Set up smooth scrolling for anchor links
   */
  setupSmoothScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });

          // Close mobile menu if open
          const navLinks = document.querySelector('.nav__links');
          const hamburger = document.querySelector('.nav__hamburger');
          if (navLinks) navLinks.classList.remove('open');
          if (hamburger) hamburger.classList.remove('open');
        }
      });
    });
  }

  /**
   * Handle window resize
   */
  onResize() {
    this.detectActiveSection();
    this.updateScrollProgress();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.sectionObserver) {
      this.sectionObserver.disconnect();
    }
  }
}

const scrollController = new ScrollController();
export default scrollController;
