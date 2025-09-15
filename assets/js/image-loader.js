/**
 * ImageLoader - Progressive image loading with fallbacks
 * Implements the image loading strategy from the design document
 */

class ImageLoader {
  constructor() {
    this.loadingImages = new Set();
    this.observers = new Map();
    this.loadingQueue = new Map();
    this.failedImages = new Set();
    this.loadedImages = new Set();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Store global reference for mutation observer
    window.imageLoaderInstance = this;
    
    this.init();
  }

  init() {
    // Initialize intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.setupLazyLoading();
    }
    
    // Replace external images with local ones
    this.replaceExternalImages();
    
    // Setup error handling for all images
    this.setupErrorHandling();
  }

  setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Add loading state immediately when entering viewport
          const container = this.ensureImageContainer(img);
          container.classList.add('image-loading');
          
          this.loadImageProgressive(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px 0px', // Increased for better UX
      threshold: 0.01
    });

    // Observe all images with data-src or flagged for lazy loading
    document.querySelectorAll('img[data-src], img.lazy-load').forEach(img => {
      imageObserver.observe(img);
    });
    
    // Also observe images without explicit lazy loading attributes but in cards
    document.querySelectorAll('.artwork-card img, .collection-card img, .about img').forEach(img => {
      if (!img.complete && !img.dataset.observed) {
        img.dataset.observed = 'true';
        imageObserver.observe(img);
      }
    });

    this.observers.set('lazy', imageObserver);
  }

  setupErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);
  }

  replaceExternalImages() {
    // Progressive loading format hierarchy: WebP → JPG → SVG fallback
    const imageMap = {
      // Gallery images with format cascade
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e': {
        webp: 'assets/images/gallery/webp/artwork-001.webp',
        jpg: 'assets/images/gallery/jpg/artwork-001.jpg', 
        fallback: 'assets/images/gallery/svg/artwork-001.svg'
      },
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176': {
        webp: 'assets/images/gallery/webp/artwork-002.webp',
        jpg: 'assets/images/gallery/jpg/artwork-002.jpg',
        fallback: 'assets/images/gallery/svg/artwork-002.svg'
      },
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96': {
        webp: 'assets/images/gallery/webp/artwork-003.webp',
        jpg: 'assets/images/gallery/jpg/artwork-003.jpg',
        fallback: 'assets/images/gallery/svg/artwork-003.svg'
      },
      'https://images.unsplash.com/photo-1520637836862-4d197d17c86a': {
        webp: 'assets/images/gallery/webp/artwork-001.webp',
        jpg: 'assets/images/gallery/jpg/artwork-001.jpg',
        fallback: 'assets/images/gallery/svg/artwork-001.svg'
      },
      'https://images.unsplash.com/photo-1551550029-12c7dd043ba8': {
        webp: 'assets/images/gallery/webp/artwork-003.webp',
        jpg: 'assets/images/gallery/jpg/artwork-003.jpg',
        fallback: 'assets/images/gallery/svg/artwork-003.svg'
      },
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2': {
        webp: 'assets/images/gallery/webp/artwork-002.webp',
        jpg: 'assets/images/gallery/jpg/artwork-002.jpg',
        fallback: 'assets/images/gallery/svg/artwork-002.svg'
      },
      
      // Collection covers
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center': {
        webp: 'assets/images/collections/fantasy-cover.webp',
        jpg: 'assets/images/collections/fantasy-cover.jpg',
        fallback: 'assets/images/collections/fantasy-cover.svg'
      },
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center': {
        webp: 'assets/images/collections/scifi-cover.webp', 
        jpg: 'assets/images/collections/scifi-cover.jpg',
        fallback: 'assets/images/collections/scifi-cover.svg'
      },
      'https://images.unsplash.com/photo-1551550029-12c7dd043ba8?w=400&h=300&fit=crop&crop=center': {
        webp: 'assets/images/collections/character-cover.webp',
        jpg: 'assets/images/collections/character-cover.jpg', 
        fallback: 'assets/images/collections/character-cover.svg'
      },
      
      // About section
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face': {
        webp: 'assets/images/about/maya-portrait.webp',
        jpg: 'assets/images/about/maya-portrait.jpg',
        fallback: 'assets/images/about/maya-portrait.svg'
      }
    };

    // Replace external image sources with progressive loading
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src;
      
      // Check for exact matches
      if (imageMap[src]) {
        this.replaceImageWithProgressive(img, imageMap[src]);
        return;
      }
      
      // Check for partial matches (for URLs with parameters)
      for (const [externalUrl, localFormats] of Object.entries(imageMap)) {
        if (src && src.includes(externalUrl.split('?')[0])) {
          this.replaceImageWithProgressive(img, localFormats);
          break;
        }
      }
    });
  }

  replaceImageWithProgressive(img, formats) {
    const container = this.ensureImageContainer(img);
    
    // Store format cascade in data attributes
    if (typeof formats === 'object' && formats.webp) {
      img.dataset.webp = formats.webp;
      img.dataset.jpg = formats.jpg;
      img.dataset.fallback = formats.fallback;
    } else {
      // Legacy single format support
      img.dataset.fallback = formats;
    }
    
    // Add loading state with shimmer animation
    container.classList.add('loading', 'image-loading');
    img.classList.add('loading');
    
    this.loadImageProgressive(img);
  }

  ensureImageContainer(img) {
    if (img.parentElement.classList.contains('image-container')) {
      return img.parentElement;
    }
    
    const container = document.createElement('div');
    container.className = 'image-container loading';
    img.parentNode.insertBefore(container, img);
    container.appendChild(img);
    
    return container;
  }

  loadImageProgressive(img) {
    if (this.loadingImages.has(img)) return;
    
    this.loadingImages.add(img);
    const container = this.ensureImageContainer(img);
    
    // Progressive format loading: WebP → JPG → SVG
    const formats = [
      img.dataset.webp,
      img.dataset.jpg, 
      img.dataset.fallback,
      img.dataset.src,
      img.src
    ].filter(Boolean);
    
    this.tryLoadFormats(img, container, formats, 0);
  }
  
  tryLoadFormats(img, container, formats, index) {
    if (index >= formats.length) {
      this.handleImageError(img);
      return;
    }
    
    const currentFormat = formats[index];
    const testImg = new Image();
    
    testImg.onload = () => {
      img.src = currentFormat;
      this.markImageLoaded(img, container);
      this.loadingImages.delete(img);
      this.loadedImages.add(img);
    };
    
    testImg.onerror = () => {
      // Try next format
      this.tryLoadFormats(img, container, formats, index + 1);
    };
    
    testImg.src = currentFormat;
  }
  
  loadImage(img) {
    // Backwards compatibility method
    this.loadImageProgressive(img);
  }

  handleImageError(img) {
    const container = this.ensureImageContainer(img);
    const originalSrc = img.dataset.src || img.src;
    
    // Track failed images
    this.failedImages.add(originalSrc);
    
    // Check retry attempts
    const retryCount = this.retryAttempts.get(originalSrc) || 0;
    
    if (retryCount < this.maxRetries) {
      // Retry with delay
      this.retryAttempts.set(originalSrc, retryCount + 1);
      setTimeout(() => {
        this.loadImageProgressive(img);
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      return;
    }
    
    // Final error state
    img.classList.remove('loading');
    img.classList.add('error');
    container.classList.remove('loading', 'image-loading');
    container.classList.add('error');
    
    // Set context-aware placeholder
    const placeholderSrc = this.getContextualPlaceholder(img);
    img.src = placeholderSrc;
    img.alt = 'Image temporarily unavailable';
    
    this.loadingImages.delete(img);
    console.warn(`Failed to load image after ${this.maxRetries} attempts:`, originalSrc);
  }
  
  getContextualPlaceholder(img) {
    // Return appropriate placeholder based on context
    if (img.closest('.collection-card')) {
      return 'assets/images/placeholders/collection-placeholder.svg';
    } else if (img.closest('.artwork-card')) {
      return 'assets/images/placeholders/artwork-placeholder.svg';
    } else if (img.closest('.about')) {
      return 'assets/images/placeholders/avatar-placeholder.svg';
    }
    return 'assets/images/placeholders/image-error.svg';
  }

  // Public methods for external use
  
  loadImageWithFallback(img, primarySrc, fallbackSrc) {
    const container = this.ensureImageContainer(img);
    container.classList.add('loading');
    
    const testImg = new Image();
    testImg.onload = () => {
      img.src = primarySrc;
      this.markImageLoaded(img, container);
    };
    
    testImg.onerror = () => {
      if (fallbackSrc) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          img.src = fallbackSrc;
          this.markImageLoaded(img, container);
        };
        fallbackImg.onerror = () => {
          this.handleImageError(img);
        };
        fallbackImg.src = fallbackSrc;
      } else {
        this.handleImageError(img);
      }
    };
    
    testImg.src = primarySrc;
  }

  markImageLoaded(img, container) {
    img.classList.remove('loading');
    img.classList.add('loaded');
    container.classList.remove('loading', 'image-loading');
    container.classList.add('loaded');
    
    // Trigger fade-in animation
    setTimeout(() => {
      img.classList.add('fade-in');
    }, 50);
  }

  refreshImages() {
    // Reset state
    this.loadingImages.clear();
    this.failedImages.clear();
    this.retryAttempts.clear();
    
    // Re-scan and handle all images
    this.replaceExternalImages();
    this.setupErrorHandling();
  }
  
  // Performance monitoring methods
  getLoadingStats() {
    return {
      loading: this.loadingImages.size,
      loaded: this.loadedImages.size,
      failed: this.failedImages.size,
      queued: this.loadingQueue.size
    };
  }
  
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  preloadImages(srcArray) {
    return Promise.allSettled(
      srcArray.map(src => this.preloadImage(src))
    );
  }

  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new ImageLoader();
        ImageLoader.setupPerformanceMonitoring();
      });
    } else {
      new ImageLoader();
      ImageLoader.setupPerformanceMonitoring();
    }
  }
  
  static setupPerformanceMonitoring() {
    // Monitor performance if supported
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource' && entry.name.includes('images/')) {
            console.log(`Image loaded: ${entry.name} in ${entry.responseEnd - entry.startTime}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
    
    // Setup mutation observer for dynamic content
    if ('MutationObserver' in window) {
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const images = node.tagName === 'IMG' ? [node] : 
                           node.querySelectorAll ? node.querySelectorAll('img') : [];
              
              images.forEach(img => {
                if (window.imageLoaderInstance) {
                  window.imageLoaderInstance.observeNewImage(img);
                }
              });
            }
          });
        });
      });
      
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  observeNewImage(img) {
    const lazyObserver = this.observers.get('lazy');
    if (lazyObserver && !img.dataset.observed) {
      img.dataset.observed = 'true';
      lazyObserver.observe(img);
      
      // Check if it matches our image map patterns
      this.replaceExternalImages();
    }
  }
}

// Auto-initialize
ImageLoader.init();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageLoader;
} else if (typeof window !== 'undefined') {
  window.ImageLoader = ImageLoader;
}