// Utility Functions - utils.js
// Common utility functions used across the application

// Make all functions available globally
window.PortfolioUtils = {};

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
window.PortfolioUtils.debounce = function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution to once per specified time
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element to check
 * @param {number} threshold - Percentage of element that must be visible (0-1)
 * @returns {boolean} Whether element is in viewport
 */
export function isInViewport(element, threshold = 0.1) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const elementHeight = rect.bottom - rect.top;
  const elementWidth = rect.right - rect.left;
  
  return (
    rect.top <= window.innerHeight - (elementHeight * threshold) &&
    rect.bottom >= (elementHeight * threshold) &&
    rect.left <= window.innerWidth - (elementWidth * threshold) &&
    rect.right >= (elementWidth * threshold)
  );
}

/**
 * Smooth scroll to element with offset
 * @param {Element|string} target - Target element or selector
 * @param {number} offset - Offset from top in pixels
 * @param {number} duration - Animation duration in milliseconds
 */
export function smoothScrollTo(target, offset = 0, duration = 800) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  
  if (!element) return;
  
  const startPosition = window.pageYOffset;
  const targetPosition = element.getBoundingClientRect().top + startPosition - offset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();
  
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  function animation(currentTime) {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    
    window.scrollTo(0, startPosition + (distance * ease));
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  requestAnimationFrame(animation);
}

/**
 * Get element offset from document top
 * @param {Element} element - Target element
 * @returns {number} Offset in pixels
 */
export function getElementOffset(element) {
  if (!element) return 0;
  
  let offsetTop = 0;
  let currentElement = element;
  
  while (currentElement) {
    offsetTop += currentElement.offsetTop;
    currentElement = currentElement.offsetParent;
  }
  
  return offsetTop;
}

/**
 * Add class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class to add
 * @param {number} delay - Delay before adding class (ms)
 */
export function addClassWithDelay(element, className, delay = 0) {
  if (!element) return;
  
  setTimeout(() => {
    element.classList.add(className);
  }, delay);
}

/**
 * Remove class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class to remove
 * @param {number} delay - Delay before removing class (ms)
 */
export function removeClassWithDelay(element, className, delay = 0) {
  if (!element) return;
  
  setTimeout(() => {
    element.classList.remove(className);
  }, delay);
}

/**
 * Toggle class on element
 * @param {Element} element - Target element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add (true) or remove (false)
 */
export function toggleClass(element, className, force) {
  if (!element) return;
  
  if (typeof force !== 'undefined') {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * Wait for element to be loaded
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element>} Promise that resolves with element
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create and dispatch custom event
 * @param {string} eventName - Name of the event
 * @param {*} detail - Event detail data
 * @param {Element} target - Target element (default: document)
 */
export function dispatchCustomEvent(eventName, detail = null, target = document) {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  });
  
  target.dispatchEvent(event);
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-US') {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - Image selector
 * @param {Object} options - Intersection Observer options
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  const defaultOptions = {
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options
  };
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          // Create a new image to preload
          const newImg = new Image();
          newImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
          };
          newImg.onerror = () => {
            img.classList.add('error');
          };
          newImg.src = src;
        }
        
        observer.unobserve(img);
      }
    });
  }, defaultOptions);
  
  document.querySelectorAll(selector).forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Handle keyboard navigation
 * @param {Element} container - Container element
 * @param {string} itemSelector - Selector for focusable items
 * @param {boolean} wrap - Whether to wrap around at ends
 */
export function setupKeyboardNavigation(container, itemSelector, wrap = true) {
  if (!container) return;
  
  const items = container.querySelectorAll(itemSelector);
  let currentIndex = 0;
  
  container.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        currentIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex].focus();
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        currentIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        items[currentIndex].focus();
        break;
        
      case 'Home':
        e.preventDefault();
        currentIndex = 0;
        items[currentIndex].focus();
        break;
        
      case 'End':
        e.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex].focus();
        break;
    }
  });
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} Whether user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get scroll position
 * @returns {Object} Scroll position {x, y}
 */
export function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
}

/**
 * Lock body scroll
 */
export function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
}

/**
 * Unlock body scroll
 */
export function unlockBodyScroll() {
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

/**
 * Focus trap for modals and overlays
 * @param {Element} container - Container to trap focus within
 * @returns {Function} Function to remove focus trap
 */
export function trapFocus(container) {
  if (!container) return () => {};
  
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  function handleTabKey(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    if (e.key === 'Escape') {
      container.dispatchEvent(new CustomEvent('close'));
    }
  }
  
  document.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleTabKey);
  };
}