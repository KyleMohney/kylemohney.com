// ======================================================
// renderManager.js
// ======================================================
// Purpose: Handles rendering of featured heros and articles

let articleData = null;
let currentTab = 'client';

// ======================================================
// 1. LOAD ARTICLE DATA
// ======================================================
async function loadArticleData() {
  try {
    const response = await fetch('/rooted-vitality/data/articles.json');
    articleData = await response.json();
    console.log('Article data loaded successfully');
  } catch (error) {
    console.error('Error loading article data:', error);
  }
}

// ======================================================
// 2. RENDER FEATURED HEROS
// ======================================================
function renderFeaturedHeros() {
  const tabData = articleData[currentTab];
  const featured = tabData.featured;
  const featuredHeros = document.getElementById('featuredHeros');
  
  featuredHeros.innerHTML = '';
  
  featured.forEach((article, index) => {
    // After first hero, insert the search & articles section
    if (index === 1) {
      const searchSection = document.createElement('div');
      searchSection.className = 'search-articles-section-inline';
      
      const title = document.createElement('h2');
      title.id = 'articlesTitle-inline';
      title.textContent = 'Explore More Articles';
      
      const searchContainer = document.createElement('div');
      searchContainer.className = 'search-container';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'search-bar';
      searchInput.id = 'searchInput-inline';
      searchInput.placeholder = 'Search help articles…';
      searchInput.setAttribute('aria-label', 'Search help articles');
      
      const articlesGrid = document.createElement('div');
      articlesGrid.className = 'articles-grid';
      articlesGrid.id = 'articleGrid-inline';
      
      searchContainer.appendChild(searchInput);
      searchSection.appendChild(title);
      searchSection.appendChild(searchContainer);
      searchSection.appendChild(articlesGrid);
      
      featuredHeros.appendChild(searchSection);
      
      // Render articles in the inline grid
      renderArticlesInline(articlesGrid, searchInput);
    }
    
    const heroSection = document.createElement('div');
    heroSection.className = 'hero-section';
    
    // Add tab indicator class for different layouts
    if (currentTab === 'practitioner') {
      heroSection.classList.add('practitioner-hero');
      if (index === 1) {
        heroSection.classList.add('practitioner-second');
      }
    } else if (currentTab === 'client') {
      heroSection.classList.add('client-hero');
      if (index === 1) {
        heroSection.classList.add('client-second');
      }
    }
    
    const content = document.createElement('div');
    content.className = 'hero-content';
    
    const heroTitle = document.createElement('h2');
    heroTitle.textContent = article.title;
    
    const description = document.createElement('p');
    description.textContent = article.description;
    
    const link = document.createElement('a');
    link.href = article.url;
    link.className = 'hero-cta';
    link.textContent = 'Read the Full Guide';
    
    content.appendChild(heroTitle);
    content.appendChild(description);
    content.appendChild(link);
    
    heroSection.appendChild(content);
    
    // Image logic
    if (currentTab === 'client') {
      if (index === 0) {
        const img = document.createElement('img');
        img.src = '/assets/hero2.PNG';
        img.alt = article.title;
        img.className = 'hero-image';
        heroSection.appendChild(img);
      } else {
        const img = document.createElement('img');
        img.src = '/assets/hero1c.PNG';
        img.alt = article.title;
        img.className = 'hero-image';
        heroSection.appendChild(img);
      }
    } else if (currentTab === 'practitioner') {
      if (index === 0) {
        const img = document.createElement('img');
        img.src = '/assets/phero1b.png';
        img.alt = article.title;
        img.className = 'hero-image';
        heroSection.appendChild(img);
      } else {
        const img = document.createElement('img');
        img.src = '/assets/phero2d.png';
        img.alt = article.title;
        img.className = 'hero-image';
        heroSection.appendChild(img);
      }
    }
    
    featuredHeros.appendChild(heroSection);
  });
}

// ======================================================
// 3. RENDER ARTICLES IN INLINE SECTION
// ======================================================
function renderArticlesInline(gridContainer, searchInput) {
  const tabData = articleData[currentTab];
  const allArticles = tabData.other || [];
  
  function filterAndRender() {
    const query = searchInput.value.toLowerCase();
    gridContainer.innerHTML = '';
    
    allArticles.forEach(article => {
      if (article.title.toLowerCase().includes(query)) {
        const card = document.createElement('div');
        card.className = 'article-card';
        
        const cardTitle = document.createElement('h3');
        cardTitle.textContent = article.title;
        
        const cardLink = document.createElement('a');
        cardLink.href = article.url;
        cardLink.textContent = 'Read Article';
        
        card.appendChild(cardTitle);
        card.appendChild(cardLink);
        gridContainer.appendChild(card);
      }
    });
  }
  
  filterAndRender();
  searchInput.addEventListener('input', filterAndRender);
}

// ======================================================
// 4. RENDER ARTICLE GRID (MAIN SECTION)
// ======================================================
function renderArticles() {
  const tabData = articleData[currentTab];
  const allArticles = tabData.other;
  const searchInput = document.getElementById('searchInput');
  const articleGrid = document.getElementById('articleGrid');
  const searchTerm = searchInput.value.toLowerCase();
  
  articleGrid.innerHTML = '';
  
  allArticles.forEach(article => {
    if (article.title.toLowerCase().includes(searchTerm)) {
      const card = document.createElement('div');
      card.className = 'article-card';
      
      const link = document.createElement('a');
      link.href = article.url;
      link.textContent = article.title;
      
      card.appendChild(link);
      articleGrid.appendChild(card);
    }
  });
}

// ======================================================
// 5. UPDATE TAB STATE & RE-RENDER
// ======================================================
function setCurrentTab(tabType) {
  currentTab = tabType;
  renderFeaturedHeros();
  renderArticles();
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
}

// ======================================================
// 6. HANDLE SEARCH INPUT
// ======================================================
function handleSearch() {
  renderArticles();
}

// Export functions
window.renderManager = {
  loadArticleData,
  renderFeaturedHeros,
  renderArticles,
  setCurrentTab,
  handleSearch
};
