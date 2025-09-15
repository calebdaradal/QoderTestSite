// Navigation Component - navigation.js
// Handles navigation behavior, smooth scrolling, and active states

// Utility functions (copied from utils.js for standalone operation)
function smoothScrollTo(target, offset = 0, duration = 800) {
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

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, wait, immediate = false) {
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

class Navigation {
  constructor() {
    this.header = document.querySelector('.header');
    this.navbar = document.querySelector('.navbar');
    this.navLinks = document.querySelectorAll('.navbar__link');
    this.mobileToggle = document.querySelector('.navbar__toggle');
    this.mobileMenu = null;
    this.sections = [];
    this.currentSection = 'home';
    this.isScrolling = false;
    this.lastScrollY = 0;
    
    this.init();
  }
  
  init() {
    this.setupSections();
    this.setupEventListeners();
    this.setupMobileMenu();
    this.updateActiveSection();
    
    // Initial scroll position check
    this.handleScroll();
  }
  
  setupSections() {
    // Get all sections with IDs that correspond to navigation links
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const sectionId = href.substring(1);
        const section = document.getElementById(sectionId);
        if (section) {
          this.sections.push({
            id: sectionId,
            element: section,
            link: link,
            offset: this.getHeaderHeight()
          });
        }
      }
    });
  }
  
  setupEventListeners() {
    // Smooth scroll on navigation link clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetSection = document.getElementById(targetId);
          
          if (targetSection) {
            this.scrollToSection(targetSection, targetId);
            this.closeMobileMenu();
          }
        }
      });
    });
    
    // Scroll events for active section detection and header styling
    const throttledScroll = throttle(() => this.handleScroll(), 10);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Resize events for recalculating section positions
    const debouncedResize = debounce(() => this.handleResize(), 250);
    window.addEventListener('resize', debouncedResize);
    
    // Mobile toggle events
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
    }
    
    // Keyboard navigation
    this.setupKeyboardNavigation();
  }
  
  setupMobileMenu() {
    // Create mobile menu overlay
    this.mobileMenu = document.createElement('div');
    this.mobileMenu.className = 'navbar__menu navbar__menu--mobile';
    this.mobileMenu.setAttribute('role', 'menu');
    this.mobileMenu.setAttribute('aria-hidden', 'true');
    
    // Clone navigation links for mobile menu
    this.navLinks.forEach(link => {
      const mobileLink = link.cloneNode(true);
      mobileLink.setAttribute('role', 'menuitem');
      mobileLink.addEventListener('click', (e) => {
        e.preventDefault();
        const href = mobileLink.getAttribute('href');
        
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetSection = document.getElementById(targetId);
          
          if (targetSection) {
            this.scrollToSection(targetSection, targetId);
            this.closeMobileMenu();
          }
        }
      });
      this.mobileMenu.appendChild(mobileLink);
    });
    
    document.body.appendChild(this.mobileMenu);
    
    // Close menu on backdrop click
    this.mobileMenu.addEventListener('click', (e) => {
      if (e.target === this.mobileMenu) {
        this.closeMobileMenu();
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileMenuOpen()) {
        this.closeMobileMenu();
      }
    });
  }
  
  setupKeyboardNavigation() {
    // Handle keyboard navigation for menu items
    this.navLinks.forEach((link, index) => {
      link.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = index > 0 ? index - 1 : this.navLinks.length - 1;
            this.navLinks[prevIndex].focus();
            break;
            
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = index < this.navLinks.length - 1 ? index + 1 : 0;
            this.navLinks[nextIndex].focus();
            break;
            
          case 'Home':
            e.preventDefault();
            this.navLinks[0].focus();
            break;
            
          case 'End':
            e.preventDefault();
            this.navLinks[this.navLinks.length - 1].focus();
            break;
        }
      });
    });
  }
  
  handleScroll() {
    const scrollY = window.pageYOffset;
    const headerHeight = this.getHeaderHeight();
    
    // Update header styling based on scroll position
    this.updateHeaderStyle(scrollY);
    
    // Update active section
    this.updateActiveSection();
    
    this.lastScrollY = scrollY;
  }
  
  handleResize() {
    // Recalculate section offsets on resize
    this.sections.forEach(section => {
      section.offset = this.getHeaderHeight();
    });
    
    // Close mobile menu on resize to larger screen
    if (window.innerWidth >= 768 && this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }
  
  updateHeaderStyle(scrollY) {
    if (!this.header) return;
    
    // Add scrolled class when scrolled past header height
    const headerHeight = this.getHeaderHeight();
    
    if (scrollY > headerHeight / 2) {
      this.header.classList.add('header--scrolled');
    } else {
      this.header.classList.remove('header--scrolled');
    }
  }
  
  updateActiveSection() {
    if (this.isScrolling) return;
    
    const scrollY = window.pageYOffset;
    const headerHeight = this.getHeaderHeight();
    const windowHeight = window.innerHeight;
    
    let activeSection = null;
    let maxVisibility = 0;
    
    // Find the section with the most visibility
    this.sections.forEach(section => {
      const rect = section.element.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const sectionBottom = sectionTop + rect.height;
      const viewportTop = scrollY + headerHeight;
      const viewportBottom = scrollY + windowHeight;
      
      // Calculate how much of the section is visible
      const visibleTop = Math.max(sectionTop, viewportTop);
      const visibleBottom = Math.min(sectionBottom, viewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibility = visibleHeight / rect.height;
      
      if (visibility > maxVisibility) {
        maxVisibility = visibility;
        activeSection = section;
      }
    });
    
    if (activeSection && activeSection.id !== this.currentSection) {
      this.setActiveSection(activeSection.id);
    }
  }
  
  setActiveSection(sectionId) {
    // Remove active class from all links
    this.navLinks.forEach(link => {
      link.classList.remove('navbar__link--active');
      link.removeAttribute('aria-current');
    });
    
    // Add active class to current section link
    const activeLink = document.querySelector(`.navbar__link[href="#${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('navbar__link--active');
      activeLink.setAttribute('aria-current', 'page');
    }
    
    // Update mobile menu links
    const mobileLinkSelector = `.navbar__menu--mobile .navbar__link[href="#${sectionId}"]`;
    const activeMobileLink = document.querySelector(mobileLinkSelector);
    if (activeMobileLink) {
      // Remove active from all mobile links
      const mobileLinks = document.querySelectorAll('.navbar__menu--mobile .navbar__link');
      mobileLinks.forEach(link => {
        link.classList.remove('navbar__link--active');
        link.removeAttribute('aria-current');
      });
      
      activeMobileLink.classList.add('navbar__link--active');
      activeMobileLink.setAttribute('aria-current', 'page');
    }
    
    this.currentSection = sectionId;
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('sectionchange', {
      detail: { section: sectionId }
    }));
  }
  
  scrollToSection(section, sectionId) {
    if (!section) return;
    
    this.isScrolling = true;
    const headerHeight = this.getHeaderHeight();
    
    // Set active state immediately for better UX
    this.setActiveSection(sectionId);
    
    smoothScrollTo(section, headerHeight, 800);
    
    // Reset scrolling flag after animation
    setTimeout(() => {
      this.isScrolling = false;
    }, 900);
  }
  
  toggleMobileMenu() {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
  
  openMobileMenu() {
    if (!this.mobileMenu || !this.mobileToggle) return;
    
    this.mobileMenu.classList.add('active');
    this.mobileMenu.setAttribute('aria-hidden', 'false');
    this.mobileToggle.setAttribute('aria-expanded', 'true');
    
    // Focus first menu item
    const firstMenuItem = this.mobileMenu.querySelector('.navbar__link');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 100);
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  closeMobileMenu() {
    if (!this.mobileMenu || !this.mobileToggle) return;
    
    this.mobileMenu.classList.remove('active');
    this.mobileMenu.setAttribute('aria-hidden', 'true');
    this.mobileToggle.setAttribute('aria-expanded', 'false');
    
    // Return focus to toggle button
    this.mobileToggle.focus();
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
  
  isMobileMenuOpen() {
    return this.mobileMenu && this.mobileMenu.classList.contains('active');
  }
  
  getHeaderHeight() {
    if (!this.header) return 0;
    return this.header.offsetHeight;
  }
  
  // Public methods
  goToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      this.scrollToSection(section, sectionId);
    }
  }
  
  getCurrentSection() {
    return this.currentSection;
  }
  
  // Initialize navigation when DOM is ready
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new Navigation());
    } else {
      new Navigation();
    }
  }
}

// Auto-initialize when script loads
Navigation.init();

// Export for potential external use
window.Navigation = Navigation;