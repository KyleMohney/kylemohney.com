/**
 * Scroll-triggered animations for landing page elements
 * Animates elements as they come into view with staggered timing
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const animationObserver = new IntersectionObserver(function(entries) {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add animation class with staggered delay
        const delay = index * 100; // 100ms stagger between elements
        setTimeout(() => {
          entry.target.classList.add('animate-fade-in-up');
        }, delay);
        
        // Stop observing once animated
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply observer to wellness cards
  const wellnessCards = document.querySelectorAll('.wellness-card');
  wellnessCards.forEach(card => {
    animationObserver.observe(card);
  });

  // Apply observer to help center cards if they exist
  const helpCenterCards = document.querySelectorAll('.help-center__card');
  helpCenterCards.forEach(card => {
    animationObserver.observe(card);
  });

  // Apply observer to client story card
  const clientStoryCard = document.querySelector('.client-story__card');
  if (clientStoryCard) {
    animationObserver.observe(clientStoryCard);
  }

  // Apply observer to featured story card
  const featuredStoryCard = document.querySelector('.featured-story__card');
  if (featuredStoryCard) {
    animationObserver.observe(featuredStoryCard);
  }
});
