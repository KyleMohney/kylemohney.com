/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: landing-page.js                                             ║
║  Purpose: Landing page interactivity and carousel functionality    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. CATEGORIES SCROLL HANDLER & TESTIMONIAL CAROUSEL
   2. SCROLL ANIMATIONS
   3. FORM INTERACTIONS
   4. UTILITY FUNCTIONS
   5. INITIALIZATION
*/

/* ======================================================
   1. CATEGORIES SCROLL HANDLER
   ====================================================== */

class CategoriesScroll {
  constructor() {
    this.track = document.querySelector('.categories-scroll__track');
    
    if (!this.track) return;

    this.scrollAmount = 200; // Scroll distance per arrow key / button click
    this.init();
  }

  init() {
    // Add keyboard scroll support
    this.addKeyboardScroll();
    
    // Add mouse drag scroll support
    this.addDragScroll();
    
    // Log that scroll is active

  }

  addKeyboardScroll() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.track.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        this.track.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
      }
    });
  }

  addDragScroll() {
    let isDown = false;
    let startX;
    let scrollLeft;

    this.track.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - this.track.offsetLeft;
      scrollLeft = this.track.scrollLeft;
      this.track.style.cursor = 'grabbing';
      this.track.style.scrollSnapType = 'none';
    });

    document.addEventListener('mouseleave', () => {
      isDown = false;
      this.track.style.cursor = 'grab';
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      this.track.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - this.track.offsetLeft;
      const walk = (x - startX) * 1.5;
      this.track.scrollLeft = scrollLeft - walk;
    });

    // Touch support for mobile
    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX - this.track.offsetLeft;
      scrollLeft = this.track.scrollLeft;
    });

    this.track.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX - this.track.offsetLeft;
      const walk = (x - startX) * 1.5;
      this.track.scrollLeft = scrollLeft - walk;
    });
  }
}

/* ======================================================
   1. TESTIMONIAL CAROUSEL
   ====================================================== */

class TestimonialCarousel {
  constructor(containerSelector = '.testimonial-carousel') {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.track = this.container.querySelector('.testimonial-carousel__track');
    this.testimonials = this.container.querySelectorAll('.testimonial');
    this.prevBtn = this.container.querySelector('.carousel-btn--prev');
    this.nextBtn = this.container.querySelector('.carousel-btn--next');
    this.dots = this.container.querySelectorAll('.carousel-dot');

    this.currentSlide = 0;
    this.totalSlides = this.testimonials.length;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000; // 5 seconds

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.startAutoplay();
  }

  attachEventListeners() {
    // Previous button
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.prevSlide();
      });
    }

    // Next button
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.nextSlide();
      });
    }

    // Dot indicators
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToSlide(index);
        this.resetAutoplay();
      });
    });

    // Pause autoplay on user interaction
    this.container.addEventListener('mouseenter', () => this.stopAutoplay());
    this.container.addEventListener('mouseleave', () => this.startAutoplay());

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });
  }

  goToSlide(index) {
    // Remove active class from all
    this.testimonials.forEach(t => t.classList.remove('testimonial--active'));
    this.dots.forEach(d => d.classList.remove('carousel-dot--active'));

    // Add active class to current
    this.currentSlide = index;
    this.testimonials[this.currentSlide].classList.add('testimonial--active');
    this.dots[this.currentSlide].classList.add('carousel-dot--active');

    // Update aria-current for accessibility
    this.dots.forEach((dot, i) => {
      if (i === this.currentSlide) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.totalSlides;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.goToSlide(prevIndex);
  }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplayDelay);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  resetAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  destroy() {
    this.stopAutoplay();
    if (this.prevBtn) this.prevBtn.removeEventListener('click', null);
    if (this.nextBtn) this.nextBtn.removeEventListener('click', null);
    this.dots.forEach(dot => dot.removeEventListener('click', null));
  }
}

/* ======================================================
   2. SCROLL ANIMATIONS
   ====================================================== */

class ScrollAnimations {
  constructor() {
    this.observer = this.createObserver();
    this.animateElements();
  }

  createObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-on-scroll');
          this.observer.unobserve(entry.target); // Only animate once
        }
      });
    }, options);
  }

  animateElements() {
    // Animate cards on scroll (NOT sections - sections should be visible)
    const cards = document.querySelectorAll('.testimonial, .process-step, .category-card, .badge, .stat');
    cards.forEach(card => {
      this.observer.observe(card);
    });
  }

  disconnect() {
    this.observer.disconnect();
  }
}

/* ======================================================
   3. FORM INTERACTIONS
   ====================================================== */

class FormInteractions {
  constructor() {
    this.forms = document.querySelectorAll('.hero__search-form, .final-cta__search-form');
    this.init();
  }

  init() {
    this.forms.forEach(form => {
      // Smooth focus states (handled via CSS)
      const inputs = form.querySelectorAll('input');

      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          input.parentElement.classList.add('search-form__group--focused');
        });

        input.addEventListener('blur', () => {
          input.parentElement.classList.remove('search-form__group--focused');
        });
      });

      // Form submission (prevent default for now)
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch(form);
      });
    });
  }

  handleSearch(form) {
    const what = form.querySelector('.search-form__input--what').value;
    const location = form.querySelector('.search-form__input--location').value;

    if (!what || !location) {
      console.warn('Please fill in all search fields');
      return;
    }

    // TODO: Implement actual search functionality

    // Example: window.location.href = `/search?what=${encodeURIComponent(what)}&location=${encodeURIComponent(location)}`;
  }
}

/* ======================================================
   4. UTILITY FUNCTIONS
   ====================================================== */

/**
 * Lazy load images below the fold
 */
function setupLazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
  }
}

/**
 * Smooth scroll to section
 */
function smoothScrollToSection(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Add smooth scroll behavior to all anchor links
 */
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        smoothScrollToSection(href);
      }
    });
  });
}

/**
 * Debounce function for resize events
 */
function debounce(func, delay = 250) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Mobile detection
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/* ======================================================
   5. INITIALIZATION
   ====================================================== */

/**
 * Initialize all landing page features when DOM is ready
 */
function initLandingPage() {
  // Only run on landing page
  if (!document.body.classList.contains('landing-page')) {
    return;
  }

  // Initialize categories scroll
  const categoriesScroll = new CategoriesScroll();

  // Initialize testimonial carousel
  const carousel = new TestimonialCarousel();

  // Initialize scroll animations
  const scrollAnimations = new ScrollAnimations();

  // Initialize form interactions
  const formInteractions = new FormInteractions();

  // Setup lazy loading
  setupLazyLoadImages();

  // Setup smooth scrolling
  setupSmoothScrolling();

  // Log successful initialization

}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLandingPage);
} else {
  initLandingPage();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Cleanup carousel if needed
  if (window.carousel) {
    window.carousel.destroy();
  }
});

























































