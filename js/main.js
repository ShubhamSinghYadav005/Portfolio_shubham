/* ============================================
   MAIN.JS - Application Entry Point
   Orchestrates all controllers, loader sequence,
   navigation, and initialization.
   PRD Section 26 - Loading Experience
   ============================================ */

import scrollController from './scroll.js';
import videoSync from './video-sync.js';
import animationController, { applyTiltEffect } from './animations.js';
import cursorController from './cursor.js';

/**
 * AI Boot Sequence Loader
 * PRD: Show loading messages, then reveal hero
 */
function runBootSequence() {
  return new Promise((resolve) => {
    const loader = document.getElementById('loader');
    const lines = document.querySelectorAll('.loader__line');
    const bar = document.querySelector('.loader__bar');
    const messages = [
      'Initializing System...',
      'Loading Assets...',
      'Synchronizing Environment...',
      'Rendering Interface...',
      'Portfolio Ready.'
    ];

    let currentLine = 0;
    const totalDuration = 2400; // Max ~2.4s to keep under 3s
    const interval = totalDuration / messages.length;

    function showNextLine() {
      if (currentLine >= lines.length) {
        // All lines shown, resolve after a brief pause
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.classList.add('loaded');
          resolve();
        }, 300);
        return;
      }

      const line = lines[currentLine];
      line.classList.add('active');

      // Update progress bar
      const progress = ((currentLine + 1) / messages.length) * 100;
      if (bar) bar.style.width = `${progress}%`;

      // Mark previous lines as done
      if (currentLine > 0) {
        lines[currentLine - 1].classList.add('done');
      }

      currentLine++;
      setTimeout(showNextLine, interval);
    }

    // Start the sequence
    setTimeout(showNextLine, 200);
  });
}

/**
 * Initialize navigation behavior
 */
function initNavigation() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks = document.querySelector('.nav__links');

  if (!nav) return;

  // Show nav after loader
  nav.classList.add('visible');

  // Hamburger toggle for mobile
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }
}

/**
 * Initialize 3D tilt effects on cards
 */
function initTiltCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    applyTiltEffect(card);
  });
}

/**
 * Initialize magnetic button effects
 */
function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/**
 * Main application initialization
 */
async function init() {
  try {
    // Run boot sequence first
    await runBootSequence();

    // Initialize all controllers
    videoSync.init();
    scrollController.init();
    animationController.init();
    cursorController.init();

    // Additional initializations
    initNavigation();
    initTiltCards();
    initMagneticButtons();

    // Log success
    console.log('%c[Portfolio] All systems initialized.', 'color: #00E5FF; font-weight: bold;');
  } catch (error) {
    console.error('[Portfolio] Initialization error:', error);
    // Still show content even if something fails
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    document.body.classList.add('loaded');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
