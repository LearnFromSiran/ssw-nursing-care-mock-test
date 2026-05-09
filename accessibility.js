/**
 * Accessibility Module - Enhances keyboard navigation, ARIA labels, screen reader support
 * Manages: keyboard shortcuts, focus management, ARIA attributes, announcements
 */

const A11y = (() => {
  // Store for live region announcements
  let liveRegion = null;
  let focusTracker = [];
  const keyboardShortcuts = {};

  /**
   * Initialize accessibility features
   */
  const init = () => {
    createLiveRegion();
    setupKeyboardShortcuts();
    setupFocusManagement();
    enhanceSemanticStructure();
    setupSkipLink();
  };

  /**
   * Create live region for screen reader announcements
   */
  const createLiveRegion = () => {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  };

  /**
   * Announce message to screen readers
   */
  const announce = (message, priority = 'polite') => {
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  };

  /**
   * Setup keyboard shortcuts
   */
  const setupKeyboardShortcuts = () => {
    const shortcuts = {
      // Navigation
      'h': () => switchPage('home'),
      't': () => switchPage('learning'),
      'v': () => switchPage('vocab'),
      'c': () => switchPage('materials'),
      'p': () => switchPage('profile'),
      
      // Quiz controls
      'n': () => document.getElementById('nextBtn')?.click(),
      'r': () => document.getElementById('reviewBtn')?.click(),
      
      // Toggle modes
      'm': () => toggleMobileMenu(),
      'd': () => toggleDarkMode(),
      '?': () => showKeyboardHelp(),
    };

    document.addEventListener('keydown', (e) => {
      // Don't trigger in input fields
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      // Check for Alt+key shortcut
      if (e.altKey && shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()]();
        announce(`Navigated to ${e.key.toUpperCase()} section`);
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'e':
            e.preventDefault();
            downloadExport();
            announce('Data export initiated');
            break;
          case 'j':
            e.preventDefault();
            jumpToSearch();
            announce('Jumped to search');
            break;
        }
      }
    });
  };

  /**
   * Setup focus management and focus visible styles
   */
  const setupFocusManagement = () => {
    // Add focus-visible class for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-focus');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-focus');
    });

    // Track focusable elements
    document.addEventListener('focusin', (e) => {
      const focusable = e.target;
      if (isFocusable(focusable)) {
        focusTracker = [focusable, ...focusTracker.slice(0, 4)];
        updateFocusIndicator(focusable);
      }
    });
  };

  /**
   * Check if element is focusable
   */
  const isFocusable = (el) => {
    return ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', '[role="button"]'].some(
      selector => el.matches(selector)
    );
  };

  /**
   * Update visual focus indicator for announcements
   */
  const updateFocusIndicator = (element) => {
    const label = element.getAttribute('aria-label') || 
                  element.textContent?.trim()?.slice(0, 50) || 
                  element.id;
    if (label) {
      announce(`Focused: ${label}`);
    }
  };

  /**
   * Enhance semantic HTML structure
   */
  const enhanceSemanticStructure = () => {
    // Ensure all nav items have proper roles
    document.querySelectorAll('[data-page]').forEach(el => {
      if (!el.getAttribute('role')) {
        el.setAttribute('role', 'tab');
      }
      if (!el.getAttribute('aria-selected')) {
        el.setAttribute('aria-selected', 'false');
      }
    });

    // Enhance buttons
    document.querySelectorAll('button').forEach((btn, idx) => {
      if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.className || `Button ${idx}`);
      }
    });

    // Enhance form inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
      if (!input.getAttribute('aria-label') && input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('placeholder')) {
          input.setAttribute('aria-label', input.name || input.id);
        }
      }
    });

    // Add landmarks
    const main = document.querySelector('main') || document.querySelector('.app');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }
  };

  /**
   * Setup skip to main content link
   */
  const setupSkipLink = () => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  };

  /**
   * Update page navigation aria-selected
   */
  const updatePageSelection = (pageName) => {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.setAttribute('aria-selected', el.dataset.page === pageName);
    });
  };

  /**
   * Show keyboard shortcuts help
   */
  const showKeyboardHelp = () => {
    const help = `
      Keyboard Shortcuts:
      Alt+H - Home page
      Alt+T - Test/Learning
      Alt+V - Vocabulary
      Alt+C - Chapters
      Alt+P - Profile
      Alt+N - Next question
      Alt+? - This help
      Ctrl+E - Export data
      Ctrl+J - Jump to search
    `;
    announce(help, 'assertive');
    
    // Show visual dialog too
    showModal('Keyboard Shortcuts', help);
  };

  /**
   * Set page heading for screen readers
   */
  const setPageHeading = (title) => {
    const h1 = document.querySelector('h1') || document.createElement('h1');
    if (!document.querySelector('h1')) {
      h1.id = 'main-content';
      h1.style.position = 'absolute';
      h1.style.left = '-10000px';
      document.body.insertBefore(h1, document.body.firstChild);
    }
    h1.textContent = title;
    announce(`Page: ${title}`);
  };

  /**
   * Enhance form field accessibility
   */
  const enhanceFormField = (input, label) => {
    if (label) {
      input.setAttribute('aria-label', label);
      input.setAttribute('aria-describedby', `${input.id}-help`);
    }
    
    // Add error handling
    input.addEventListener('invalid', (e) => {
      e.preventDefault();
      announce(`Error: ${input.validationMessage}`, 'assertive');
      input.setAttribute('aria-invalid', 'true');
    });

    input.addEventListener('input', () => {
      if (input.validity.valid) {
        input.setAttribute('aria-invalid', 'false');
      }
    });
  };

  /**
   * Make dropdown keyboard accessible
   */
  const enhanceDropdown = (select) => {
    select.setAttribute('role', 'listbox');
    
    select.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select.click();
      }
    });
  };

  /**
   * Add proper heading hierarchy
   */
  const ensureHeadingHierarchy = (container) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName[1]);
      
      // Check for proper hierarchy
      if (index > 0 && currentLevel > previousLevel + 1) {
        console.warn(`Heading hierarchy skip: ${heading.tagName} after h${previousLevel}`);
      }
      previousLevel = currentLevel;
    });
  };

  return {
    init,
    announce,
    updatePageSelection,
    setPageHeading,
    enhanceFormField,
    enhanceDropdown,
    ensureHeadingHierarchy,
    showKeyboardHelp,
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => A11y.init());
} else {
  A11y.init();
}
