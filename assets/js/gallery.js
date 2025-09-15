// Gallery Component - gallery.js
// Handles gallery functionality including filtering, lightbox, and image loading

import { debounce, lazyLoadImages, generateId, trapFocus } from './utils.js';

// Sample artwork data - in a real application, this would come from an API
const artworkData = [
  {
    id: 'artwork-001',
    title: 'Mystical Forest',
    category: 'illustration',
    collection: 'fantasy-series',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=900&fit=crop&crop=center',
    alt: 'Digital illustration of mystical forest scene with ethereal lighting',
    dimensions: '3000x4000',
    year: 2024,
    medium: 'Digital Painting',
    description: 'An atmospheric forest scene with magical elements and mystical creatures hidden among ancient trees.'
  },
  {
    id: 'artwork-002',
    title: 'Cyberpunk City',
    category: 'concept-art',
    collection: 'sci-fi-series',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=900&fit=crop&crop=center',
    alt: 'Futuristic cyberpunk cityscape with neon lights and flying vehicles',
    dimensions: '4000x3000',
    year: 2024,
    medium: 'Digital Painting',
    description: 'A bustling cyberpunk metropolis featuring towering skyscrapers, neon advertisements, and advanced technology.'
  },
  {
    id: 'artwork-003',
    title: 'Dragon Warrior',
    category: 'character-design',
    collection: 'fantasy-series',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=900&fit=crop&crop=center',
    alt: 'Detailed character design of a powerful dragon warrior in ornate armor',
    dimensions: '2400x3600',
    year: 2024,
    medium: 'Digital Painting',
    description: 'A fierce dragon warrior character design featuring intricate armor and mystical weaponry.'
  },
  {
    id: 'artwork-004',
    title: 'Enchanted Castle',
    category: 'environment',
    collection: 'fantasy-series',
    thumbnail: 'https://images.unsplash.com/photo-1520637836862-4d197d17c86a?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1520637836862-4d197d17c86a?w=1200&h=900&fit=crop&crop=center',
    alt: 'Majestic enchanted castle perched on a floating island',
    dimensions: '5000x3000',
    year: 2023,
    medium: 'Digital Painting',
    description: 'A magical castle floating among the clouds, surrounded by mystical energy and ancient magic.'
  },
  {
    id: 'artwork-005',
    title: 'Steampunk Inventor',
    category: 'character-design',
    collection: 'steampunk-series',
    thumbnail: 'https://images.unsplash.com/photo-1551550029-12c7dd043ba8?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1551550029-12c7dd043ba8?w=1200&h=900&fit=crop&crop=center',
    alt: 'Steampunk inventor character with mechanical gadgets and brass accessories',
    dimensions: '2800x3500',
    year: 2023,
    medium: 'Digital Painting',
    description: 'A brilliant steampunk inventor surrounded by mechanical contraptions and brass instruments.'
  },
  {
    id: 'artwork-006',
    title: 'Cosmic Nebula',
    category: 'illustration',
    collection: 'space-series',
    thumbnail: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop&crop=center',
    fullSize: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&h=900&fit=crop&crop=center',
    alt: 'Vibrant cosmic nebula with swirling gases and distant stars',
    dimensions: '4500x3000',
    year: 2023,
    medium: 'Digital Painting',
    description: 'A stunning cosmic vista featuring a colorful nebula with swirling gases and celestial phenomena.'
  }
];

class Gallery {
  constructor() {
    this.galleryGrid = document.querySelector('#gallery-grid');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.loadMoreBtn = document.querySelector('#load-more-btn');
    this.currentFilter = 'all';
    this.itemsPerPage = 6;
    this.currentPage = 1;
    this.maxPages = 1;
    this.artwork = artworkData;
    this.filteredArtwork = [];
    
    this.init();
  }
  
  init() {
    if (!this.galleryGrid) return;
    
    this.setupEventListeners();
    this.filterArtwork('all');
    this.setupIntersectionObserver();
  }
  
  setupEventListeners() {
    // Filter button events
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.handleFilterChange(filter, e.target);
      });
      
      // Keyboard support for filter buttons
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const filter = e.target.dataset.filter;
          this.handleFilterChange(filter, e.target);
        }
      });
    });
    
    // Load more button event
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.loadMoreArtwork();
      });
    }
    
    // Keyboard navigation for gallery items
    this.galleryGrid.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }
  
  setupIntersectionObserver() {
    // Lazy load images as they come into view
    lazyLoadImages('.artwork-card__image[data-src]', {
      rootMargin: '100px 0px',
      threshold: 0.1
    });
  }
  
  handleFilterChange(filter, button) {
    // Update active filter button
    this.filterButtons.forEach(btn => {
      btn.classList.remove('filter-btn--active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    button.classList.add('filter-btn--active');
    button.setAttribute('aria-selected', 'true');
    
    // Filter and display artwork
    this.currentFilter = filter;
    this.currentPage = 1;
    this.filterArtwork(filter);
    
    // Announce filter change for screen readers
    this.announceFilterChange(filter);
  }
  
  filterArtwork(category) {
    // Filter artwork based on category
    if (category === 'all') {
      this.filteredArtwork = [...this.artwork];
    } else {
      this.filteredArtwork = this.artwork.filter(item => item.category === category);
    }
    
    // Calculate pagination
    this.maxPages = Math.ceil(this.filteredArtwork.length / this.itemsPerPage);
    
    // Render artwork
    this.renderArtwork(true);
    this.updateLoadMoreButton();
  }
  
  loadMoreArtwork() {
    if (this.currentPage < this.maxPages) {
      this.currentPage++;
      this.renderArtwork(false);
      this.updateLoadMoreButton();
    }
  }
  
  renderArtwork(replace = false) {
    const startIndex = replace ? 0 : (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = this.currentPage * this.itemsPerPage;
    const artworkToShow = this.filteredArtwork.slice(startIndex, endIndex);
    
    if (replace) {
      this.galleryGrid.innerHTML = '';
    }
    
    artworkToShow.forEach((artwork, index) => {
      const artworkCard = this.createArtworkCard(artwork);
      this.galleryGrid.appendChild(artworkCard);
      
      // Stagger animation for visual appeal
      setTimeout(() => {
        artworkCard.classList.add('fade-in');
      }, index * 100);
    });
    
    // Re-setup lazy loading for new images
    this.setupIntersectionObserver();
  }
  
  createArtworkCard(artwork) {
    const card = document.createElement('article');
    card.className = 'artwork-card';
    card.setAttribute('role', 'img');
    card.setAttribute('aria-labelledby', `artwork-title-${artwork.id}`);
    card.setAttribute('data-artwork-id', artwork.id);
    card.setAttribute('tabindex', '0');
    
    card.innerHTML = `
      <img 
        class="artwork-card__image" 
        data-src="${artwork.thumbnail}"
        alt="${artwork.alt}"
        loading="lazy"
      />
      <div class="artwork-card__overlay">
        <h3 class="artwork-card__title" id="artwork-title-${artwork.id}">
          ${artwork.title}
        </h3>
        <p class="artwork-card__category">${this.formatCategory(artwork.category)}</p>
      </div>
    `;
    
    // Click event to open lightbox
    card.addEventListener('click', () => {
      this.openLightbox(artwork.id);
    });
    
    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openLightbox(artwork.id);
      }
    });
    
    return card;
  }
  
  formatCategory(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  openLightbox(artworkId) {
    const artwork = this.artwork.find(item => item.id === artworkId);
    if (!artwork) return;
    
    const artworkIndex = this.filteredArtwork.findIndex(item => item.id === artworkId);
    
    // Create and dispatch custom event
    document.dispatchEvent(new CustomEvent('openLightbox', {
      detail: {
        artwork,
        index: artworkIndex,
        gallery: this.filteredArtwork
      }
    }));
  }
  
  updateLoadMoreButton() {
    if (!this.loadMoreBtn) return;
    
    if (this.currentPage >= this.maxPages) {
      this.loadMoreBtn.style.display = 'none';
    } else {
      this.loadMoreBtn.style.display = 'inline-flex';
      const remainingItems = this.filteredArtwork.length - (this.currentPage * this.itemsPerPage);
      this.loadMoreBtn.textContent = `Load ${Math.min(remainingItems, this.itemsPerPage)} More`;
    }
  }
  
  handleKeyboardNavigation(e) {
    const focusableCards = this.galleryGrid.querySelectorAll('.artwork-card[tabindex="0"]');
    const currentIndex = Array.from(focusableCards).indexOf(document.activeElement);
    
    if (currentIndex === -1) return;
    
    const cols = this.getGridColumns();
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : focusableCards.length - 1;
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < focusableCards.length - 1 ? currentIndex + 1 : 0;
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex - cols;
        if (newIndex < 0) {
          newIndex = focusableCards.length + newIndex;
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + cols) % focusableCards.length;
        break;
        
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
        
      case 'End':
        e.preventDefault();
        newIndex = focusableCards.length - 1;
        break;
    }
    
    if (focusableCards[newIndex]) {
      focusableCards[newIndex].focus();
    }
  }
  
  getGridColumns() {
    const computedStyle = window.getComputedStyle(this.galleryGrid);
    const gridColumns = computedStyle.getPropertyValue('grid-template-columns');
    return gridColumns.split(' ').length;
  }
  
  announceFilterChange(filter) {
    const filterText = filter === 'all' ? 'all artwork' : this.formatCategory(filter);
    const count = this.filteredArtwork.length;
    const message = `Showing ${count} ${count === 1 ? 'item' : 'items'} in ${filterText}`;
    
    // Create announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  // Public methods for external use
  getCurrentFilter() {
    return this.currentFilter;
  }
  
  getArtworkById(id) {
    return this.artwork.find(item => item.id === id);
  }
  
  getFilteredArtwork() {
    return this.filteredArtwork;
  }
  
  addArtwork(newArtwork) {
    if (Array.isArray(newArtwork)) {
      this.artwork.push(...newArtwork);
    } else {
      this.artwork.push(newArtwork);
    }
    
    // Refresh current filter
    this.filterArtwork(this.currentFilter);
  }
  
  // Static initialization method
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new Gallery());
    } else {
      new Gallery();
    }
  }
}

// Auto-initialize when script loads
Gallery.init();

// Export for potential external use
export default Gallery;