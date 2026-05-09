/**
 * Mobile Optimization Module - Touch events, swipe gestures, mobile-specific features
 * Handles: swipe navigation, touch optimizations, responsive behaviors, vibration
 */

const Mobile = (() => {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  const MIN_SWIPE_DISTANCE = 50;

  /**
   * Initialize mobile features
   */
  const init = () => {
    if (Utils.getDeviceType() !== 'desktop') {
      setupTouchHandlers();
      optimizeForMobile();
      setupGestureHandlers();
      setupVibration();
    }
  };

  /**
   * Setup touch event handlers
   */
  const setupTouchHandlers = () => {
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });
  };

  /**
   * Handle touch start
   */
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  };

  /**
   * Handle touch end - detect swipe
   */
  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  };

  /**
   * Detect and handle swipe gestures
   */
  const handleSwipe = () => {
    const dx = touchStartX - touchEndX;
    const dy = touchStartY - touchEndY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Horizontal swipe
    if (adx > ady && adx > MIN_SWIPE_DISTANCE) {
      if (dx > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
    // Vertical swipe
    else if (ady > adx && ady > MIN_SWIPE_DISTANCE) {
      if (dy > 0) {
        onSwipeUp();
      } else {
        onSwipeDown();
      }
    }
  };

  /**
   * Swipe left handler - next item/question
   */
  const onSwipeLeft = () => {
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
      vibrate(50);
    }
  };

  /**
   * Swipe right handler - previous item/question
   */
  const onSwipeRight = () => {
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.click();
      vibrate(50);
    }
  };

  /**
   * Swipe up handler - show more info
   */
  const onSwipeUp = () => {
    const helpBtn = document.querySelector('[aria-label="Show help"]');
    if (helpBtn) {
      helpBtn.click();
      vibrate(30);
    }
  };

  /**
   * Swipe down handler - hide info
   */
  const onSwipeDown = () => {
    const closeBtn = document.querySelector('[aria-label*="Close"]');
    if (closeBtn) {
      closeBtn.click();
      vibrate(30);
    }
  };

  /**
   * Prevent default touch scrolling on specific elements
   */
  const preventTouchScroll = (e) => {
    if (e.target.closest('.no-touch-scroll')) {
      e.preventDefault();
    }
  };

  /**
   * Setup gesture handlers for pinch zoom
   */
  const setupGestureHandlers = () => {
    let lastDistance = 0;

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastDistance > 0) {
          if (distance > lastDistance + 10) {
            onPinchOut();
          } else if (distance < lastDistance - 10) {
            onPinchIn();
          }
        }
        lastDistance = distance;
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      lastDistance = 0;
    });
  };

  /**
   * Handle pinch out (zoom in)
   */
  const onPinchOut = () => {
    const fontSizeToggle = document.querySelector('[data-font-size="large"]');
    if (fontSizeToggle) {
      fontSizeToggle.click();
    }
  };

  /**
   * Handle pinch in (zoom out)
   */
  const onPinchIn = () => {
    const fontSizeToggle = document.querySelector('[data-font-size="normal"]');
    if (fontSizeToggle) {
      fontSizeToggle.click();
    }
  };

  /**
   * Setup vibration feedback
   */
  const setupVibration = () => {
    // Check if vibration is supported
    if ('vibrate' in navigator) {
      // Vibrate on important actions
      document.addEventListener('click', (e) => {
        if (e.target.closest('button[data-vibrate]')) {
          vibrate([50, 30, 50]);
        }
      });
    }
  };

  /**
   * Trigger vibration
   */
  const vibrate = (pattern = 50) => {
    if (navigator.vibrate && Storage.get(Storage.KEYS.SETTINGS)?.vibrationEnabled) {
      navigator.vibrate(pattern);
    }
  };

  /**
   * Optimize layout for mobile
   */
  const optimizeForMobile = () => {
    const viewport = Utils.getViewport();

    // Add mobile class
    document.documentElement.classList.add('is-mobile');

    // Optimize button sizes for touch
    document.querySelectorAll('button').forEach(btn => {
      const height = Math.max(44, btn.offsetHeight);
      btn.style.minHeight = height + 'px';
      btn.style.padding = (height / 2) + 'px 1rem';
    });

    // Make inputs larger on mobile
    document.querySelectorAll('input, textarea, select').forEach(input => {
      input.style.minHeight = '44px';
      input.style.fontSize = '16px'; // Prevent zoom on iOS
      input.style.padding = '8px 12px';
    });

    // Add safe area padding for notched devices
    const hasNotch = CSS.supports('padding-top', 'max(0px)');
    if (hasNotch) {
      document.body.style.paddingTop = 'max(0px, env(safe-area-inset-top))';
      document.body.style.paddingBottom = 'max(0px, env(safe-area-inset-bottom))';
      document.body.style.paddingLeft = 'max(0px, env(safe-area-inset-left))';
      document.body.style.paddingRight = 'max(0px, env(safe-area-inset-right))';
    }
  };

  /**
   * Setup pull-to-refresh
   */
  const setupPullToRefresh = (callback) => {
    let initialY = 0;
    let currentY = 0;
    const pullRefreshElement = document.querySelector('.pull-refresh');

    if (!pullRefreshElement) return;

    pullRefreshElement.addEventListener('touchstart', (e) => {
      initialY = e.touches[0].clientY;
    });

    pullRefreshElement.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - initialY;

      if (diff > 0 && window.scrollY === 0) {
        pullRefreshElement.style.transform = `translateY(${diff}px)`;
        if (diff > 60) {
          pullRefreshElement.classList.add('ready');
        } else {
          pullRefreshElement.classList.remove('ready');
        }
      }
    });

    pullRefreshElement.addEventListener('touchend', () => {
      const diff = currentY - initialY;
      if (diff > 60) {
        callback?.();
        vibrate([50, 30, 50]);
      }
      pullRefreshElement.style.transform = '';
      pullRefreshElement.classList.remove('ready');
    });
  };

  /**
   * Lock scroll on mobile (for modals)
   */
  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
  };

  /**
   * Unlock scroll on mobile
   */
  const unlockScroll = () => {
    document.body.style.overflow = '';
  };

  /**
   * Get safe area insets (for notched devices)
   */
  const getSafeAreaInsets = () => {
    const top = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-top')
        .replace('px', '')
    ) || 0;
    const bottom = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-bottom')
        .replace('px', '')
    ) || 0;
    const left = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-left')
        .replace('px', '')
    ) || 0;
    const right = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-right')
        .replace('px', '')
    ) || 0;

    return { top, bottom, left, right };
  };

  return {
    init,
    vibrate,
    setupPullToRefresh,
    lockScroll,
    unlockScroll,
    getSafeAreaInsets,
  };
})();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Mobile.init());
} else {
  Mobile.init();
}
