// Main Application - app.js
// Application initialization and coordination

import { 
  debounce, 
  throttle, 
  isInViewport, 
  lazyLoadImages, 
  prefersReducedMotion,
  dispatchCustomEvent 
} from './utils.js';

class PortfolioApp {
  constructor() {
    this.isInitialized = false;
    this.components = {};
    this.observers = {};
    this.animationQueue = [];
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    this.setupAnimationObserver();
    this.setupCollections();
    this.setupScrollEffects();
    this.setupPerformanceOptimizations();
    this.setupErrorHandling();
    this.handleInitialLoad();
    
    this.isInitialized = true;
    
    // Dispatch app ready event
    dispatchCustomEvent('appReady', { timestamp: Date.now() });
  }
  
  setupAnimationObserver() {
    // Create intersection observer for scroll animations
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.observers.animation = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          this.observers.animation.unobserve(entry.target);
        }
      });
    }, options);
    
    // Observe elements that should animate on scroll
    this.observeAnimationElements();
  }
  
  observeAnimationElements() {
    const animatedElements = document.querySelectorAll(`
      .section-header,
      .artwork-card,
      .collection-card,
      .about__content,
      .contact__card,
      .hero__content
    `);
    
    animatedElements.forEach(element => {
      if (!prefersReducedMotion()) {
        this.observers.animation.observe(element);
      } else {
        // Immediately show elements if reduced motion is preferred
        element.style.opacity = '1';
        element.style.transform = 'none';
      }
    });
  }
  
  animateElement(element) {
    if (prefersReducedMotion()) return;
    
    // Add animation class based on element type
    if (element.classList.contains('section-header')) {
      element.classList.add('fade-in');
    } else if (element.classList.contains('artwork-card') || element.classList.contains('collection-card')) {
      // Stagger card animations
      const delay = Array.from(element.parentNode.children).indexOf(element) * 100;
      setTimeout(() => {
        element.classList.add('slide-up');
      }, delay);
    } else {
      element.classList.add('fade-in');
    }
  }
  
  setupCollections() {
    // Sample collections data
    const collectionsData = [
      {
        id: 'fantasy-series',
        title: 'Fantasy Illustrations',
        description: 'Epic fantasy scenes featuring magical creatures, mystical landscapes, and heroic characters.',
        coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
        artworkCount: 12,
        year: 2024
      },
      {
        id: 'sci-fi-series',
        title: 'Sci-Fi Concepts',
        description: 'Futuristic technology, alien worlds, and cyberpunk cityscapes.',
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center',
        artworkCount: 8,
        year: 2024
      },
      {
        id: 'character-portfolio',
        title: 'Character Designs',
        description: 'Original character concepts for games, books, and personal projects.',
        coverImage: 'https://images.unsplash.com/photo-1551550029-12c7dd043ba8?w=400&h=300&fit=crop&crop=center',
        artworkCount: 15,
        year: 2023
      }
    ];
    
    this.renderCollections(collectionsData);
  }
  
  renderCollections(collections) {
    const collectionsGrid = document.querySelector('.collections__grid');
    if (!collectionsGrid) return;
    
    collectionsGrid.innerHTML = '';
    
    collections.forEach((collection, index) => {
      const collectionCard = this.createCollectionCard(collection);
      collectionsGrid.appendChild(collectionCard);
      
      // Animate card appearance
      setTimeout(() => {
        collectionCard.classList.add('fade-in');
      }, index * 150);
    });
  }
  
  createCollectionCard(collection) {
    const card = document.createElement('article');
    card.className = 'collection-card';
    card.setAttribute('data-collection-id', collection.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${collection.title} collection`);
    
    card.innerHTML = `
      <img 
        class="collection-card__image" 
        src="${collection.coverImage}" 
        alt="${collection.title} cover image"
        loading="lazy"
      />
      <div class="collection-card__content">
        <h3 class="collection-card__title">${collection.title}</h3>
        <p class="collection-card__description">${collection.description}</p>
        <div class="collection-card__meta">
          <span class="collection-card__count">${collection.artworkCount} artworks</span>
          <span class="collection-card__year">${collection.year}</span>
        </div>
      </div>
    `;
    
    // Add interaction events
    card.addEventListener('click', () => {
      this.viewCollection(collection.id);
    });
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.viewCollection(collection.id);
      }
    });
    
    return card;
  }
  
  viewCollection(collectionId) {
    // Filter gallery by collection and scroll to gallery section
    dispatchCustomEvent('filterGallery', { filter: collectionId });
    
    // Scroll to gallery section
    const gallerySection = document.querySelector('#gallery');
    if (gallerySection) {
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
      gallerySection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Adjust for header
      setTimeout(() => {
        window.scrollBy(0, -headerHeight);
      }, 100);
    }
  }
  
  setupScrollEffects() {
    let lastScrollY = window.pageYOffset;
    
    const handleScroll = throttle(() => {
      const currentScrollY = window.pageYOffset;
      
      // Parallax effect for hero section
      this.updateParallaxEffect(currentScrollY);
      
      // Update scroll indicator
      this.updateScrollIndicator(currentScrollY);
      
      lastScrollY = currentScrollY;
    }, 16); // ~60fps
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  updateParallaxEffect(scrollY) {
    if (prefersReducedMotion()) return;
    
    const heroImage = document.querySelector('.hero__image');
    if (heroImage) {
      const rate = scrollY * 0.5;
      heroImage.style.transform = `translateY(${rate}px)`;
    }
  }
  
  updateScrollIndicator(scrollY) {
    const scrollIndicator = document.querySelector('.hero__scroll-indicator');
    if (scrollIndicator) {
      const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
      const opacity = Math.max(0, 1 - (scrollY / (heroHeight * 0.5)));
      scrollIndicator.style.opacity = opacity;
    }
  }
  
  setupPerformanceOptimizations() {
    // Lazy load images
    lazyLoadImages('img[data-src]', {
      rootMargin: '100px 0px',
      threshold: 0.01
    });
    
    // Preload critical images
    this.preloadCriticalImages();
    
    // Setup service worker for caching (if available)
    this.setupServiceWorker();
    
    // Monitor performance
    this.setupPerformanceMonitoring();
  }
  
  preloadCriticalImages() {
    // Preload hero background and first few gallery images
    const criticalImages = [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=900&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=900&fit=crop&crop=center'
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }
  
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }
  
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would use the web-vitals library in a real implementation
      console.log('Performance monitoring enabled');
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry.duration);
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observer not supported
      }
    }
  }
  
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleError(event.error);
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason);
    });
  }
  
  handleError(error) {
    // In a production environment, you would send this to an error tracking service
    console.error('Application error:', error);
    
    // Show user-friendly error message if needed
    if (error.name === 'NetworkError') {
      this.showErrorMessage('Network connection issue. Please check your internet connection.');
    }
  }
  
  showErrorMessage(message) {
    // Create or update error message element
    let errorElement = document.querySelector('#app-error-message');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'app-error-message';
      errorElement.className = 'app-error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
  
  handleInitialLoad() {
    // Handle any URL hash on initial load
    const hash = window.location.hash;
    if (hash) {
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
    
    // Set initial theme based on user preference
    this.setupThemeHandling();
    
    // Initialize smooth scrolling
    this.setupSmoothScrolling();
  }
  
  setupThemeHandling() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('portfolio-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portfolio-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }
  
  setupSmoothScrolling() {
    // Enhance smooth scrolling for all anchor links
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  }
  
  // Public methods
  getCurrentSection() {
    return this.components.navigation?.getCurrentSection();
  }
  
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
      section.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        window.scrollBy(0, -headerHeight);
      }, 100);
    }
  }
  
  // Static initialization method
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new PortfolioApp());
    } else {
      new PortfolioApp();
    }
  }
}

// Auto-initialize when script loads
PortfolioApp.init();

// Export for potential external use
export default PortfolioApp;