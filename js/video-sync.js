/* ============================================
   VIDEO SYNCHRONIZATION CONTROLLER
   PRD Sections 21, 22 - Most Important Feature
   Scroll-driven video playback with smooth
   interpolation and crossfade transitions.
   ============================================ */

import { lerp, clamp, throttle } from './utils.js';

class VideoSyncController {
  constructor() {
    /** @type {HTMLVideoElement[]} */
    this.videos = [];
    /** @type {number} Current active video index */
    this.activeIndex = 0;
    /** @type {number} Target seek time for interpolation */
    this.targetTime = 0;
    /** @type {number} Current interpolated time */
    this.currentTime = 0;
    /** @type {number} RAF id */
    this.rafId = null;
    /** @type {boolean} Whether the controller is initialized */
    this.initialized = false;
    /** @type {number} Interpolation smoothing factor */
    this.smoothFactor = 0.08;

    // Video-to-section mapping (PRD Section 21)
    // Video 1: Hero + About + Education + Experience + Leadership
    // Video 2: Projects + Skills
    // Video 3: Achievements + Contact
    this.sectionMap = [
      { video: 0, sections: ['hero', 'about', 'education', 'experience', 'leadership'] },
      { video: 1, sections: ['projects', 'skills'] },
      { video: 2, sections: ['achievements', 'contact'] }
    ];
  }

  /**
   * Initialize the video sync system
   */
  init() {
    this.videos = Array.from(document.querySelectorAll('.video-layer__video'));

    if (this.videos.length === 0) {
      console.warn('[VideoSync] No video elements found.');
      return;
    }

    // Configure each video
    this.videos.forEach((video, index) => {
      video.muted = true;
      video.playsInline = true;
      video.loop = false;
      video.preload = index === 0 ? 'auto' : 'metadata';
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');

      // Error handling with graceful fallback
      video.addEventListener('error', () => {
        console.warn(`[VideoSync] Video ${index + 1} failed to load.`);
        video.style.display = 'none';
      });

      // When metadata loads, we can start seeking
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = 0;
      });
    });

    // Activate the first video
    this.setActiveVideo(0, true);

    // Start the render loop
    this.startRenderLoop();
    this.initialized = true;
  }

  /**
   * Set the active video with crossfade transition
   * @param {number} index - Video index (0-2)
   * @param {boolean} immediate - Skip crossfade
   */
  setActiveVideo(index, immediate = false) {
    if (index === this.activeIndex && !immediate) return;
    if (index < 0 || index >= this.videos.length) return;

    const previous = this.activeIndex;
    this.activeIndex = index;

    this.videos.forEach((video, i) => {
      if (i === index) {
        video.classList.add('active');
        // Preload the now-active video
        if (video.preload !== 'auto') {
          video.preload = 'auto';
        }
      } else {
        video.classList.remove('active');
        // Pause inactive videos to save resources
        try { video.pause(); } catch (e) { /* silent */ }
      }
    });

    // Reset time tracking for new video
    this.currentTime = 0;
    this.targetTime = 0;
  }

  /**
   * Update based on scroll position
   * Called from the scroll controller
   * @param {number} scrollProgress - Overall page scroll (0-1)
   * @param {string} activeSectionId - Currently active section ID
   */
  onScroll(scrollProgress, activeSectionId) {
    // Determine which video should be active
    let targetVideoIndex = 0;
    for (let i = 0; i < this.sectionMap.length; i++) {
      if (this.sectionMap[i].sections.includes(activeSectionId)) {
        targetVideoIndex = this.sectionMap[i].video;
        break;
      }
    }

    // Switch video if needed
    if (targetVideoIndex !== this.activeIndex) {
      this.setActiveVideo(targetVideoIndex);
    }

    // Calculate target time within the active video
    const activeVideo = this.videos[this.activeIndex];
    if (!activeVideo || !activeVideo.duration || isNaN(activeVideo.duration)) return;

    // Calculate section-local progress for the active video group
    const videoGroup = this.sectionMap[this.activeIndex];
    const sectionProgress = this.getSectionGroupProgress(videoGroup.sections);

    // Map progress to video time
    this.targetTime = clamp(sectionProgress * activeVideo.duration, 0, activeVideo.duration - 0.1);
  }

  /**
   * Get the combined scroll progress across a group of sections
   * @param {string[]} sectionIds - Array of section IDs
   * @returns {number} Progress 0-1
   */
  getSectionGroupProgress(sectionIds) {
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return 0;

    const firstSection = sections[0];
    const lastSection = sections[sections.length - 1];

    const groupTop = firstSection.offsetTop;
    const groupBottom = lastSection.offsetTop + lastSection.offsetHeight;
    const groupHeight = groupBottom - groupTop;

    if (groupHeight <= 0) return 0;

    const scrollY = window.scrollY || window.pageYOffset;
    const progress = (scrollY - groupTop) / (groupHeight - window.innerHeight);

    return clamp(progress, 0, 1);
  }

  /**
   * Render loop using requestAnimationFrame
   * Smoothly interpolates video seek position
   */
  startRenderLoop() {
    const render = () => {
      this.rafId = requestAnimationFrame(render);

      const activeVideo = this.videos[this.activeIndex];
      if (!activeVideo || !activeVideo.duration || isNaN(activeVideo.duration)) return;

      // Smooth interpolation to avoid jerky seeking
      this.currentTime = lerp(this.currentTime, this.targetTime, this.smoothFactor);

      // Only seek if the difference is significant (avoid micro-seeks)
      const timeDiff = Math.abs(activeVideo.currentTime - this.currentTime);
      if (timeDiff > 0.03) {
        try {
          activeVideo.currentTime = this.currentTime;
        } catch (e) {
          // Ignore seek errors (can happen if video isn't loaded yet)
        }
      }
    };

    this.rafId = requestAnimationFrame(render);
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopRenderLoop();
    this.videos.forEach(video => {
      try { video.pause(); } catch (e) { /* silent */ }
    });
  }
}

// Singleton instance
const videoSync = new VideoSyncController();
export default videoSync;
