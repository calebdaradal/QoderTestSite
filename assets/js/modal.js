// Modal Component - modal.js
// Handles lightbox modal functionality for artwork viewing

import { trapFocus, lockBodyScroll, unlockBodyScroll, debounce } from './utils.js';

class Modal {
  constructor() {
    this.modal = document.querySelector('#lightbox-modal');
    this.modalTitle = document.querySelector('#modal-title');
    this.modalImage = document.querySelector('#modal-image');
    this.modalCategory = document.querySelector('#modal-category');
    this.modalYear = document.querySelector('#modal-year');
    this.modalMedium = document.querySelector('#modal-medium');
    this.modalDimensions = document.querySelector('#modal-dimensions');
    this.modalDescription = document.querySelector('#modal-description');
    this.prevBtn = document.querySelector('#modal-prev');
    this.nextBtn = document.querySelector('#modal-next');
    this.closeButtons = document.querySelectorAll('[data-modal-close]');
    
    this.currentGallery = [];
    this.currentIndex = 0;
    this.currentArtwork = null;
    this.isOpen = false;
    this.focusTrap = null;
    this.previouslyFocusedElement = null;
    
    this.init();
  }
  
  init() {
    if (!this.modal) return;
    
    this.setupEventListeners();
    this.setupKeyboardNavigation();
  }
  
  setupEventListeners() {
    // Listen for gallery open lightbox events
    document.addEventListener('openLightbox', (e) => {
      const { artwork, index, gallery } = e.detail;
      this.open(artwork, index, gallery);
    });
    
    // Close button events
    this.closeButtons.forEach(button => {
      button.addEventListener('click', () => this.close());
    });
    
    // Navigation button events
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.previous());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previous();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
      }
    });
    
    // Touch/swipe events for mobile
    this.setupTouchEvents();
    
    // Resize events
    const debouncedResize = debounce(() => this.handleResize(), 250);
    window.addEventListener('resize', debouncedResize);
  }
  
  setupKeyboardNavigation() {
    // Ensure modal elements are focusable
    if (this.prevBtn) this.prevBtn.setAttribute('tabindex', '0');
    if (this.nextBtn) this.nextBtn.setAttribute('tabindex', '0');
    
    this.closeButtons.forEach(button => {
      button.setAttribute('tabindex', '0');
    });
  }
  
  setupTouchEvents() {
    if (!this.modal) return;
    
    let startX = 0;
    let startY = 0;
    let distX = 0;
    let distY = 0;
    let startTime = 0;
    
    const threshold = 100; // Minimum distance for swipe
    const restraint = 50; // Maximum perpendicular distance
    const allowedTime = 300; // Maximum time for swipe
    
    this.modal.addEventListener('touchstart', (e) => {
      const touchObj = e.changedTouches[0];
      startX = touchObj.pageX;
      startY = touchObj.pageY;
      startTime = new Date().getTime();
    }, { passive: true });
    
    this.modal.addEventListener('touchend', (e) => {
      const touchObj = e.changedTouches[0];
      distX = touchObj.pageX - startX;
      distY = touchObj.pageY - startY;
      const elapsedTime = new Date().getTime() - startTime;
      
      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          if (distX > 0) {
            this.previous(); // Swipe right - previous image
          } else {
            this.next(); // Swipe left - next image
          }
        }
      }
    }, { passive: true });
  }
  
  open(artwork, index = 0, gallery = []) {
    if (!artwork || this.isOpen) return;
    
    this.currentArtwork = artwork;
    this.currentIndex = index;
    this.currentGallery = gallery;
    this.isOpen = true;
    
    // Store previously focused element
    this.previouslyFocusedElement = document.activeElement;
    
    // Update modal content
    this.updateContent();
    
    // Show modal
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.style.display = 'flex';
    
    // Lock body scroll
    lockBodyScroll();
    
    // Setup focus trap
    setTimeout(() => {
      this.focusTrap = trapFocus(this.modal);
    }, 100);
    
    // Add animation class
    requestAnimationFrame(() => {
      this.modal.classList.add('modal--open');
    });
    
    // Update navigation buttons
    this.updateNavigationButtons();
    
    // Announce modal opening for screen readers
    this.announceModalState('opened');
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    // Remove focus trap
    if (this.focusTrap) {
      this.focusTrap();
      this.focusTrap = null;
    }
    
    // Hide modal
    this.modal.classList.remove('modal--open');
    
    setTimeout(() => {
      this.modal.setAttribute('aria-hidden', 'true');
      this.modal.style.display = 'none';
      
      // Unlock body scroll
      unlockBodyScroll();
      
      // Restore focus
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }
    }, 300);
    
    // Announce modal closing for screen readers
    this.announceModalState('closed');
  }
  
  next() {
    if (this.currentGallery.length <= 1) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.currentGallery.length;
    this.currentArtwork = this.currentGallery[this.currentIndex];
    
    this.updateContent();
    this.updateNavigationButtons();
    this.announceNavigation('next');
  }
  
  previous() {
    if (this.currentGallery.length <= 1) return;
    
    this.currentIndex = this.currentIndex === 0 
      ? this.currentGallery.length - 1 
      : this.currentIndex - 1;
    this.currentArtwork = this.currentGallery[this.currentIndex];
    
    this.updateContent();
    this.updateNavigationButtons();
    this.announceNavigation('previous');
  }
  
  updateContent() {
    if (!this.currentArtwork) return;
    
    const artwork = this.currentArtwork;
    
    // Update text content
    if (this.modalTitle) {
      this.modalTitle.textContent = artwork.title;
    }
    
    if (this.modalCategory) {
      this.modalCategory.textContent = this.formatCategory(artwork.category);
    }
    
    if (this.modalYear) {
      this.modalYear.textContent = artwork.year;
    }
    
    if (this.modalMedium) {
      this.modalMedium.textContent = artwork.medium;
    }
    
    if (this.modalDimensions) {
      this.modalDimensions.textContent = artwork.dimensions;
    }
    
    if (this.modalDescription) {
      this.modalDescription.textContent = artwork.description;
    }
    
    // Update image
    if (this.modalImage) {
      // Show loading state
      this.modalImage.style.opacity = '0.5';
      
      // Create new image to preload
      const newImg = new Image();
      newImg.onload = () => {
        this.modalImage.src = artwork.fullSize;
        this.modalImage.alt = artwork.alt;
        this.modalImage.style.opacity = '1';
      };
      newImg.onerror = () => {
        this.modalImage.alt = 'Image failed to load';
        this.modalImage.style.opacity = '1';
      };
      newImg.src = artwork.fullSize;
    }
    
    // Update modal title for accessibility
    this.modal.setAttribute('aria-labelledby', 'modal-title');
  }
  
  updateNavigationButtons() {
    const hasMultipleImages = this.currentGallery.length > 1;
    const isFirst = this.currentIndex === 0;
    const isLast = this.currentIndex === this.currentGallery.length - 1;
    
    if (this.prevBtn) {
      this.prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
      this.prevBtn.disabled = !hasMultipleImages;
      this.prevBtn.setAttribute('aria-label', 
        `Previous image (${this.currentIndex} of ${this.currentGallery.length})`
      );
    }
    
    if (this.nextBtn) {
      this.nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
      this.nextBtn.disabled = !hasMultipleImages;
      this.nextBtn.setAttribute('aria-label', 
        `Next image (${this.currentIndex + 2} of ${this.currentGallery.length})`
      );
    }
  }
  
  handleResize() {
    if (!this.isOpen) return;
    
    // Recalculate modal dimensions if needed
    // This ensures the modal stays properly sized on orientation changes
  }
  
  formatCategory(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  announceModalState(state) {
    const message = state === 'opened' 
      ? `Lightbox opened. Viewing ${this.currentArtwork?.title || 'artwork'}.`
      : 'Lightbox closed.';
    
    this.announce(message);
  }
  
  announceNavigation(direction) {
    const position = `${this.currentIndex + 1} of ${this.currentGallery.length}`;
    const message = `${direction === 'next' ? 'Next' : 'Previous'} image. Now viewing ${this.currentArtwork?.title || 'artwork'}. Image ${position}.`;
    
    this.announce(message);
  }
  
  announce(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
  
  // Public methods
  getCurrentArtwork() {
    return this.currentArtwork;
  }
  
  getCurrentIndex() {
    return this.currentIndex;
  }
  
  getGallery() {
    return this.currentGallery;
  }
  
  isModalOpen() {
    return this.isOpen;
  }
  
  goToIndex(index) {
    if (index >= 0 && index < this.currentGallery.length) {
      this.currentIndex = index;
      this.currentArtwork = this.currentGallery[this.currentIndex];
      this.updateContent();
      this.updateNavigationButtons();
    }
  }
  
  // Static initialization method
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new Modal());
    } else {
      new Modal();
    }
  }
}

// Auto-initialize when script loads
Modal.init();

// Export for potential external use
export default Modal;