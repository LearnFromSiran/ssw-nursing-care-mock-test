/**
 * Utilities Module - Common functions, error handling, helpers
 */

const Utils = (() => {
  /**
   * Safe query selector with error handling
   */
  const $ = (selector, parent = document) => {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  };

  /**
   * Safe query selector all
   */
  const $$ = (selector, parent = document) => {
    try {
      return Array.from(parent.querySelectorAll(selector));
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  };

  /**
   * Debounce function
   */
  const debounce = (func, delay = 300) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  /**
   * Throttle function
   */
  const throttle = (func, limit = 300) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  /**
   * Request animation frame helper
   */
  const raf = (callback) => {
    return requestAnimationFrame(callback);
  };

  /**
   * Format date nicely
   */
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return d.toLocaleDateString();
  };

  /**
   * Format time duration (ms to readable)
   */
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  /**
   * Calculate percentage
   */
  const percentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  /**
   * Clamp number between min and max
   */
  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  /**
   * Shuffle array
   */
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /**
   * Group array by key
   */
  const groupBy = (array, key) => {
    return array.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  };

  /**
   * Deep clone object
   */
  const deepClone = (obj) => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Clone failed:', error);
      return obj;
    }
  };

  /**
   * Check if online
   */
  const isOnline = () => navigator.onLine;

  /**
   * Get device type
   */
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile|android|iphone|ipad|windows phone/i.test(ua)) {
      if (/ipad/i.test(ua)) return 'tablet';
      return 'mobile';
    }
    return 'desktop';
  };

  /**
   * Get viewport info
   */
  const getViewport = () => ({
    width: Math.max(document.documentElement.clientWidth, window.innerWidth),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight),
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
  });

  /**
   * Safe JSON parse
   */
  const parseJSON = (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('JSON parse error:', error);
      return fallback;
    }
  };

  /**
   * Validate email
   */
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Highlight text in search results
   */
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  /**
   * Scroll to element smoothly
   */
  const scrollTo = (element, offset = 0) => {
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  /**
   * Create element helper
   */
  const createElement = (tag, options = {}) => {
    const el = document.createElement(tag);
    if (options.class) el.className = options.class;
    if (options.id) el.id = options.id;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    }
    return el;
  };

  /**
   * Add event listener with cleanup
   */
  const on = (element, event, handler, options) => {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  };

  /**
   * Delegate event listener
   */
  const delegate = (parent, event, selector, handler) => {
    parent.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target) handler.call(target, e);
    });
  };

  return {
    $,
    $$,
    debounce,
    throttle,
    raf,
    formatDate,
    formatDuration,
    percentage,
    clamp,
    shuffle,
    groupBy,
    deepClone,
    isOnline,
    getDeviceType,
    getViewport,
    parseJSON,
    validateEmail,
    highlightText,
    scrollTo,
    createElement,
    on,
    delegate,
  };
})();
